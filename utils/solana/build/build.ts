import { execSync } from "child_process";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();
export function buildVerifiable() {
  try {
    console.log("Generating new Solana keypair...");
    execSync("anchor build -v", {
      stdio: "inherit",
    });
  } catch (error) {
    console.error("Error executing setup task:", error);
  }
}
