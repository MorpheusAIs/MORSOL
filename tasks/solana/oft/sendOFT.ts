import { TOKEN_PROGRAM_ID } from "@solana/spl-token";

import { task } from "hardhat/config";

import { types } from "@layerzerolabs/devtools-evm-hardhat";

import { sendOFT } from "../../../utils/solana/oft/sendOFT";
import { SendOFTSolanaArgs } from "../../../utils/interfaces/solana/sendOFT.args";
import {
  mint,
  programId,
  escrow,
} from "../../../deployments/solana-testnet/OFT.json";

// Define a Hardhat task for sending OFT from Solana
task(
  "morpheus:oft:solana:send",
  "Send tokens from Solana to a target EVM chain",
)
  .addParam("amount", "The amount of tokens to send", undefined, types.int)
  .addParam(
    "fromEid",
    "The source endpoint ID",
    process.env.SOLANA_EID,
    types.eid,
  )
  .addParam("to", "The recipient address on the destination chain")
  .addParam(
    "toEid",
    "The destination endpoint ID",
    process.env.EVM_EID,
    types.eid,
  )
  .addParam("mint", "The OFT token mint public key", mint, types.string)
  .addParam(
    "programId",
    "The OFT program ID",
    process.env.MOROFT_ID,
    types.string,
  )
  .addParam("escrow", "The OFT escrow public key", escrow, types.string)
  .addParam(
    "tokenProgram",
    "The Token Program public key",
    TOKEN_PROGRAM_ID.toBase58(),
    types.string,
    true,
  )
  .addParam(
    "computeUnitPriceScaleFactor",
    "The compute unit price scale factor",
    4,
    types.float,
    true,
  )
  .setAction(async (args: SendOFTSolanaArgs) => {
    await sendOFT(args);
  });
