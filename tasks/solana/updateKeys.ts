import { task } from "hardhat/config";
import { updateKeys } from "../../utils/solana/updateKeys";

task(
  "setup:anchor:keys",
  "Generates new Solana keypair and syncs anchor keys",
).setAction(async () => {
  updateKeys();
});
