import { task } from "hardhat/config";

import { mintToken } from "../../../utils/solana/squads/mint";
import { types as devtoolsTypes } from "@layerzerolabs/devtools-evm-hardhat";
import { mint } from "../../../deployments/solana-testnet/OFT.json";
interface MintOFTArgs {
  /**
   * The initial supply to mint on solana.
   */
  amount: number;

  /**
   * The endpoint ID for the Solana network.
   */
  mint: string;

  /**
   * OFT shared decimals.
   */
  keypairPath: string;
}
task(
  "morpheus:oft:solana:mint",
  "Generates new Solana keypair and syncs anchor keys",
)
  .addParam(
    "mint",
    "The Token mint public key (used for MABA only)",
    mint,
    devtoolsTypes.string,
  )
  .addParam(
    "amount",
    "The OFT Program id",
    process.env.MOROFT_ID,
    devtoolsTypes.string,
  )
  .addParam(
    "keypairPath",
    "Seller fee basis points",
    process.env.KEYPAIR_PATH,
    devtoolsTypes.string,
  )
  .setAction(async (args: MintOFTArgs) => {
    await mintToken(args.mint, args.amount, args.keypairPath);
  });
