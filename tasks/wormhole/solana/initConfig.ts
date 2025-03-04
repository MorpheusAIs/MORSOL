import { task } from "hardhat/config";
import { initNTT } from "../../../utils/wormhole/solana/initNTT";

task("morpheus:wormhole:init", "Inits solana config").setAction(async () => {
  initNTT();
});
