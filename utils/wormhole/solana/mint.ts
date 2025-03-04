import { execSync } from "child_process";
import fs from "fs";
import dotenv from "dotenv";
import path from "path";
import token from "../../../deployments/solana-ntt/ntt-solana.json";
dotenv.config();

export function mint() {
  try {
    console.log("Minting tokens.");

    // Define the directory where the command should be executed
    const targetDirectory = path.resolve(
      __dirname,
      "../../../deployments/solana-ntt",
    );

    execSync(`spl-token mint ${token.token} 1000000`, {
      stdio: "inherit", // Capture the output in a buffer
      cwd: targetDirectory, // Set the current working directory
    });
  } catch (e) {
    console.log(e);
  }
}
