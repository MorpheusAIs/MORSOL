import { task, types } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { SendOFTEVMArgs } from "../../utils/interfaces/evm/sendOFT.args";
import { sendOFTEVM } from "../../utils/evm/sendSepoliaOFT";

task("morpheus:evm:send", "Sends a transaction")
  .addParam("dstEid", "Destination endpoint ID", 40168, types.int, true)
  .addParam("amount", "Amount to send in wei", undefined, types.int, false)
  .addParam("to", "Recipient address", undefined, types.string, false)
  .addOptionalParam(
    "contractName",
    "Name of the contract in deployments folder",
    "Token",
    types.string,
  )
  .setAction(async (args: SendOFTEVMArgs, hre: HardhatRuntimeEnvironment) => {
    await sendOFTEVM(args, hre);
  });
