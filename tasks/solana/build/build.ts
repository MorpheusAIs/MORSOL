import { task } from "hardhat/config";
import { buildVerifiable } from "../../../utils/solana/build/build";

task(
  "morpheus:anchor:build:verifiable",
  "Generates new Solana keypair and syncs anchor keys",
).setAction(async () => {
  buildVerifiable();
});
