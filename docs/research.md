# Research facts (verified 2026-10-01)

## Monad
- Testnet: chainId 10143, MON. RPC https://testnet-rpc.monad.xyz (50rps), https://rpc.ankr.com/monad_testnet, https://rpc-testnet.monadinfra.com. Explorer https://testnet.monadvision.com, https://testnet.monadscan.com. Faucet https://faucet.monad.xyz
- Mainnet: chainId 143. RPC https://rpc.monad.xyz. Explorer https://monadvision.com, https://monadscan.com
- USDC (Circle native, 6 dec): testnet 0x534b2f3A21130d7a60830c2Df862319e593943A3, mainnet 0x754704Bc059F8C67012fEd69BC8A327a5aafb603. Testnet faucet https://faucet.circle.com (20 USDC/2h)
- Verify: sourcify `forge verify-contract <addr> <Name> --chain 10143 --verifier sourcify --verifier-url https://sourcify-api-monad.blockvision.org/`; etherscan v2 chainid=10143 w/ key
- EVM: Osaka-level opcodes. ~300ms blocks, 3-4 blocks share same block.timestamp. Gas charged on gas_limit not usage. Reserve balance 10 MON (keep deployer >= 10 MON + gas). No blob txs. P256 precompile at 0x0100.
- viem: `monad`, `monadTestnet` exported from viem/chains
- Multicall3 0xcA11bde05977b3631167028862bE2a173976CA11 both nets

## Envio
- HyperSync testnet https://monad-testnet.hypersync.xyz, mainnet https://monad.hypersync.xyz. Needs ENVIO_API_TOKEN (https://envio.dev/app/api-tokens). CLI envio@3.12.1, Node>=22, Docker for local. config.yaml uses `chains:` key (v3).

## Next.js
- 16.3.8 latest. React 19.3. Tailwind 4.3. Turbopack default. middleware.ts -> proxy.ts. async params/cookies/headers. No `next lint`.
- scaffold: `npx create-next-app@latest web --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-pnpm --yes --disable-git --no-agents-md`
