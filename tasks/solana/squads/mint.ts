import { task } from "hardhat/config";

import { mintToken } from "../../../utils/solana/squads/mint";
import { types as devtoolsTypes } from "@layerzerolabs/devtools-evm-hardhat";
import { mint } from "../../../deployments/solana-testnet/OFT.json";
interface MintOFTArgs {
  amount: number;

  keypairPath: string;
}
task("morpheus:solana:mint-squads", "Mint tokens through squads multisig")
  .addParam(
    "amount",
    "Desired token amount in LAMPORTS",
    undefined,
    devtoolsTypes.string,
  )
  .addParam(
    "keypairPath",
    "Keypair path",
    process.env.KEYPAIR_PATH,
    devtoolsTypes.string,
  )
  .setAction(async (args: MintOFTArgs) => {
    await mintToken(args.amount, args.keypairPath);
  });
