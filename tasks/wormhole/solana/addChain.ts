import { task } from "hardhat/config";

import { addChain } from "../../../utils/wormhole/solana/addChain";

task("morpheus:wormhole:solana:add_chain", "Mints tokens").setAction(
  async () => {
    addChain(process.env.KEYPAIR_PATH || "~/.config/solana/id.json");
  },
);
