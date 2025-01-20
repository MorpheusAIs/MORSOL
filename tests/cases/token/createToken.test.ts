import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Morsol } from "../../../target/types/morsol";
import { PublicKey } from "@solana/web3.js";
import { createMint, getMint } from "@solana/spl-token";
import { getAccount, saveAccount } from "../../utils/accountUtils";
import assert from "assert";

describe("Create Token", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const morsolProgram = anchor.workspace.morsol as Program<Morsol>;

  it("Creates a Token", async () => {
    console.log("Fetching Global Config...");
    const globalConfigAddress = new PublicKey(
      getAccount<string>("globalConfig")!
    );

    const globalConfigAccount = await morsolProgram.account.globalConfig.fetch(
      globalConfigAddress
    );

    console.log("Global Config Account:", globalConfigAccount);

    console.log("Starting transaction to create a token...");
    const tx = await morsolProgram.methods
      .createToken()
      .accounts({
        globalConfig: globalConfigAddress,
        transferManager: globalConfigAccount.transferManager,
        mint: globalConfigAccount.mint,
        admin: provider.wallet.publicKey,
      })
      .signers([provider.wallet.payer])
      .rpc();

    console.log("Create Token Transaction Signature:", tx);

    console.log("Fetching newly created Mint Account...");
    const mintInfo = await getMint(
      provider.connection,
      globalConfigAccount.mint
    );

    console.log("Mint Account Info:", mintInfo);

    saveAccount("mint", globalConfigAccount.mint.toBase58());

    assert.strictEqual(
      mintInfo.mintAuthority?.toBase58(),
      globalConfigAccount.transferManager.toBase58(),
      "Mint authority mismatch"
    );
    assert.strictEqual(
      mintInfo.freezeAuthority?.toBase58(),
      globalConfigAccount.transferManager.toBase58(),
      "Freeze authority mismatch"
    );

    console.log("Token successfully created and validated!");
  });
});
