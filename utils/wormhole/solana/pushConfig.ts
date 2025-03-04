import { execSync } from "child_process";
import fs from "fs";
import dotenv from "dotenv";
import path from "path";
import token from "../../../deployments/solana-ntt/ntt-solana.json";
dotenv.config();

export function push(keypair: string) {
  try {
    console.log("Push config.");

    // Define the directory where the command should be executed
    const targetDirectory = path.resolve(__dirname, "../../../ntt-mor");

    execSync(`ntt push --payer ${keypair} `, {
      stdio: "inherit", // Capture the output in a buffer
      cwd: targetDirectory, // Set the current working directory
    });
  } catch (e) {
    console.log(e);
  }
}
