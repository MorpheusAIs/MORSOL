import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Morsol } from "../../../target/types/morsol";
import { PublicKey, Keypair } from "@solana/web3.js";
import {
  getOrCreateAssociatedTokenAccount,
  getAccount,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  getAccount as getSavedAccount,
  saveAccount,
} from "../../utils/accountUtils";
import assert from "assert";

describe("Mint Token", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const morsolProgram = anchor.workspace.morsol as Program<Morsol>;

  it("Mints Tokens", async () => {
    console.log("Fetching Global Config...");
    const globalConfigAddress = new PublicKey(
      getSavedAccount<string>("globalConfig")!
    );

    const globalConfigAccount = await morsolProgram.account.globalConfig.fetch(
      globalConfigAddress
    );

    console.log("Global Config Account:", globalConfigAccount);

    console.log("Fetching or creating Associated Token Account...");
    const associatedTokenAccount = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      provider.wallet.payer,
      globalConfigAccount.mint,
      provider.wallet.publicKey
    );

    console.log(
      "Associated Token Account Address:",
      associatedTokenAccount.address.toBase58()
    );

    console.log("Starting transaction to mint tokens...");
    const amount = 1_000_000_000_000_000; //  1000 tokens (9 decimals)
    const tx = await morsolProgram.methods
      .mintToken(new anchor.BN(amount))
      .accounts({
        globalConfig: globalConfigAddress,
        mint: globalConfigAccount.mint,
        transferManager: globalConfigAccount.transferManager,
        associatedTokenAccount: associatedTokenAccount.address,
      })
      .signers([provider.wallet.payer])
      .rpc();

    console.log("Mint Token Transaction Signature:", tx);

    console.log("Fetching Associated Token Account Info...");
    const tokenAccountInfo = await getAccount(
      provider.connection,
      associatedTokenAccount.address
    );

    console.log("Associated Token Account Info:", tokenAccountInfo);

    saveAccount(
      "associatedTokenAccount",
      associatedTokenAccount.address.toBase58()
    );

    assert.strictEqual(
      tokenAccountInfo.amount.toString(),
      amount.toString(),
      "Minted amount does not match"
    );
    assert.strictEqual(
      tokenAccountInfo.owner.toBase58(),
      provider.wallet.publicKey.toBase58(),
      "Associated token account owner mismatch"
    );
    assert.strictEqual(
      tokenAccountInfo.mint.toBase58(),
      globalConfigAccount.mint.toBase58(),
      "Mint address mismatch"
    );

    console.log("Minted tokens successfully and validated!");
  });
});
