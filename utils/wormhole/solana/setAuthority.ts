import { execSync } from "child_process";
import fs from "fs";
import dotenv from "dotenv";
import path from "path";
import token from "../../../deployments/solana-ntt/ntt-solana.json";
dotenv.config();

export function authorize() {
  try {
    console.log("Creating new NTT...");

    // Define the directory where the command should be executed
    const targetDirectory = path.resolve(
      __dirname,
      "../../../deployments/solana-ntt",
    );

    execSync(`spl-token authorize ${token.token} mint ${token.PDA}`, {
      stdio: "inherit", // Capture the output in a buffer
      cwd: targetDirectory, // Set the current working directory
    });
  } catch (e) {
    console.log(e);
  }
}
