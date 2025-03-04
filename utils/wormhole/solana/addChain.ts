import { execSync } from "child_process";
import fs from "fs";
import dotenv from "dotenv";
import path from "path";
import token from "../../../deployments/solana-ntt/ntt-solana.json";
dotenv.config();
import { spawnSync } from "child_process";

export function addChain(pathKeypair: string) {
  try {
    console.log("Creating new NTT...");

    // Define the directory where the command should be executed
    const targetDirectory = path.resolve(__dirname, "../../../ntt-mor");

    execSync(
      `ntt add-chain Solana --ver 2.0.0 --mode burning --token ${token.token} --payer ${pathKeypair} --program-key ${token.keypair}`,
      {
        stdio: "inherit", // Capture the output in a buffer
        cwd: targetDirectory, // Set the current working directory
      },
    );
  } catch (e) {
    console.log(e);
  }
}
