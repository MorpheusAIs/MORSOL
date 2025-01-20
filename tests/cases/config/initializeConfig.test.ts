import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Morsol } from "../../../target/types/morsol";
import { Keypair, PublicKey } from "@solana/web3.js";
import { saveAccount } from "../../utils/accountUtils";
import assert from "assert";

describe("Initialize Global Config", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const morsolProgram = anchor.workspace.morsol as Program<Morsol>;

  it("Initializes Global Config", async () => {
    console.log("Generating Global Config PDA...");
    const [globalConfigAddress] = await PublicKey.findProgramAddress(
      [Buffer.from("config")],
      morsolProgram.programId
    );
    console.log("Global Config Address:", globalConfigAddress.toBase58());

    console.log("Starting transaction to initialize Global Config...");
    const tx = await morsolProgram.methods
      .initializeConfig()
      .accounts({
        globalConfig: globalConfigAddress,
        admin: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([provider.wallet.payer])
      .rpc();

    console.log("Transaction Signature:", tx);

    console.log("Fetching Global Config account...");
    const globalConfigAccount = await morsolProgram.account.globalConfig.fetch(
      globalConfigAddress
    );

    console.log("Global Config Account Data:", globalConfigAccount);

    // Save the account details
    saveAccount("globalConfig", globalConfigAddress.toBase58());
    saveAccount("admin", provider.wallet.publicKey.toBase58());
    saveAccount("globalConfigInfo", globalConfigAccount);

    console.log("Global Config and Admin details saved to accounts.json.");

    // Assertions to validate the account fields
    assert.strictEqual(
      globalConfigAccount.admin.toBase58(),
      provider.wallet.publicKey.toBase58(),
      "Admin mismatch in GlobalConfig"
    );

    assert.ok(
      globalConfigAccount.transferManagerBumps !== undefined,
      "Transfer Manager Bump is not initialized"
    );

    assert.ok(
      globalConfigAccount.mintBumps !== undefined,
      "Mint Bump is not initialized"
    );

    assert.ok(globalConfigAccount.mint !== null, "Mint account is not set");

    console.log(
      "All assertions passed. Global Config initialized successfully!"
    );
  });
});
