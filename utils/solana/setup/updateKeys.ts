import { execSync } from "child_process";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();
export function updateKeys() {
  try {
    console.log("Generating new OFT keypair.");
    execSync("solana-keygen new -o target/deploy/moroft-keypair.json --force", {
      stdio: "inherit",
    });

    console.log("Syncing Anchor keys...");
    execSync("anchor keys sync", { stdio: "inherit" });

    const keypairPath = "target/deploy/moroft-keypair.json";
    if (fs.existsSync(keypairPath)) {
      const publicKey = execSync(`solana-keygen pubkey ${keypairPath}`)
        .toString()
        .trim();

      const envConfig = dotenv.parse(fs.readFileSync(".env"));
      envConfig["MOROFT_ID"] = publicKey;

      fs.writeFileSync(
        ".env",
        Object.entries(envConfig)
          .map(([key, value]) => `${key}=${value}`)
          .join("\n"),
      );
      console.log(`Updated .env with MOROFT_ID=${publicKey}`);
    } else {
      console.error(
        "Keypair file not found. Ensure solana-keygen executed correctly.",
      );
    }
  } catch (error) {
    console.error("Error executing setup task:", error);
  }
}
