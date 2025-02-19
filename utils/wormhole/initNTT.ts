import { execSync } from "child_process";
import fs from "fs";
import dotenv from "dotenv";
import {
  SolanaNtt,
  getTransceiverProgram,
} from "@wormhole-foundation/sdk-solana-ntt";
import {
  TransactionType,
  addComputeUnitInstructions,
  deriveConnection,
  deriveKeys,
  getExplorerTxLink,
  output,
} from "../solana/infrastructure/helpers";
import { SolanaWormholeCore } from "@wormhole-foundation/sdk-solana-core";

import * as spl from "@solana/spl-token";
import {
  AccountAddress,
  ChainAddress,
  ChainContext,
  Signer,
  UniversalAddress,
  Wormhole,
  contracts,
  deserialize,
  deserializePayload,
  encoding,
  serialize,
  serializePayload,
  signSendWait,
} from "@wormhole-foundation/sdk";
import bs58 from "bs58";
import {
  Connection,
  SystemProgram,
  TransactionMessage,
  LAMPORTS_PER_SOL,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";

import {
  SolanaAddress,
  SolanaPlatform,
  getSolanaSignAndSendSigner,
} from "@wormhole-foundation/sdk-solana";

import * as anchor from "@coral-xyz/anchor";
import { Keypair, PublicKey } from "@solana/web3.js";

const VERSION = "3.0.0";
const TOKEN_PROGRAM = spl.TOKEN_2022_PROGRAM_ID;
const GUARDIAN_KEY =
  "cfb12303a19cde580bb4dd771639b0d26bc68353645571a8cff516ab2ee113a0";
const CORE_BRIDGE_ADDRESS = contracts.coreBridge("Devnet", "Solana");
const NTT_ADDRESS = "nTt5QRvasqbgBYBA7Dx6dSmCenP4ouj4HNfjzDaXzrG";
const WH_TRANSCEIVER_ADDRESS = "TRL7UM47mtqYqn8nEJnuvaUVZvQzAxtHGrZyHngGA8S";

const remoteXcvr: ChainAddress = {
  chain: "Ethereum",
  address: new UniversalAddress(
    encoding.bytes.encode("transceiver".padStart(32, "\0")),
  ),
};
const remoteMgr: ChainAddress = {
  chain: "Ethereum",
  address: new UniversalAddress(
    encoding.bytes.encode("nttManager".padStart(32, "\0")),
  ),
};

export async function initNTT() {
  const payer = Keypair.fromSecretKey(
    bs58.decode(process.env.SOLANA_PRIVATE_KEY!),
  );
  const { connection, umi, umiWalletKeyPair, umiWalletSigner } =
    await deriveConnection(40168);

  const wh = new Wormhole("Devnet", [SolanaPlatform], {
    chains: { Solana: { contracts: { coreBridge: CORE_BRIDGE_ADDRESS } } },
  });
  const ctx: ChainContext<"Devnet", "Solana"> = wh
    .getPlatform("Solana")
    .getChain("Solana", connection);

  let tokenAccount: anchor.web3.PublicKey;

  const mint = anchor.web3.Keypair.generate();

  const owner = payer;
  const coreBridge = new SolanaWormholeCore("Devnet", "Solana", connection, {
    coreBridge: CORE_BRIDGE_ADDRESS,
  });

  const nttTransceivers = {
    wormhole: getTransceiverProgram(
      connection,
      WH_TRANSCEIVER_ADDRESS,
      VERSION,
    ),
  };

  let ntt: SolanaNtt<"Devnet", "Solana">;
  let signer: Signer;
  let sender: AccountAddress<"Solana">;
  let multisig: anchor.web3.PublicKey;
  let tokenAddress: string;

  signer = await getSolanaSignAndSendSigner(connection, payer, {
    //debug: true,
  });
  sender = Wormhole.parseAddress("Solana", signer.address());

  const extensions: any = [];
  const mintLen = spl.getMintLen(extensions);
  const lamports = await connection.getMinimumBalanceForRentExemption(mintLen);

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
  console.log(mint.publicKey);
  tokenAccount = await spl.createAssociatedTokenAccount(
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
  tokenAddress = mint.publicKey.toBase58();
  // Create our contract client
  ntt = new SolanaNtt(
    "Devnet",
    "Solana",
    connection,
    {
      ...ctx.config.contracts,
      ntt: {
        token: tokenAddress,
        manager: NTT_ADDRESS,
        transceiver: {
          wormhole: nttTransceivers["wormhole"].programId.toBase58(),
        },
      },
    },
    VERSION,
  );

  multisig = await spl.createMultisig(
    connection,
    payer,
    [owner.publicKey, ntt.pdas.tokenAuthority()],
    1,
    anchor.web3.Keypair.generate(),
    undefined,
    TOKEN_PROGRAM,
  );

  await spl.setAuthority(
    connection,
    payer,
    mint.publicKey,
    owner,
    spl.AuthorityType.MintTokens,
    multisig,
    [],
    undefined,
    TOKEN_PROGRAM,
  );

  const initTxs = ntt.initialize(sender, {
    mint: mint.publicKey,
    outboundLimit: 1000000n,
    mode: "burning",
    multisig,
  });
  await signSendWait(ctx, initTxs, signer);

  console.log("done");
  const registerTxs = ntt.registerWormholeTransceiver({
    payer: new SolanaAddress(payer.publicKey),
    owner: new SolanaAddress(payer.publicKey),
  });
  // await signSendWait(ctx, registerTxs, signer);
  console.log("done2");

  // Set Wormhole xcvr peer
  const setXcvrPeerTxs = ntt.setWormholeTransceiverPeer(remoteXcvr, sender);
  // await signSendWait(ctx, setXcvrPeerTxs, signer);

  // Set manager peer
  const setPeerTxs = ntt.setPeer(remoteMgr, 18, 1000000n, sender);
  // await signSendWait(ctx, setPeerTxs, signer);
  // const mint = anchor.web3.Keypair.generate();

  // const sig = await signSendWait(ctx, initTxs, signer);
  // console.log(sig);
  // const redeemTxs = ntt.redeem([vaa], sender, multisig);
  // // register
  // const registerTxs = ntt.registerWormholeTransceiver({
  //   payer: new SolanaAddress(payer.publicKey),
  //   owner: new SolanaAddress(payer.publicKey),
  // });
  // await signSendWait(ctx, registerTxs, signer);

  // // Set Wormhole xcvr peer
  // const setXcvrPeerTxs = ntt.setWormholeTransceiverPeer(
  //   remoteXcvr,
  //   sender
  // );
  // await signSendWait(ctx, setXcvrPeerTxs, signer);

  // // Set manager peer
  // const setPeerTxs = ntt.setPeer(remoteMgr, 18, 1000000n, sender);
  // await signSendWait(ctx, setPeerTxs, signer);

  // const transaction = new Transaction().add(
  //   await ntt.program.methods
  //         .setTokenAuthorityOneStepUnchecked()
  //         .accountsStrict({
  //           common: {
  //             config: ntt.pdas.configAccount(),
  //             tokenAuthority: ntt.pdas.tokenAuthority(),
  //             mint: (await ntt.getConfig()).mint,
  //             owner: new SolanaAddress(await ntt.getOwner()).unwrap(),
  //             newAuthority: multisig,
  //           },
  //           tokenProgram: (await ntt.getConfig()).tokenProgram,
  //         })
  //         .instruction()
  // );
  // transaction.feePayer = payer.publicKey;

  // const { blockhash } = await connection.getLatestBlockhash();
  // transaction.recentBlockhash = blockhash;
  // await sendAndConfirmTransaction(connection, transaction, [
  //   payer, // payer == NTT owner
  // ]);
}
