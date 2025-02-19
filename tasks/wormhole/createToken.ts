import { TOKEN_PROGRAM_ID } from "@solana/spl-token";

import { task } from "hardhat/config";
import { initNTT } from "../../utils/wormhole/initNTT";
import { createMetadata } from "../../utils/wormhole/createMetadata";
import { createToken } from "../../utils/wormhole/createToken";

// Define a Hardhat task for sending OFT from Solana
task(
  "morpheus:ntt:create-token",
  "Send tokens from Solana to a target EVM chain",
).setAction(async () => {
  await createToken();
});
