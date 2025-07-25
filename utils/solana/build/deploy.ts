import { execSync } from "child_process";
import dotenv from "dotenv";

dotenv.config();
export function deployVerifiable() {
  try {
    console.log("Deploying OFT program.");
    execSync(
      "solana program deploy --program-id target/deploy/moroft-keypair.json target/verifiable/moroft.so -u devnet",
      {
        stdio: "inherit",
      },
    );
  } catch (error) {
    console.error("Error executing setup task:", error);
  }
}
