import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Morsol } from "../../../target/types/morsol";
import { PublicKey } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  getAccount,
  getOrCreateAssociatedTokenAccount,
} from "@solana/spl-token";
import { getAccount as get } from "../../utils/accountUtils";
import assert from "assert";

describe("Burn Token", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const morsolProgram = anchor.workspace.morsol as Program<Morsol>;

  it("Burns Tokens", async () => {
    console.log("Fetching Global Config...");
    const globalConfigAddress = new PublicKey(get<string>("globalConfig")!);

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

    console.log("Fetching Associated Token Account Info...");
    const tokenAccountInfoBefore = await getAccount(
      provider.connection,
      associatedTokenAccount.address
    );
    console.log("Token Account Info (Before Burn):", tokenAccountInfoBefore);

    const burnAmount = 500_000_000_000; // 500 tokens (9 decimals)

    assert.ok(
      tokenAccountInfoBefore.amount >= BigInt(burnAmount),
      "Not enough tokens to burn"
    );

    console.log("Burning tokens...");
    const tx = await morsolProgram.methods
      .burnToken(new anchor.BN(burnAmount))
      .accounts({
        mint: globalConfigAccount.mint,
        from: associatedTokenAccount.address,
      })
      .signers([provider.wallet.payer])
      .rpc();

    console.log("Burn Token Transaction Signature:", tx);

    console.log("Fetching Updated Token Account Info...");
    const tokenAccountInfoAfter = await getAccount(
      provider.connection,
      associatedTokenAccount.address
    );
    console.log("Token Account Info (After Burn):", tokenAccountInfoAfter);

    // Assertions
    const expectedRemainingBalance =
      tokenAccountInfoBefore.amount - BigInt(burnAmount);
    assert.strictEqual(
      tokenAccountInfoAfter.amount,
      expectedRemainingBalance,
      "Remaining token balance does not match expected value"
    );

    console.log("Burn successful! Tokens were burned as expected.");
  });
});
