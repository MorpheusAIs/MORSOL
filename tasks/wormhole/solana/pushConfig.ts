import { task } from "hardhat/config";
import { mint } from "../../../utils/wormhole/solana/mint";
import { push } from "../../../utils/wormhole/solana/pushConfig";

task("morpheus:wormhole:push", "Pushes config").setAction(async () => {
  push(process.env.KEYPAIR_PATH || "~/.config/solana/id.json");
});
