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
- [x] deployed to Monad testnet 2026-10-02 (deployments/10143.json)
- [x] verify via sourcify submitted

## Phase 2/3 — policy + stream: contracts done w/ Phase 1

## Phase 4 — web + Privy  [DONE, untested in browser: no Privy app id]
- [x] pnpm workspace, apps/web (create-next-app 16.3.8)
- [x] packages/core: chains, addresses from deployments json, abis
- [x] Privy provider + wagmi bridge
- [x] useTx hook w/ states + explorer link; simulate before sign
- [x] approve+create flows for all 3 primitives

## Phase 5 — intent parser  [DONE]
- [x] schema (zod), parser (claude-opus-5-5 structured output), fallback (regex, all demo phrases pass), validator
- [x] /api/intent; preview + confirm in IntentFlow

## Phase 6 — x402  [DONE, local e2e verified]
- [x] /api/paid/weather 402 w/ x402 v2 headers, slappay-policy scheme
- [x] agent CLI: keygen/status/pay/fetch; replay rejected; reverts decoded

## Phase 7 — Envio: not started (optional)
## Phase 8 — UI pages  [DONE: home, dashboard, mandates, agents, streams]
## Phase 9 — e2e: local anvil DONE (scripts/local-e2e.sh). Testnet BLOCKED on MON.
## Phase 10 — README DONE (addresses table pending deploy)

## Review
- 43 forge tests pass; pnpm -r typecheck + lint clean; local-e2e.sh passes (402→pay→200, replay→402, over-limit + bad recipient revert).
- Not verified: Privy login in browser (needs app id), LLM parse path (needs key), testnet txs (needs MON).

## Unresolved questions
1. Deployer: I generated a key in contracts/.env (gitignored). Fund addr w/ MON from https://faucet.monad.xyz (need >=10 MON reserve + gas). Or give me own key?
2. Privy app ID + secret? (dashboard.privy.io; enable Monad Testnet)
3. LLM key: ANTHROPIC_API_KEY? else fallback parser only
4. Testnet only, or mainnet too for demo?
