import { TOKEN_PROGRAM_ID } from "@solana/spl-token";

import { task } from "hardhat/config";
import { initNTT } from "../../utils/wormhole/initNTT";
import { createMetadata } from "../../utils/wormhole/createMetadata";

// Define a Hardhat task for sending OFT from Solana
task(
  "morpheus:ntt:create-metadata",
  "Send tokens from Solana to a target EVM chain",
).setAction(async () => {
  await createMetadata();
});
