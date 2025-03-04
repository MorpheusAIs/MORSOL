import { execSync } from "child_process";
import fs from "fs";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

export function initNTT() {
  try {
    console.log("Creating new NTT...");

    // Define the directory where the command should be executed
    let targetDirectory = path.resolve(__dirname, "../../../ntt-mor");

    execSync("ntt init Testnet", {
      stdio: "inherit", // Inherit the input/output streams
      cwd: targetDirectory, // Set the current working directory
    });

    const output = execSync(
      "solana-keygen grind --starts-with ntt:1 --ignore-case",
      {
        stdio: "pipe", // Capture the output in a buffer
        cwd: targetDirectory, // Set the current working directory
      },
    );

    // Convert output buffer to string and extract the file name
    const outputStr = output.toString();
    const keypairFileName = outputStr.trim().split(" to ").pop(); // Get the last line (keypair file path)
    console.log(`Keypair saved to: ${keypairFileName}`);

    const outputPDA = execSync(
      `ntt solana token-authority ${keypairFileName?.split(".json")[0]}`,
      {
        stdio: "pipe", // Capture the output in a buffer
        cwd: targetDirectory, // Set the current working directory
      },
    );
    const pda = outputPDA.toString().trim(); // Get the last line (keypair file path)
    console.log(`PDA to: ${pda}`);

    // const data = { tokenAddress };
    const filePath = path.resolve(
      __dirname,
      "../../../deployments/solana-ntt/ntt-solana.json",
    );
    const dirPath = path.dirname(filePath);
    let data: any = {};
    if (fs.existsSync(filePath)) {
      const existingData = fs.readFileSync(filePath, "utf-8");
      data = JSON.parse(existingData);
    }

    data["PDA"] = pda;
    data["keypair"] = keypairFileName;

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log("Token address saved to ntt-solana.json");
  } catch (error) {
    console.error("Error executing setup task:", error);
  }
}
