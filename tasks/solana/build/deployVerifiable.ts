import { task } from "hardhat/config";

import { deployVerifiable } from "../../../utils/solana/build/deploy";

task(
  "morpheus:anchor:deploy:verifiable",
  "Generates new Solana keypair and syncs anchor keys",
).setAction(async () => {
  deployVerifiable();
});
