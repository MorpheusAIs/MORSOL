import { task } from "hardhat/config";
import { mint } from "../../../utils/wormhole/solana/mint";

task("morpheus:wormhole:mint", "Mints tokens").setAction(async () => {
  mint();
});
