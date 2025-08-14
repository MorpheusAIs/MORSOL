import { execSync } from "child_process";
import dotenv from "dotenv";

dotenv.config();
export function checkRent() {
  try {
    execSync(
      `solana rent $(wc -c < target/verifiable/moroft.so) --url ${process.env.RPC_URL_SOLANA_TESTNET || "https://api.devnet.solana.com"}`,
      {
        stdio: "inherit",
      },
    );
  } catch (error) {
    console.error("Error executing setup task:", error);
  }
}
