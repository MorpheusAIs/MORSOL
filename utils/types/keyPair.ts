import { decode } from "@coral-xyz/anchor/dist/cjs/utils/bytes/bs58";
import { Keypair } from "@solana/web3.js";
import { CLIArgumentType } from "hardhat/types";

export const keyPair: CLIArgumentType<Keypair> = {
  name: "keyPair",
  parse(name: string, value: string) {
    return Keypair.fromSecretKey(decode(value));
  },
  validate() {},
};
