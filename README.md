# Morpheus Omnichain Fungible Token (OFT)

## Requirements

- Rust `v1.75.0`
- Anchor `v0.29`
- Solana CLI `v1.17.31`
- Docker
- Node.js

## Setup

We recommend using `pnpm` as a package manager, but you can use any package manager of your choice.

[Docker](https://docs.docker.com/get-started/get-docker/) is required for building with Anchor. Ensure you have the latest Docker version to avoid issues.

⚠️ You need Anchor version `0.29` and Solana version `1.17.31` to compile the build artifacts. Using higher versions may cause unexpected issues. See these issues in Anchor's repo: [Issue 1](https://github.com/coral-xyz/anchor/issues/3089), [Issue 2](https://github.com/coral-xyz/anchor/issues/2835).

### Install Dependencies

#### Rust

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
```

#### Solana

```bash
sh -c "$(curl -sSfL https://release.solana.com/v1.17.31/install)"
```

#### Anchor

```bash
cargo install --git https://github.com/coral-xyz/anchor --tag v0.29.0 anchor-cli --locked
```

#### Project Dependencies

```bash
pnpm install
```

## Running Tests

Note: test includes default LayerZero OFT test with OFT Mock contract.

```bash
forge test 
```

## Get Devnet SOL

```bash
solana airdrop 5 -u devnet
```

Use the [official Solana faucet](https://faucet.solana.com/) if needed.

## Configure Environment

```bash
cp .env.example .env
```

Also set `RPC_URL_SOLANA_TESTNET` (reffers to Solana Devnet for consistency with EVM testnets).

## Deployment

### Generate OFT Program ID

```bash
pnpm hardhat morpheus:setup:anchor:keys
```

⚠️ This command includes `--force`, which overwrites existing keys.

View the generated program ID:

```bash
anchor keys list
```

### Build and Deploy the Solana OFT Program

Ensure Docker is running before building.

#### Build

```bash
pnpm hardhat morpheus:anchor:build:verifiable
```

#### Preview Rent Costs

```bash
pnpm hardhat morpheus:solana:deploy:rent
```

Example output:

```bash
Rent-exempt minimum: 3.87415872 SOL
```

[Read more about Solana rent](https://solana.com/docs/core/fees#rent).

#### Deploy

```bash
pnpm hardhat morpheus:anchor:deploy:verifiable
```

### Create SquadsV4

```bash
pnpm hardhat morpheus:solana:create-squads # Takes keypair path from `.env` by default.
```

### Create the Solana OFT

```bash
pnpm hardhat morpheus:oft:solana:create
```
⚠️  For testing purposes pass your own Solana wallet address where your minted test MOR tokens are available with flag `--additional-minters <YOUR_SOLANA_PUBLIC_KEY>`.

### Update Configuration

Check [`layerzero.config.ts`](./layerzero.config.ts) and ensure only the `address` for Solana is specified. Do not specify addresses for EVM chain contracts.

### Deploy Sepolia OFT Peer

```bash
pnpm hardhat lz:deploy
```

### Mint test EVM tokens

Note: token has 18 decimals.
```bash
cast send <TOKEN_ADDRESS> "mint(address,uint256)" <RECIPIENT> 1000000000000000000000 --private-key <EVM_PRIVATE_KEY> --rpc-url wss://arbitrum-sepolia-rpc.publicnode.com
```


### Initialize the Solana OFT
Since the LayerZero CLI does not load the private key automatically, you need to set it explicitly. Use the following command to provide your private key:

```bash
npx hardhat morpheus:solana:base-58
```
Also pass `MOROFT_ID` from `.env` as param explicitly.

```bash
pnpm hardhat lz:oapp:init:solana --oapp-config layerzero.config.ts --solana-secret-key <SECRET_KEY> --solana-program-id <MOROFT_ID>
```

⚠️ `<SECRET_KEY>` should be in base58 format.

### Wire Configuration

```bash
pnpm hardhat lz:oapp:wire --oapp-config layerzero.config.ts --solana-secret-key <PRIVATE_KEY> --solana-program-id <PROGRAM_ID>
```
⚠️  The `layerzero.config.ts` file must include the correct EVM MOROFT contract name that was deployed using the `PRIVATE_KEY` specified in the `.env` file here:

```js
const sepoliaContract: OmniPointHardhat = {
  eid: EndpointId.ARBSEP_V2_TESTNET,
  contractName: "<MOROFT_CONTRACT_NAME>",
};
```


## Sending 1 Token

### Sepolia -> SOL
Note: 9 decimals for Solana. Amount is in lamports.

```bash
pnpm hardhat --network arbsep-testnet morpheus:evm:send --amount 1000000000 --to <TO_SOLANA_ADDRESS>
```

⚠️ If you encounter `No Contract deployed with name`, ensure `tokenName` in `tasks/evm/send.ts` matches the deployed contract name.


### SOL -> Sepolia

```bash
pnpm hardhat morpheus:oft:solana:send --amount 1000000000 --to <TO_EVM_ADDRESS>
```
