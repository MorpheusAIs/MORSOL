import bs58 from "bs58";
import { BigNumber } from "ethers";
import { task, types } from "hardhat/config";
// import { ActionType, HardhatRuntimeEnvironment } from "hardhat/types";

import { makeBytes32 } from "@layerzerolabs/devtools";
import { EndpointId } from "@layerzerolabs/lz-definitions";

import { getLayerZeroScanLink } from "../solana/infrastructure/helpers";
import { Options } from "@layerzerolabs/lz-v2-utilities";
import { SendOFTEVMArgs } from "../interfaces/evm/sendOFT.args";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { parseUnits } from "ethers/lib/utils";

export async function sendOFTEVM(
  { dstEid, amount, to, contractName }: SendOFTEVMArgs,
  hre: HardhatRuntimeEnvironment,
) {
  const signer = await hre.ethers.getNamedSigner("deployer");
  // @ts-ignore
  const token = (await hre.ethers.getContract(contractName)).connect(signer);

  // if (isSepolia(hre.network.name)) {
  //     // @ts-ignore
  //     const erc20Token = (await hre.ethers.getContractAt(IERC20, address)).connect(signer)
  //     const approvalTxResponse = await erc20Token.approve(token.address, amount)
  //     const approvalTxReceipt = await approvalTxResponse.wait()
  //     console.log(`approve: ${amount}: ${approvalTxReceipt.transactionHash}`)
  // }

  const amountLD = parseUnits(amount.toString(), 9);
  let options = Options.newOptions()
    .addExecutorLzReceiveOption(200000, 250000)
    .toHex();

  console.log(options);
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
  console.log(`send: ${amount} to ${to}: ${txReceipt.transactionHash}`);
  console.log(
    `Track cross-chain transfer here: ${getLayerZeroScanLink(txReceipt.transactionHash, dstEid == EndpointId.SOLANA_V2_TESTNET)}`,
  );
}
