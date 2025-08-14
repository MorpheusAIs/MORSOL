import { findAssociatedTokenPda } from "@metaplex-foundation/mpl-toolbox";
import { publicKey, transactionBuilder } from "@metaplex-foundation/umi";
import { fromWeb3JsPublicKey } from "@metaplex-foundation/umi-web3js-adapters";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import bs58 from "bs58";
import { EndpointId } from "@layerzerolabs/lz-definitions";
import { addressToBytes32, Options } from "@layerzerolabs/lz-v2-utilities";
import { oft } from "@layerzerolabs/oft-v2-solana-sdk";

import {
  TransactionType,
  addComputeUnitInstructions,
  deriveConnection,
  getExplorerTxLink,
  getLayerZeroScanLink,
} from "../infrastructure/helpers";
import { SendOFTSolanaArgs } from "../../interfaces/solana/sendOFT.args";

export async function sendOFT(args: SendOFTSolanaArgs) {
  const {
    amount,
    fromEid,
    to,
    toEid,
    mint: mintStr,
    programId: programIdStr,
    escrow: escrowStr,
    tokenProgram: tokenProgramStr,
    computeUnitPriceScaleFactor,
  } = args;

  const { connection, umi, umiWalletSigner } = await deriveConnection(fromEid);

  const oftProgramId = publicKey(programIdStr);
  const mint = publicKey(mintStr);
  const umiEscrowPublicKey = publicKey(escrowStr);
  const tokenProgramId = tokenProgramStr
    ? publicKey(tokenProgramStr)
    : fromWeb3JsPublicKey(TOKEN_PROGRAM_ID);

  const tokenAccount = findAssociatedTokenPda(umi, {
    mint: publicKey(mintStr),
    owner: umiWalletSigner.publicKey,
    tokenProgramId,
  });

  if (!tokenAccount) {
    throw new Error(
      `No token account found for mint ${mintStr} and owner ${umiWalletSigner.publicKey} in program ${tokenProgramId}`,
    );
  }

  const recipientAddressBytes32 = addressToBytes32(to);
  let options = Options.newOptions()
    .addExecutorLzReceiveOption(200000, 250000)
    .toBytes();
  const { nativeFee } = await oft.quote(
    umi.rpc,
    {
      payer: umiWalletSigner.publicKey,
      tokenMint: mint,
      tokenEscrow: umiEscrowPublicKey,
    },
    {
      payInLzToken: false,
      // @ts-ignore
      to: Buffer.from(recipientAddressBytes32),
      dstEid: toEid,
      amountLd: BigInt(amount),
      minAmountLd: 1n,
      options: options,
      composeMsg: undefined,
    },
    {
      oft: oftProgramId,
    },
  );

  const ix = await oft.send(
    umi.rpc,
    {
      payer: umiWalletSigner,
      tokenMint: mint,
      tokenEscrow: umiEscrowPublicKey,
      tokenSource: tokenAccount[0],
    },
    {
      // @ts-ignore
      to: Buffer.from(recipientAddressBytes32),
      dstEid: toEid,
      amountLd: BigInt(amount),
      minAmountLd: (BigInt(amount) * BigInt(9)) / BigInt(10),
      options: options,
      composeMsg: undefined,
      nativeFee,
    },
    {
      oft: oftProgramId,
      token: tokenProgramId,
    },
  );

  let txBuilder = transactionBuilder().add([ix]);
  txBuilder = await addComputeUnitInstructions(
    connection,
    umi,
    fromEid,
    txBuilder,
    umiWalletSigner,
    computeUnitPriceScaleFactor,
    TransactionType.SendOFT,
  );
  const { signature } = await txBuilder.sendAndConfirm(umi);
  const transactionSignatureBase58 = bs58.encode(signature);

  console.log(`sent ${amount} to ${to}: ${transactionSignatureBase58}`);
  const isTestnet = fromEid == EndpointId.SOLANA_V2_TESTNET;
  console.log(
    `View Solana transaction here: ${getExplorerTxLink(transactionSignatureBase58.toString(), isTestnet)}`,
  );
  console.log(
    `Track cross-chain transfer here: ${getLayerZeroScanLink(transactionSignatureBase58, isTestnet)}`,
  );
}
