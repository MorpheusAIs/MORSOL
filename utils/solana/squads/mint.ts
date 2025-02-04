import {
  PublicKey,
  Connection,
  SystemProgram,
  TransactionMessage,
  LAMPORTS_PER_SOL,
  Transaction,
  Keypair,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import * as multisig from "@sqds/multisig";
import {
  getOrCreateAssociatedTokenAccount,
  createMintToInstruction,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import fs from "fs";
import * as anchor from "@coral-xyz/anchor";

const loadKeypair = (path: string): Keypair => {
  const secretKey = JSON.parse(fs.readFileSync(path, "utf-8"));
  return Keypair.fromSecretKey(new Uint8Array(secretKey));
};

export const mintToken = async (
  mintAddress: string,
  amount: number,
  payerKeypairPath: string,
) => {
  const connection = new Connection(
    "https://api.devnet.solana.com",
    "confirmed",
  );

  const payer: Keypair = loadKeypair(payerKeypairPath);

  const mint = new PublicKey(mintAddress);

  const multisigPda = new PublicKey(
    "HPayKENTz7hKQ4Awzt1cE9FvDTaWWMPrG82VuT9vj4b9",
  );

  const [vaultPda] = multisig.getVaultPda({ multisigPda, index: 0 });

  console.log(`Multisig PDA: ${multisigPda.toBase58()}`);
  console.log(`Vault PDA: ${vaultPda.toBase58()}`);

  const multisigInfo = await multisig.accounts.Multisig.fromAccountAddress(
    connection,
    multisigPda,
  );
  const transactionIndex = BigInt(Number(multisigInfo.transactionIndex) + 1);

  console.log(`Transaction Index: ${transactionIndex}`);

  const tokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    mint,
    payer.publicKey,
  );

  console.log(`Recipient Token Account: ${tokenAccount.address.toBase58()}`);

  const mintIx = createMintToInstruction(
    mint,
    tokenAccount.address,
    vaultPda,
    amount,
    [],
    TOKEN_PROGRAM_ID,
  );

  console.log("✅ MintTo Instruction Created");

  const transactionMessage = new TransactionMessage({
    payerKey: payer.publicKey,
    recentBlockhash: (await connection.getLatestBlockhash()).blockhash,
    instructions: [mintIx],
  });

  const createVaultTxIx = multisig.instructions.vaultTransactionCreate({
    multisigPda,
    transactionIndex,
    creator: payer.publicKey,
    vaultIndex: 0,
    ephemeralSigners: 0,
    transactionMessage,
    memo: "Minting tokens via Squads Vault",
  });

  const tx = new Transaction().add(createVaultTxIx);

  const test = await sendAndConfirmTransaction(connection, tx, [payer]);
  console.log(`✅ Vault Transaction ! Transaction Signature: ${test}`);
  console.log("✅ Vault Transaction Created in Squads");

  const iix = multisig.instructions.proposalCreate({
    multisigPda,
    transactionIndex,
    // Must have "Voter" permissions at minimum
    creator: payer.publicKey,
  });
  const tiix = new Transaction().add(iix);

  const tixxx = await sendAndConfirmTransaction(connection, tiix, [payer]);
  console.log(`✅ Proposal ! Transaction Signature: ${tixxx}`);

  const ix = multisig.instructions.proposalApprove({
    multisigPda,
    transactionIndex,
    // Member must have "Voter" permissions
    member: payer.publicKey,
  });

  const tix = new Transaction().add(ix);

  const tixx = await sendAndConfirmTransaction(connection, tix, [payer]);
  console.log(`✅ Approve ! Transaction Signature: ${tixx}`);

  const [transactionPda] = multisig.getTransactionPda({
    multisigPda,
    index: transactionIndex,
  });

  let transactionAccount =
    await multisig.accounts.VaultTransaction.fromAccountAddress(
      connection,
      transactionPda,
    );

  console.log("Transaction PDA: ", transactionPda);

  console.log("Transaction: ", transactionAccount);

  const executeVaultTxIx = await multisig.instructions.vaultTransactionExecute({
    connection,
    multisigPda,
    transactionIndex,
    member: payer.publicKey,
  });

  const executeTx = new Transaction().add(executeVaultTxIx.instruction);
  const signature = await sendAndConfirmTransaction(connection, executeTx, [
    payer,
  ]);

  console.log(`✅ Mint successful! Transaction Signature: ${signature}`);
};
