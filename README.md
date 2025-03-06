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

```bash
pnpm test
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

Set `SOLANA_PRIVATE_KEY` in `.env` to your private key in base58 format. Use:

```bash
npx hardhat lz:solana:base-58 --keypair-file <PATH>
```

Also set `RPC_URL_SOLANA_TESTNET` (refers to Solana Devnet for consistency with EVM testnets).

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
pnpm hardhat morpheus:deploy:anchor:rent
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

### Create the Solana OFT

```bash
pnpm hardhat morpheus:oft:solana:create --additional-minters <YOUR_PUBKEY>
```

⚠️ Use `--additional-minters` to specify minters. If omitted, use `--only-oft-store true`.

### Update Configuration

Check [`layerzero.config.ts`](./layerzero.config.ts) and ensure only the `address` for Solana is specified. Do not specify addresses for EVM chain contracts.

### Deploy Sepolia OFT Peer

```bash
pnpm hardhat lz:deploy
```

For testnet, consider using `MyOFTMock`. If so, update `sepoliaContract.contractName` in `layerzero.config.ts`.

### Initialize the Solana OFT

```bash
pnpm hardhat lz:oapp:init:solana --oapp-config layerzero.config.ts --solana-secret-key <SECRET_KEY> --solana-program-id <PROGRAM_ID>
```

⚠️ `<SECRET_KEY>` should be in base58 format.

### Wire Configuration

```bash
pnpm hardhat lz:oapp:wire --oapp-config layerzero.config.ts --solana-secret-key <PRIVATE_KEY> --solana-program-id <PROGRAM_ID>
```

Use `--multisigKey` for squads multisig.

### Mint OFT on Solana

First, create an associated token account:

```bash
spl-token create-account <TOKEN_MINT>
```

Then mint tokens:

```bash
spl-token mint <TOKEN_MINT> <AMOUNT> --multisig-signer ~/.config/solana/id.json --owner <MINT_AUTHORITY>
```

📌 Check `~/.config/solana/id.json` with `solana config get`.

## Sending Tokens

### SOL -> Sepolia

```bash
pnpm hardhat morpheus:oft:solana:send --amount <AMOUNT> --to <EVM_ADDRESS>
```

### Sepolia -> SOL

```bash
pnpm hardhat --network arbsep-testnet morpheus:evm:send --amount <AMOUNT> --to <TO>
```

⚠️ If you encounter `No Contract deployed with name`, ensure `tokenName` in `tasks/evm/send.ts` matches the deployed contract name.
