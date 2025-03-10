import { task } from "hardhat/config";

import { createSquadsMultisig } from "../../../utils/solana/squads/createSquadsMultisig";
import { types as devtoolsTypes } from "@layerzerolabs/devtools-evm-hardhat";
import { mint } from "../../../deployments/solana-testnet/OFT.json";
interface MintOFTArgs {
  keypairPath: string;
}
task(
  "morpheus:solana:create-squads",
  "Generates new Solana keypair and syncs anchor keys",
)
  .addParam(
    "keypairPath",
    "Seller fee basis points",
    undefined,
    devtoolsTypes.string,
  )
  .setAction(async (args: MintOFTArgs) => {
    await createSquadsMultisig(args.keypairPath);
  });
