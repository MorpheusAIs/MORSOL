import { execSync } from "child_process";
import dotenv from "dotenv";

dotenv.config();
export function buildVerifiable() {
  try {
    console.log("Building OFT program.");
    execSync("anchor build -v", {
      stdio: "inherit",
    });
  } catch (error) {
    console.error("Error executing setup task:", error);
  }
}
