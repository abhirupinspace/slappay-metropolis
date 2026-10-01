import "dotenv/config";
import { BaseError, ContractFunctionRevertedError, createPublicClient, createWalletClient, formatUnits, http, parseUnits, type Address, type Hash } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { getChain, getDeployment, SpendingPolicyAbi, explorerTxUrl } from "@slappay/core";

/**
 * Slappay agent CLI. The agent never holds the owner's funds or keys; every payment
 * goes through SpendingPolicy.spend(), which reverts if any limit is violated.
 *
 *   agent keygen                      -> print a fresh agent key + address
 *   agent status                      -> policy limits, remaining budget
 *   agent pay <to> <usdc> [memo]      -> direct policy-routed payment
 *   agent fetch <url>                 -> x402: GET, pay the 402 via policy, retry
 */
const [cmd, ...args] = process.argv.slice(2);

const chainId = Number(process.env.CHAIN_ID ?? 10143);
const chain = getChain(chainId);
const rpc = process.env.RPC_URL ?? chain.rpcUrls.default.http[0];
const publicClient = createPublicClient({ chain, transport: http(rpc) });

function account() {
  const pk = process.env.AGENT_PRIVATE_KEY as `0x${string}` | undefined;
  if (!pk) die("AGENT_PRIVATE_KEY not set. Run `agent keygen`.");
  return privateKeyToAccount(pk);
}
function policyId(): bigint {
  const id = process.env.POLICY_ID;
  if (!id) die("POLICY_ID not set.");
  return BigInt(id);
}
function die(msg: string): never {
  console.error("✗", msg);
  process.exit(1);
}
function reason(e: unknown): string {
  if (e instanceof BaseError) {
    const r = e.walk((x) => x instanceof ContractFunctionRevertedError);
    if (r instanceof ContractFunctionRevertedError) {
      const args = r.data?.args?.map(String).join(", ");
      return `reverted: ${r.data?.errorName ?? r.reason ?? "unknown"}${args ? `(${args})` : ""}`;
    }
    return e.shortMessage;
  }
  return e instanceof Error ? e.message : String(e);
}

async function spend(to: Address, amount: bigint, memo: string): Promise<Hash> {
  const acct = account();
  const d = getDeployment(chainId);
  const id = policyId();
  const [ok, why] = await publicClient.readContract({ address: d.spendingPolicy, abi: SpendingPolicyAbi, functionName: "canSpend", args: [id, acct.address, to, amount] });
  console.log(`policy #${id} pre-check: ${ok ? "ok" : `REJECT (${why})`}`);
  const wallet = createWalletClient({ account: acct, chain, transport: http(rpc) });
  const { request } = await publicClient.simulateContract({ address: d.spendingPolicy, abi: SpendingPolicyAbi, functionName: "spend", args: [id, to, amount, memo], account: acct });
  const hash = await wallet.writeContract(request);
  console.log(`sent ${formatUnits(amount, 6)} USDC -> ${to}\n  ${explorerTxUrl(chainId, hash)}`);
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  if (receipt.status !== "success") die("spend reverted");
  console.log(`confirmed in block ${receipt.blockNumber}`);
  return hash;
}

async function status() {
  const acct = account();
  const d = getDeployment(chainId);
  const id = policyId();
  const p = await publicClient.readContract({ address: d.spendingPolicy, abi: SpendingPolicyAbi, functionName: "getPolicy", args: [id] });
  const remaining = await publicClient.readContract({ address: d.spendingPolicy, abi: SpendingPolicyAbi, functionName: "remainingToday", args: [id] });
  const mon = await publicClient.getBalance({ address: acct.address });
  console.log({
    agent: acct.address,
    isThisAgent: p.agent.toLowerCase() === acct.address.toLowerCase(),
    gasMON: formatUnits(mon, 18),
    name: p.name,
    status: p.revoked ? "revoked" : p.active ? "active" : "paused",
    txLimit: formatUnits(p.txLimit, 6),
    dailyLimit: formatUnits(p.dailyLimit, 6),
    spentToday: formatUnits(p.spentToday, 6),
    escrowed: formatUnits(p.balance, 6),
    remainingToday: formatUnits(remaining, 6),
    anyRecipient: p.allowAnyRecipient,
  });
}

type Requirements = { scheme: string; network: string; amount: string; asset: string; payTo: Address; extra: { spendingPolicy: string; memo: string } };

async function x402Fetch(url: string) {
  console.log(`GET ${url}`);
  const first = await fetch(url);
  if (first.status !== 402) {
    console.log(`status ${first.status} (no payment needed)`);
    console.log(await first.text());
    return;
  }
  const header = first.headers.get("PAYMENT-REQUIRED");
  if (!header) die("402 without PAYMENT-REQUIRED header");
  const challenge = JSON.parse(Buffer.from(header, "base64").toString("utf8")) as { resource: { url: string }; accepts: Requirements[] };
  const req = challenge.accepts.find((a) => a.scheme === "slappay-policy" && a.network === `eip155:${chainId}`);
  if (!req) die(`no slappay-policy option for eip155:${chainId}. offered: ${challenge.accepts.map((a) => `${a.scheme}@${a.network}`).join(", ")}`);
  console.log(`402: ${formatUnits(BigInt(req.amount), 6)} USDC to ${req.payTo} via policy ${req.extra.spendingPolicy}`);

  const txHash = await spend(req.payTo, BigInt(req.amount), req.extra.memo);
  const payload = { x402Version: 2, resource: challenge.resource, accepted: req, payload: { policyId: policyId().toString(), txHash } };
  const sig = Buffer.from(JSON.stringify(payload)).toString("base64");
  const retry = await fetch(url, { headers: { "PAYMENT-SIGNATURE": sig } });
  console.log(`retry status ${retry.status}`);
  const settle = retry.headers.get("PAYMENT-RESPONSE");
  if (settle) console.log("PAYMENT-RESPONSE:", Buffer.from(settle, "base64").toString("utf8"));
  console.log(await retry.text());
  if (process.env.X402_REPLAY_CHECK) {
    const replay = await fetch(url, { headers: { "PAYMENT-SIGNATURE": sig } });
    console.log(`replay of same proof -> status ${replay.status}`);
  }
}

switch (cmd) {
  case "keygen": {
    const pk = generatePrivateKey();
    console.log(`AGENT_PRIVATE_KEY=${pk}\nAGENT_ADDRESS=${privateKeyToAccount(pk).address}\n\nFund this address with a little MON for gas, then create a policy for it in the web app.`);
    break;
  }
  case "status":
    await status();
    break;
  case "pay": {
    const [to, usdc, memo = "agent payment"] = args;
    if (!to || !usdc) die("usage: agent pay <to> <usdc> [memo]");
    await spend(to as Address, parseUnits(usdc, 6), memo).catch((e) => die(reason(e)));
    break;
  }
  case "fetch": {
    if (!args[0]) die("usage: agent fetch <url>");
    await x402Fetch(args[0]).catch((e) => die(reason(e)));
    break;
  }
  default:
    console.log("usage: agent keygen | status | pay <to> <usdc> [memo] | fetch <url>");
}
