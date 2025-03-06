import { expect } from "chai";
import bs58 from "bs58";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";
import { addressToBytes32, Options } from "@layerzerolabs/lz-v2-utilities";
import { makeBytes32 } from "@layerzerolabs/devtools";
import { EndpointId } from "@layerzerolabs/lz-definitions";
import { oft } from "@layerzerolabs/oft-v2-solana-sdk";

import {
  getLayerZeroScanLink,
  getExplorerTxLink,
  addComputeUnitInstructions,
  TransactionType,
} from "../../utils/solana/infrastructure/helpers";
import { deriveConnection } from "../../utils/solana/infrastructure/helpers";
import { SendOFTEVMArgs } from "../../utils/interfaces/evm/sendOFT.args";
import { SendOFTSolanaArgs } from "../../utils/interfaces/solana/sendOFT.args";
import { PublicKey } from "@solana/web3.js";
import { publicKey, transactionBuilder } from "@metaplex-foundation/umi";
import {
  getAccount,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  mint,
  programId,
  escrow,
} from "../../deployments/solana-testnet/OFT.json";
import { HardhatRuntimeEnvironment } from "hardhat/types";

// **Helper: Get Solana Token Balance**
async function getBalanceOnSolana(
  mint: string,
  owner: string,
): Promise<number> {
  const { connection } = await deriveConnection(EndpointId.SOLANA_V2_TESTNET);
  const ata = await getAssociatedTokenAddress(
    new PublicKey(mint),
    new PublicKey(owner),
  );

  // Get token account balance
  try {
    const accountInfo = await getAccount(connection, ata);
    return Number(accountInfo.amount);
  } catch (err: any) {
    console.error("Error fetching token balance: ", err.message);
    return 0;
  }
  //   return balance.value.uiAmount || 0;
}

// **Helper: Get EVM Token Balance**
async function getBalanceOnEVM(
  contractName: string,
  owner: string,
): Promise<BigNumber> {
  const signer = await ethers.getNamedSigner("deployer");
  // @ts-ignore
  const token = (await ethers.getContract(contractName)).connect(signer);
  return await token.functions.balanceOf(owner);
}

// **Send OFT from EVM**
async function sendOFTEVM({
  dstEid,
  amount,
  to,
  contractName,
}: SendOFTEVMArgs) {
  const signer = await ethers.getNamedSigner("deployer");
  const token = (await ethers.getContract(contractName)).connect(signer);
  const amountLD = BigNumber.from(amount);
  let options = Options.newOptions()
    .addExecutorLzReceiveOption(200000, 250000)
    .toHex();

  const sendParam = {
    dstEid,
    to: makeBytes32(bs58.decode(to)),
    amountLD: amountLD.toString(),
    minAmountLD: amountLD.mul(9_000).div(10_000).toString(),
    extraOptions: options,
    composeMsg: "0x",
    oftCmd: "0x",
  };

  const [msgFee] = await token.functions.quoteSend(sendParam, false);
  const txResponse = await token.functions.send(
    sendParam,
    msgFee,
    signer.address,
    {
      value: msgFee.nativeFee,
      gasLimit: 500_000_000,
    },
  );

  const txReceipt = await txResponse.wait();
  console.log(
    `Sent ${amount} tokens from Arbitrum Sepolia: ${txReceipt.transactionHash}`,
  );
  console.log(
    `Track transfer: ${getLayerZeroScanLink(txReceipt.transactionHash, dstEid === EndpointId.SOLANA_V2_TESTNET)}`,
  );
}

async function sendOFT(args: SendOFTSolanaArgs) {
  const {
    amount,
    fromEid,
    to,
    toEid,
    mint,
    programId,
    escrow,
    tokenProgram,
    computeUnitPriceScaleFactor,
  } = args;

  const { connection, umi, umiWalletSigner } = await deriveConnection(fromEid);
  const oftProgramId = new PublicKey(programId);
  const mintPublicKey = publicKey(mint);
  const umiEscrowPublicKey = publicKey(escrow);
  const tokenProgramId = tokenProgram
    ? publicKey(tokenProgram)
    : publicKey(TOKEN_PROGRAM_ID);

  const recipientAddressBytes32 = addressToBytes32(to);
  let options = Options.newOptions()
    .addExecutorLzReceiveOption(200000, 250000)
    .toBytes();

  const { nativeFee } = await oft.quote(
    umi.rpc,
    {
      payer: umiWalletSigner.publicKey,
      tokenMint: mintPublicKey,
      tokenEscrow: umiEscrowPublicKey,
    },
    {
      payInLzToken: false,
      to: Buffer.from(recipientAddressBytes32),
      dstEid: toEid,
      amountLd: BigInt(amount),
      minAmountLd: 1n,
      options,
      composeMsg: undefined,
    },
    { oft: oftProgramId },
  );

  const ix = await oft.send(
    umi.rpc,
    {
      payer: umiWalletSigner,
      tokenMint: mintPublicKey,
      tokenEscrow: umiEscrowPublicKey,
      tokenSource: publicKey(mint),
    },
    {
      to: Buffer.from(recipientAddressBytes32),
      dstEid: toEid,
      amountLd: BigInt(amount),
      minAmountLd: (BigInt(amount) * BigInt(9)) / BigInt(10),
      options,
      composeMsg: undefined,
      nativeFee,
    },
    { oft: oftProgramId, token: tokenProgramId },
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
  console.log(`Sent ${amount} tokens from Solana!`);
  console.log(
    `View Solana transaction: ${getExplorerTxLink(transactionSignatureBase58, fromEid === EndpointId.SOLANA_V2_TESTNET)}`,
  );
}

// **Mocha Test for OFT Cross-Chain Transfers**
describe("LayerZero OFT Cross-Chain Transfer Test", function () {
  this.timeout(300000); // Set timeout to 5 minutes for async operations

  const SOLANA_EID = EndpointId.SOLANA_V2_TESTNET;
  const ARB_SEPOLIA_EID = EndpointId.ARBSEP_V2_TESTNET;
  const amount = 10;
  const userSolana = process.env.SOLANA_PUBLIC_KEY || ""; // Replace with actual Solana address
  const userEVM = process.env.EVM_PUBLIC_KEY || ""; // Replace with actual EVM address
  const solanaMint = mint; // Replace with actual token mint
  const evmContract = "MORTOKENV"; // Replace with actual deployed OFT contract

  let solanaBalanceBefore: number, evmBalanceBefore: BigNumber;
  let solanaBalanceAfter: number, evmBalanceAfter: BigNumber;

  it("Check initial balances", async function () {
    solanaBalanceBefore = await getBalanceOnSolana(solanaMint, userSolana);
    evmBalanceBefore = await getBalanceOnEVM(evmContract, userEVM);

    console.log(`💰 Initial Solana Balance: ${solanaBalanceBefore}`);
    console.log(`💰 Initial EVM Balance: ${evmBalanceBefore}`);

    expect(solanaBalanceBefore).to.be.a("number");
    expect(evmBalanceBefore).to.be.instanceOf(BigNumber);
  });

  it("Send 10 tokens from Solana to Arbitrum Sepolia", async function () {
    await sendOFT({
      amount,
      fromEid: SOLANA_EID,
      to: userEVM,
      toEid: ARB_SEPOLIA_EID,
      mint: solanaMint,
      programId: "<SOLANA_OFT_PROGRAM>",
      escrow: "<SOLANA_ESCROW>",
      tokenProgram: "<SOLANA_TOKEN_PROGRAM>",
      computeUnitPriceScaleFactor: 1.2,
    });

    console.log("⏳ Waiting 30 seconds...");
    await new Promise((resolve) => setTimeout(resolve, 30000));
  });

  it("Send 10 tokens from Arbitrum Sepolia to Solana", async function () {
    await sendOFTEVM({
      dstEid: SOLANA_EID,
      amount: amount.toString(),
      to: userSolana,
      contractName: evmContract,
    });

    console.log("⏳ Waiting another 30 seconds...");
    await new Promise((resolve) => setTimeout(resolve, 30000));
  });

  it("Check final balances", async function () {
    solanaBalanceAfter = await getBalanceOnSolana(solanaMint, userSolana);
    evmBalanceAfter = await getBalanceOnEVM(evmContract, userEVM);

    console.log(`💰 Final Solana Balance: ${solanaBalanceAfter}`);
    console.log(`💰 Final EVM Balance: ${evmBalanceAfter}`);

    expect(solanaBalanceAfter).to.not.equal(solanaBalanceBefore);
    expect(evmBalanceAfter).to.not.equal(evmBalanceBefore);
  });
});
