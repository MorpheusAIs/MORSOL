import { PublicKey } from "@solana/web3.js";
import { CLIArgumentType } from "hardhat/types";

export const publicKey: CLIArgumentType<PublicKey> = {
  name: "keyPair",
  parse(name: string, value: string) {
    return new PublicKey(value);
  },
  validate() {},
};
