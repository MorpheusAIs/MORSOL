
# MORSOL Project Status

Status and audit notes for **MOR omnichain token** (Solana + EVM, OFT v2).  
This doc tracks **what’s completed**, **what’s left**, **who can sign what**, and **hard evidence** (tx hashes/links).

_Last updated: 2025-10-09 (Europe/Kyiv)._

---

## 0) Sources / Scope

- **Solana side**: Standart OFT implementation that was audited by LayerZero deployed and configured. 
- **EVM side**: MOR OFT contract + interfaces **vendored from** [➡️ GitHub: `MorpheusAIs/SmartContracts`](https://github.com/MorpheusAIs/SmartContracts) (we only use this OFT implementations and interfaces).
- **Bridging/messaging**: LayerZero **OFT v2** stack (audited; we use it as-is; no custom bridge logic).
- **Governance**: Solana mint authority is **Squads multisig**; EVM MOROFT owner is `delegate` (set at deploy). Minters on EVM are allow-listed via `updateMinter`.

> The SmartContracts repo **includes MOROFT contract and interfaces; we do **not** modify LayerZero libraries.

---

## 1) Addresses & Artifacts (Testnet)

### Solana (devnet)
- **Program (OFT)**: `GCFybaw764AVDtZxgZsmmeFwuVpSwoj5yQPr4sVGfWMs`
- **SPL Mint**: `AbfvHu72dozJKHEep58M44duQn8ZLVgXTPLJ2CECwk6M`
- **SPL Mint Authority (SPL multisig)**: `9LJ7nR9yvF3iTYyfAWGChU6oG5oVzSVbUx7z4Hwgom2R`
- **OFT Store PDA**: `86FCrJMpne6v2hdcGtmDgbYSeb2Q1pbyCHDEbabnHJUt`
- **Escrow PDA**: `7W9GpAS5mKFAoD2ypUYJVaJLzupn3sBTfnpxE5DLVoZ3`

### Squads (devnet)
- **Multisig PDA**: `CYrL3oFnmn4PtLncghpdvhiTNSkGP5xTtMekyiSr5nf5`
- **Vault PDA**: `6KKANHZoo5R5BHNPjqUH8EQhpF3YDdmxNmuST4w51s1M`
- **Vault Index**: `0`
- **Threshold**: **T-of-N** (captured in Squads UI; _to be recorded here_)  

### EVM (Arbitrum Sepolia)
- **MOROFT (address)**: `0x4546F3147F094af3628531fA04FCE3347fC5D25D`
- **Owner / Delegate (at deploy)**: EOA `0x4546F3147F094af3628531fA04FCE3347fC5D25D` (deployer in this session)
- **Minters**: maintained by `updateMinter(address,bool)`; at least the deployer EOA was used to mint in tests (see logs).

---

## 2) Required Signatures & Roles (Who Can Do What)

### On Solana
- **Mint authority** is the **SPL multisig**: `9LJ7nR9yvF3iTYyfAWGChU6oG5oVzSVbUx7z4Hwgom2R`.
- Any **mint/burn** initiated by the OFT program must respect the **SPL multisig** authority configuration.  
- **Operational security**: Cross-chain mints into Solana are ultimately gated by **SPL multisig** (threshold **T-of-N**, to be documented).
- **Governance**: maintained by predefined **Squads Multisig**.  

---

## 3) What’s Completed

- ✅ **Anchor OFT program deployed (devnet)**  
  - `morpheus:anchor:deploy:verifiable`  
  - **Program ID**: `GCFybaw764AVDtZxgZsmmeFwuVpSwoj5yQPr4sVGfWMs`

- ✅ **Squads multisig created (devnet)**  
  - `morpheus:solana:create-squads`  
  - **Multisig PDA**: `CYrL3oFnmn4PtLncghpdvhiTNSkGP5xTtMekyiSr5nf5`  
  - **Vault PDA**: `6KKANHZoo5R5BHNPjqUH8EQhpF3YDdmxNmuST4w51s1M`

- ✅ **SPL multisig + Mint initialized & OFT program wired**  
  - `morpheus:oft:solana:create`  
  - Created **SPL multisig** (= mint authority)  
  - Created **SPL mint**  
  - Initialized **OFT store**  
  - Set **authorities**  
  - **Artifact saved**: `deployments/solana-testnet/OFT.json`

- ✅ **LayerZero peer/link configuration (bidirectional)**  
  - Set **peers** Solana ↔ Arbitrum Sepolia  
  - Set **send/receive libraries** both ways  
  - Configured **ULN** on both chains  
  - Set **enforced options** (gas limits etc.) both ways  
  - All submitted via CLI; **12 txs succeeded** (see logs).

- ✅ **EVM MOROFT mint sanity on Arbitrum Sepolia**
  - `mint(address,uint256)` succeeded (see receipt below).

- ✅ **E2E test transfers (test evidence below)**
  - **EVM → Solana** send;
  - **Solana → EVM** send.

---

## 4) Test Evidence (Tx Logs / Links)

### A. Solana-side provisioning (devnet)

- **Create SPL multisig**  
  `3HLxxHyvfUghaHWt8ZxisVMj7LCPGbcRwJ2p5fYCUusWTZbzPatXmmAdRmc7ddLNBPcb28AwHYwGmJ8Hhva9zpPn`  
  _Solscan_: https://solscan.io/tx/3HLxxHyvfUghaHWt8ZxisVMj7LCPGbcRwJ2p5fYCUusWTZbzPatXmmAdRmc7ddLNBPcb28AwHYwGmJ8Hhva9zpPn?cluster=devnet

- **Create token (SPL mint)**  
  `1213V4md77KbtHVaEHxzsifqCKJjypfppWamGyeQ73F7HjV3fRST9CXzZgVzcYHdYYu5Fqstuh8gyi9YpvLbDGhy`  
  _Solscan_: https://solscan.io/tx/1213V4md77KbtHVaEHxzsifqCKJjypfppWamGyeQ73F7HjV3fRST9CXzZgVzcYHdYYu5Fqstuh8gyi9YpvLbDGhy?cluster=devnet

- **Initialize OFT store**  
  `EP21JpWznQxB1qsTycLGGyC61PQXDPLXpDRJbDmP7YpohZnBxYZPku4diZUUsyrq3DyR42vivkmcRRjb9W7rRGT`  
  _Solscan_: https://solscan.io/tx/EP21JpWznQxB1qsTycLGGyC61PQXDPLXpDRJbDmP7YpohZnBxYZPku4diZUUsyrq3DyR42vivkmcRRjb9W7rRGT?cluster=devnet

- **Set authority**  
  `3ouzXD2abWa5wVxzWXFYH5P2SUoBFrD6DRpsvZsA9rbzBiTkqDxqaJZAuVkUxhkpdgb189ExEc9X1Xx8ojUF6q28`  
  _Solscan_: https://solscan.io/tx/3ouzXD2abWa5wVxzWXFYH5P2SUoBFrD6DRpsvZsA9rbzBiTkqDxqaJZAuVkUxhkpdgb189ExEc9X1Xx8ojUF6q28?cluster=devnet

---

### B. LayerZero peer / library / ULN / enforced options

> (CLI printed the encoded configs and confirmations; below are the human-readable summaries.)

- **Peers**  
  - ARBSEP → set peer for **SOLANA_V2_TESTNET (40168)** to Solana OApp address  
  - SOLANA → set peer for **ARBSEP_V2_TESTNET (40231)** to EVM OApp address

- **Send libraries** (both directions set)  
- **Receive libraries** (both directions set, grace period 0)  
- **ULN configs** (confirmations, DVN threshold, required DVNs set both sides)  
- **Enforced options** (msgType 1 gas options set both sides)  
- **CLI summary**: **12 transactions submitted → success**

---

### C. EVM MOROFT mint check (Arbitrum Sepolia)

- **Mint tx (success)**  
  `0x4b3fd652350c68a17a5a1ae4c0baecf19fbfba69d59095b7e1b3d4141b432b48`  
  - `to`: `0x4546F3147F094af3628531fA04FCE3347fC5D25D` (MOROFT)  
  - `status`: `1`  
  - `gasUsed`: `21644`

---

### D. Cross-chain sends (E2E)

1) **EVM → Solana**  
   Hardhat task:  
```

pnpm hardhat --network arbsep-testnet morpheus:evm:send --amount 1000000000 --to AwaK517AuviY4K5RfVxBQJWtpHPAAYrSUfGaimG21kDy

```
- Tx: `0xc61684b7a36911ff4eb7b386568a7948c9de1c841b81d9097a4b47579571e421`  
- **LayerZero (testnet) tracker**: https://testnet.layerzeroscan.com/tx/0xc61684b7a36911ff4eb7b386568a7948c9de1c841b81d9097a4b47579571e421

2) **Solana → EVM**  
Hardhat task:  
```

pnpm hardhat morpheus:oft:solana:send --amount 1000000000 --to 0x4546F3147F094af3628531fA04FCE3347fC5D25D

```
- Sig: `5b7quvuMzptBpR2tfZsXiHHHY8hsyjcPgvyw7mtSc4FCFXcJ6tJvHibuaoNeXQUPBpfunqPwTTUYGwiiSn2PWZ6Z`  
- **Solscan**: https://solscan.io/tx/5b7quvuMzptBpR2tfZsXiHHHY8hsyjcPgvyw7mtSc4FCFXcJ6tJvHibuaoNeXQUPBpfunqPwTTUYGwiiSn2PWZ6Z?cluster=devnet  
- **LayerZero (testnet) tracker**: https://testnet.layerzeroscan.com/tx/5b7quvuMzptBpR2tfZsXiHHHY8hsyjcPgvyw7mtSc4FCFXcJ6tJvHibuaoNeXQUPBpfunqPwTTUYGwiiSn2PWZ6Z

---

## 5) Responses to Auditor Questions (inline)


## 6) Notes on Audits

- We **only** use audited LayerZero OFT contracts/libraries for cross-chain logic (no custom bridge logic).  
- MOROFT and interfaces are sourced from the Morpheus SmartContracts repo (audited base).  
- Solana governance uses **Squads multisig** as SPL mint authority to require **T-of-N** approvals for mint-critical operations.
