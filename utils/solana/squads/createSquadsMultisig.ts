import * as multisig from "@sqds/multisig";
import { Keypair, PublicKey } from "@solana/web3.js";
import { deriveConnection } from "../infrastructure/helpers";
import fs from "fs";
import os from "os";
import path from "path";

const loadKeypair = (filePath: string): Keypair => {
  if (filePath.startsWith("~")) {
    filePath = path.join(os.homedir(), filePath.slice(1));
  }
  const secretKeyJson = fs.readFileSync(filePath, "utf-8");
  const secretKey = Uint8Array.from(JSON.parse(secretKeyJson));
  return Keypair.fromSecretKey(secretKey);
};

export async function createSquadsMultisig(
  keypairPath: string,
  writable = true,
): Promise<PublicKey> {
  const { connection } = await deriveConnection(
    Number(process.env.SOLANA_EID) || 40168,
  );
  const createKey = Keypair.generate();
  const payer: Keypair = loadKeypair(keypairPath);
  const mintAuthority = payer.publicKey;
  const [multisigPda] = multisig.getMultisigPda({
    createKey: createKey.publicKey,
  });

  const programConfigPda = multisig.getProgramConfigPda({})[0];
  const programConfig =
    await multisig.accounts.ProgramConfig.fromAccountAddress(
      connection,
      programConfigPda,
    );
  const configTreasury = programConfig.treasury;

  console.log("Multisig PDA:", multisigPda.toBase58());

  const signature = await multisig.rpc.multisigCreateV2({
    connection,
    createKey,
    creator: payer,
    multisigPda,
    configAuthority: null,
    timeLock: 0,
    members: [
      {
        key: payer.publicKey,
        permissions: multisig.types.Permissions.all(),
      },
    ],
    threshold: 1,
    rentCollector: null,
    treasury: configTreasury,
    sendOptions: { skipPreflight: true },
  });

  await connection.confirmTransaction(signature);
  console.log(`Squads Multisig created: ${signature}`);
  const [vaultPda] = multisig.getVaultPda({ multisigPda, index: 0 });

  if (writable) {
    const filePath = path.resolve(
      __dirname,
      "../../../deployments/solana-testnet/SQUADS.json",
    );

    let data: any = {};
    if (fs.existsSync(filePath)) {
      const existingData = fs.readFileSync(filePath, "utf-8");
      data = JSON.parse(existingData);
    }
    data["multisigPDA"] = multisigPda.toBase58();
    data["vaultPDA"] = vaultPda.toBase58();
    data["vaultIndex"] = 0;

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  }
  if (writable) {
    const filePath = path.resolve(
      __dirname,
      "../../../deployments/solana-testnet/OFT.json",
    );

    let data: any = {};
    if (fs.existsSync(filePath)) {
      const existingData = fs.readFileSync(filePath, "utf-8");
      data = JSON.parse(existingData);
    }
    data["mintAuthority"] = mintAuthority.toBase58();

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  }
  return new PublicKey(multisigPda);
}
