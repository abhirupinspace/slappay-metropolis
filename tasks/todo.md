# Slappay — plan

## Decisions (made, not asked)
- 3 singleton contracts keyed by id (no clone factory): PaymentMandate, SpendingPolicy, PaymentStream. Simpler, cheaper, easier to index. Factory omitted — no technical reason for it.
- Token: Circle native USDC on Monad testnet 0x534b2f3A21130d7a60830c2Df862319e593943A3 (6 dec). No mock on testnet. MockUSDC only for local anvil/tests.
- Streams fully funded upfront (maxAmount deposited at create). No insolvency path.
- Mandate conditions: MANUAL_APPROVAL (sender), ATTESTATION (verifier addr), TIME (releaseAfter). Recipient can decline anytime; sender cancels after expiry.
- Agent model: agent = separate EOA (Privy server wallet or raw key). Owner escrows USDC in SpendingPolicy; agent calls spend() — limits enforced onchain. Agent never touches owner key/funds.
- x402: real x402 v2 envelope (PAYMENT-REQUIRED / PAYMENT-SIGNATURE headers, @x402/* 2.28). Settlement = "slappay-policy" scheme: agent pays via policy.spend() onchain, presents txHash, server verifies AgentSpent event. Optional `exact` scheme via molandak facilitator if agent holds own USDC. ERC-1271 policy-as-payer rejected: isValidSignature is view -> can't track daily spend; facilitator 1271 support unverified.
- Web: Next 16.3.8, pnpm workspace, Privy 3.46 + @privy-io/wagmi 4.0.17 + wagmi 2 + viem pinned 2.56.0. No DB. Events = truth. Envio later.
- LLM: Anthropic claude-sonnet-5-5 w/ structured JSON; deterministic regex fallback parser.

## Phase 1 — contracts  [DONE except deploy]
- [x] foundry init, OZ 5.7
- [x] PaymentMandate.sol
- [x] SpendingPolicy.sol
- [x] PaymentStream.sol
- [x] tests: 43 pass (mandate 14, policy 17, stream 12 incl fuzz)
- [x] Deploy.s.sol writes deployments/<chainId>.json
- [ ] deploy to Monad testnet (BLOCKED: need deployer MON — see questions)
- [ ] verify via sourcify

## Phase 2/3 — policy + stream: contracts done w/ Phase 1

## Phase 4 — web + Privy
- [ ] pnpm workspace, apps/web (create-next-app 16.3.8)
- [ ] packages/config: chains.ts, addresses from deployments json, abis
- [ ] Privy provider + wagmi bridge, Monad testnet
- [ ] useTx hook: preparing/signing/submitting/confirming/confirmed, explorer link
- [ ] USDC approve+create flows for all 3 primitives

## Phase 5 — intent parser
- [ ] lib/intent/schema.ts (zod), parser.ts (LLM), fallback.ts (regex), validator.ts
- [ ] /api/intent route; preview page w/ confirm

## Phase 6 — x402
- [ ] /api/paid/* route returns 402 w/ x402 v2 header
- [ ] agent script: fetch → 402 → policy.spend → retry w/ proof → 200
- [ ] server verifies AgentSpent onchain

## Phase 7 — indexing (Envio) — optional, after core works
## Phase 8 — UI pages: home, preview, dashboard, mandates, agents, streams
## Phase 9 — e2e on testnet, demo script
## Phase 10 — README, polish

## Unresolved questions
1. Deployer: I generated a key in contracts/.env (gitignored). Fund addr w/ MON from https://faucet.monad.xyz (need >=10 MON reserve + gas). Or give me own key?
2. Privy app ID + secret? (dashboard.privy.io; enable Monad Testnet)
3. LLM key: ANTHROPIC_API_KEY? else fallback parser only
4. Testnet only, or mainnet too for demo?
