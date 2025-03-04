import { execSync } from "child_process";
import fs from "fs";
import dotenv from "dotenv";
import * as anchor from "@coral-xyz/anchor";
import * as path from "path";

import {
  createFungible,
  mplTokenMetadata,
} from "@metaplex-foundation/mpl-token-metadata";
import {
  createTokenIfMissing,
  findAssociatedTokenPda,
  getSplAssociatedTokenProgramId,
  mintTokensTo,
} from "@metaplex-foundation/mpl-toolbox";
import {
  generateSigner,
  percentAmount,
  createGenericFile,
  signerIdentity,
  sol,
} from "@metaplex-foundation/umi";
// import { createUmi } from "@metaplex-foundation/umi-uploader-irys";
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys";
import { base58 } from "@metaplex-foundation/umi/serializers";
import {
  transactionBuilder,
  publicKey,
  keypairIdentity,
  Keypair as KP,
} from "@metaplex-foundation/umi";

import {
  TransactionType,
  addComputeUnitInstructions,
  deriveConnection,
  deriveKeys,
  getExplorerTxLink,
  output,
} from "../../solana/infrastructure/helpers";
import * as spl from "@solana/spl-token";
import bs58 from "bs58";
import { Keypair, PublicKey } from "@solana/web3.js";
import metadata from "../../../metadata/metadata.json";
const TOKEN_PROGRAM = spl.TOKEN_2022_PROGRAM_ID;

export async function createToken() {
  try {
    const { connection, umi } = await deriveConnection(40168);
    umi.use(mplTokenMetadata()).use(irysUploader());
    const payer = Keypair.fromSecretKey(
      bs58.decode(process.env.SOLANA_PRIVATE_KEY!),
    );

    const keypair: KP = umi.eddsa.createKeypairFromSecretKey(payer.secretKey);
    umi.use(keypairIdentity(keypair));

    const mintSigner = generateSigner(umi);

    console.log(metadata);
    const metadataUri = await umi.uploader.uploadJson(metadata).catch((err) => {
      throw new Error(err);
    });

    const createFungibleIx = createFungible(umi, {
      mint: mintSigner,
      name: "Morpheus",
      symbol: "MOR",
      uri: metadataUri, // we use the `metedataUri` variable we created earlier that is storing our uri.
      sellerFeeBasisPoints: percentAmount(0),
      decimals: 9, // set the amount of decimals you want your token to have.
    });

    const createTokenIx = createTokenIfMissing(umi, {
      mint: mintSigner.publicKey,
      owner: umi.identity.publicKey,
      ataProgram: getSplAssociatedTokenProgramId(umi),
    });
    const mintTokensIx = mintTokensTo(umi, {
      mint: mintSigner.publicKey,
      token: findAssociatedTokenPda(umi, {
        mint: mintSigner.publicKey,
        owner: umi.identity.publicKey,
      }),
      amount: BigInt(1000),
    });

    const tx = await createFungibleIx.add(createTokenIx).sendAndConfirm(umi);

    // Save the token address to a JSON file.
    // const tokenAddress = mint.publicKey.;
    console.log("Token Address:", mintSigner.publicKey);

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

    data["token"] = mintSigner.publicKey;
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log("Token address saved to ntt-solana.json");
  } catch (error) {
    console.error("Error executing setup task:", error);
  }
}
