import { execSync } from "child_process";
import fs from "fs";
import dotenv from "dotenv";
import * as anchor from "@coral-xyz/anchor";
import {
  TransactionType,
  addComputeUnitInstructions,
  deriveConnection,
  deriveKeys,
  getExplorerTxLink,
  output,
} from "../solana/infrastructure/helpers";
import * as spl from "@solana/spl-token";
import bs58 from "bs58";
import { Keypair, PublicKey } from "@solana/web3.js";

const TOKEN_PROGRAM = spl.TOKEN_2022_PROGRAM_ID;

export async function createToken() {
  const payer = Keypair.fromSecretKey(
    bs58.decode(process.env.SOLANA_PRIVATE_KEY!),
  );
  const owner = payer;

  try {
    const mint = anchor.web3.Keypair.generate();

    const { connection, umi, umiWalletKeyPair, umiWalletSigner } =
      await deriveConnection(40168);

    const extensions: any = [];
    const mintLen = spl.getMintLen(extensions);
    const lamports =
      await connection.getMinimumBalanceForRentExemption(mintLen);

    const transaction = new anchor.web3.Transaction().add(
      anchor.web3.SystemProgram.createAccount({
        fromPubkey: payer.publicKey,
        newAccountPubkey: mint.publicKey,
        space: mintLen,
        lamports,
        programId: TOKEN_PROGRAM,
      }),
      spl.createInitializeMintInstruction(
        mint.publicKey,
        9,
        owner.publicKey,
        null,
        TOKEN_PROGRAM,
      ),
    );
    const { blockhash } = await connection.getLatestBlockhash();

    transaction.feePayer = payer.publicKey;
    transaction.recentBlockhash = blockhash;
    await anchor.web3.sendAndConfirmTransaction(connection, transaction, [
      payer,
      mint,
    ]);

    let tokenAccount = await spl.createAssociatedTokenAccount(
      connection,
      payer,
      mint.publicKey,
      payer.publicKey,
      undefined,
      TOKEN_PROGRAM,
      spl.ASSOCIATED_TOKEN_PROGRAM_ID,
    );

    await spl.mintTo(
      connection,
      payer,
      mint.publicKey,
      tokenAccount,
      owner,
      10_000_000n,
      undefined,
      undefined,
      TOKEN_PROGRAM,
    );

    let tokenAddress = mint.publicKey.toBase58();
    console.log(tokenAddress);
    const data = { tokenAddress: tokenAddress };

    fs.writeFileSync(
      "../../deployments/solana-ntt/ntt-solana.json",
      JSON.stringify(data, null, 2),
    );
    console.log("Token address saved to ntt-solana.json");
  } catch (error) {
    console.error("Error executing setup task:", error);
  }
}
