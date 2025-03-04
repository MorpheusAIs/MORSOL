import { task } from "hardhat/config";

import { authorize } from "../../../utils/wormhole/solana/setAuthority";

task("morpheus:wormhole:authorize", "Mints tokens").setAction(async () => {
  authorize();
});
