import { task } from "hardhat/config";

import { checkRent } from "../../../utils/solana/infrastructure/rent";

task(
  "morpheus:solana:deploy:rent",
  "Util for checking deploy price on Solana.",
).setAction(async () => {
  checkRent();
});
