import { task } from "hardhat/config";
import { updateKeys } from "../../../utils/solana/setup/updateKeys";

task(
  "morpheus:setup:anchor:keys",
  "Generates new Solana keypair and syncs anchor keys",
).setAction(async () => {
  updateKeys();
});
