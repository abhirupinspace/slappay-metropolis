#!/usr/bin/env bash
# Local end-to-end: anvil -> deploy -> next dev -> agent pays a 402 through its policy.
set -euo pipefail
cd "$(dirname "$0")/.."
DEPLOYER=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80   # anvil #0
AGENT_PK=0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d    # anvil #1
AGENT=0x70997970C51812dc3A010C7d01b50e0d17dc79C8
PAY_TO=0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC                              # anvil #2

cleanup() { kill ${ANVIL_PID:-} ${NEXT_PID:-} 2>/dev/null || true; }
trap cleanup EXIT

anvil --silent --port 8545 & ANVIL_PID=$!
sleep 1
(cd contracts && DEPLOYER_PRIVATE_KEY=$DEPLOYER AGENT_ADDRESS=$AGENT X402_PAY_TO=$PAY_TO \
  forge script script/DeployLocal.s.sol --rpc-url http://127.0.0.1:8545 --broadcast -q >/dev/null)
pnpm --filter @slappay/core abis >/dev/null
echo "deployed: $(cat contracts/deployments/31337.json | tr -d '\n ')"

(cd apps/web && NEXT_PUBLIC_CHAIN_ID=31337 NEXT_PUBLIC_RPC_URL=http://127.0.0.1:8545 X402_PAY_TO=$PAY_TO NEXT_PUBLIC_PRIVY_APP_ID=${NEXT_PUBLIC_PRIVY_APP_ID:-local} \
  pnpm dev -p 3123 >/tmp/slappay-next.log 2>&1) & NEXT_PID=$!
for i in $(seq 1 60); do curl -sf http://localhost:3123/api/paid/weather -o /dev/null -w '' && break || sleep 1; done
curl -s -o /dev/null -w "unpaid request -> HTTP %{http_code}\n" "http://localhost:3123/api/paid/weather?city=Berlin"

cd apps/agent
export CHAIN_ID=31337 RPC_URL=http://127.0.0.1:8545 AGENT_PRIVATE_KEY=$AGENT_PK POLICY_ID=1
echo "--- agent status"; pnpm -s agent status
echo "--- agent fetch (x402)"; X402_REPLAY_CHECK=1 pnpm -s agent fetch "http://localhost:3123/api/paid/weather?city=Berlin"
echo "--- agent pay 1 USDC to allowed recipient"; pnpm -s agent pay $PAY_TO 1 "api call"
echo "--- agent pay 3 USDC (over tx limit, must fail)"; pnpm -s agent pay $PAY_TO 3 "too big" && echo "UNEXPECTED SUCCESS" || echo "rejected as expected"
echo "--- agent pay to non-allowlisted (must fail)"; pnpm -s agent pay $AGENT 1 "self" && echo "UNEXPECTED SUCCESS" || echo "rejected as expected"
