import { task } from "hardhat/config";

import { createSquadsMultisig } from "../../../utils/solana/squads/createSquadsMultisig";
import { types as devtoolsTypes } from "@layerzerolabs/devtools-evm-hardhat";
import { mint } from "../../../deployments/solana-testnet/OFT.json";
import dotenv from "dotenv";

dotenv.config();
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
    process.env.SOLANA_KEYPAIR_PATH,
    devtoolsTypes.string,
  )
  .setAction(async (args: MintOFTArgs) => {
    await createSquadsMultisig(args.keypairPath);
  });
