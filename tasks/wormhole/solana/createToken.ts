import { task } from "hardhat/config";
import { createToken } from "../../../utils/wormhole/solana/createToken";

task("morpheus:wormhole:create_token", "Generates new Solana token").setAction(
  async () => {
    await createToken();
  },
);
