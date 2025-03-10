import { task } from "hardhat/config";

import { checkRent } from "../../../utils/solana/infrastructure/rent";

task(
  "morpheus:solana:deploy:rent",
  "Generates new Solana keypair and syncs anchor keys",
).setAction(async () => {
  checkRent();
});
