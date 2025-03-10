import { expect } from "chai";
import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import * as multisig from "@sqds/multisig";
import { createSquadsMultisig } from "../../utils/solana/squads/createSquadsMultisig";
import { mintToken } from "../../utils/solana/squads/mint";
import {
  createMint,
  createMultisig,
  getOrCreateAssociatedTokenAccount,
} from "@solana/spl-token";
import dotenv from "dotenv";
import * as path from "path";
import * as os from "os";

dotenv.config();

describe("Solana Multisig Tests", function () {
  this.timeout(120000);

  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  // @ts-ignore
  const payer = provider.wallet.payer;
  anchor.setProvider(provider);

  const connection = provider.connection;

  let squadsMultisig: PublicKey;
  let splMultisig: PublicKey;
  let tokenMint: PublicKey;
  let vaultPDA: PublicKey;

  const payerKeypairPath = path.resolve(os.homedir(), ".config/solana/id.json");

  before(async function () {
    // Create a Squads multisig
    squadsMultisig = await createSquadsMultisig(payerKeypairPath, false);
    expect(squadsMultisig).to.be.instanceOf(PublicKey);
    console.log("Squads Multisig Created:", squadsMultisig.toBase58());

    // Get vault PDA
    [vaultPDA] = multisig.getVaultPda({
      multisigPda: squadsMultisig,
      index: 0,
    });
    // Create an SPL multisig for token mint authority
    splMultisig = await createMultisig(
      connection,
      payer,
      [vaultPDA], // SPL Multisig Members (including Squads)
      1, // Threshold
    );
    console.log("Created SPL Multisig:", splMultisig.toBase58());

    tokenMint = await createMint(
      connection,
      payer,
      splMultisig, // SPL Multisig is Mint Authority
      null, // No freeze authority
      9, // Decimals
      undefined,
      {
        skipPreflight: false,
        preflightCommitment: "confirmed",
      },
    );
    // Create a new SPL Token with SPL Multisig as the mint authority
    console.log("Created SPL Token:", tokenMint.toBase58());
  });

  it("should mint tokens using SPL multisig and Squads as a signer", async function () {
    // this.timeout(10000);
    await new Promise((resolve) => setTimeout(resolve, 30_000));

    const mintAmount = 1000000000000;

    // Mint tokens using SPL multisig with Squads signing
    const signature = await mintToken(
      mintAmount,
      payerKeypairPath,
      tokenMint.toBase58(),
      splMultisig.toBase58(), // SPL Multisig as Mint Authority
      squadsMultisig.toBase58(),
    );

    console.log("Mint Transaction Signature:", signature);

    const tokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      payer,
      tokenMint,
      payer.publicKey,
    );

    // // Verify minting by checking balance
    const tokenAccountInfo = await connection.getTokenAccountBalance(
      tokenAccount.address,
    );
    expect(Number(tokenAccountInfo.value.amount)).to.equal(mintAmount);

    console.log("✅ Test passed");
  });
});
