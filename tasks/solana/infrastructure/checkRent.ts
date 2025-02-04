import { task } from "hardhat/config";

import { checkRent } from "../../../utils/solana/infrastructure/rent";

task(
  "morpheus:deploy:anchor:rent",
  "Generates new Solana keypair and syncs anchor keys",
).setAction(async () => {
  checkRent();
});
