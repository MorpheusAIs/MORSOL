import {
  CreateV1InstructionAccounts,
  CreateV1InstructionArgs,
  TokenStandard,
  createV1,
  mintV1,
} from "@metaplex-foundation/mpl-token-metadata";
import { AuthorityType, setAuthority } from "@metaplex-foundation/mpl-toolbox";
import {
  createNoopSigner,
  createSignerFromKeypair,
  percentAmount,
  publicKey,
  transactionBuilder,
} from "@metaplex-foundation/umi";
import {
  fromWeb3JsPublicKey,
  toWeb3JsPublicKey,
} from "@metaplex-foundation/umi-web3js-adapters";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import bs58 from "bs58";
import { task } from "hardhat/config";

import { types as devtoolsTypes } from "@layerzerolabs/devtools-evm-hardhat";
import { promptToContinue } from "@layerzerolabs/io-devtools";
import { EndpointId } from "@layerzerolabs/lz-definitions";
import {
  OFT_DECIMALS as DEFAULT_SHARED_DECIMALS,
  oft,
  types,
} from "@layerzerolabs/oft-v2-solana-sdk";

import { checkMultisigSigners, createMintAuthorityMultisig } from "./multisig";
import { assertAccountInitialized } from "./utils";

import {
  TransactionType,
  addComputeUnitInstructions,
  deriveConnection,
  deriveKeys,
  getExplorerTxLink,
  output,
} from "./index";
import { createOFT } from "../../utils/solana/createOFT";

const DEFAULT_LOCAL_DECIMALS = 9;

interface CreateOFTTaskArgs {
  /**
   * The initial supply to mint on solana.
   */
  amount: number;

  /**
   * The endpoint ID for the Solana network.
   */
  eid: EndpointId;

  /**
   * The number of decimal places to use for the token.
   */
  localDecimals: number;

  /**
   * OFT shared decimals.
   */
  sharedDecimals: number;

  /**
   * The optional token mint ID, for Mint-And-Burn-Adapter only.
   */
  mint?: string;

  /**
   * The name of the token.
   */
  name: string;

  /**
   * The program ID for the OFT program.
   */
  programId: string;

  /**
   * The seller fee basis points.
   */
  sellerFeeBasisPoints: number;

  /**
   * The symbol of the token.
   */
  symbol: string;

  /**
   * Whether the token metadata is mutable.
   */
  tokenMetadataIsMutable: boolean;

  /**
   * The CSV list of additional minters.
   */
  additionalMinters?: string[];

  /**
   * The token program ID, for Mint-And-Burn-Adapter only.
   */
  tokenProgram: string;

  /**
   * If you plan to have only the OFTStore and no additional minters.  This is not reversible, and will result in
   * losing the ability to mint new tokens for everything but the OFTStore.  You should really be intentional about
   * using this flag, as it is not reversible.
   */
  onlyOftStore: boolean;

  /**
   * The URI for the token metadata.
   */
  uri: string;

  computeUnitPriceScaleFactor: number;
}

// Define a Hardhat task for creating OFT on Solana
// * Create the SPL Multisig account for mint authority
// * Mint the new SPL Token
// * Initialize the OFT Store account
// * Set the mint authority to the multisig account. If not in only OFT Store mode, also set the freeze authority to the multisig account.
// Note:  Only supports SPL Token Standard.
task(
  "lz:oft:solana:create",
  "Mints new SPL Token and creates new OFT Store account",
)
  .addOptionalParam(
    "amount",
    "The initial supply to mint on solana",
    undefined,
    devtoolsTypes.int,
  )
  .addParam(
    "eid",
    "Solana mainnet or testnet",
    process.env.EID,
    devtoolsTypes.eid,
  )
  .addOptionalParam(
    "localDecimals",
    "Token local decimals (default=9)",
    DEFAULT_LOCAL_DECIMALS,
    devtoolsTypes.int,
  )
  .addOptionalParam(
    "sharedDecimals",
    "OFT shared decimals (default=6)",
    DEFAULT_SHARED_DECIMALS,
    devtoolsTypes.int,
  )
  .addParam("name", "Token Name", process.env.TOKEN_NAME, devtoolsTypes.string)
  .addParam(
    "mint",
    "The Token mint public key (used for MABA only)",
    "",
    devtoolsTypes.string,
  )
  .addParam(
    "programId",
    "The OFT Program id",
    process.env.MOROFT_ID,
    devtoolsTypes.string,
  )
  .addParam(
    "sellerFeeBasisPoints",
    "Seller fee basis points",
    0,
    devtoolsTypes.int,
  )
  .addParam(
    "symbol",
    "Token Symbol",
    process.env.TOKEN_SYMBOL,
    devtoolsTypes.string,
  )
  .addParam(
    "tokenMetadataIsMutable",
    "Token metadata is mutable",
    true,
    devtoolsTypes.boolean,
  )
  .addParam(
    "additionalMinters",
    "Comma-separated list of additional minters",
    undefined,
    devtoolsTypes.csv,
    true,
  )
  .addOptionalParam(
    "onlyOftStore",
    "If you plan to have only the OFTStore and no additional minters.  This is not reversible, and will result in losing the ability to mint new tokens by everything but the OFTStore.",
    false,
    devtoolsTypes.boolean,
  )
  .addParam(
    "tokenProgram",
    "The Token Program public key (used for MABA only)",
    TOKEN_PROGRAM_ID.toBase58(),
    devtoolsTypes.string,
  )
  .addParam(
    "uri",
    "URI for token metadata",
    process.env.TOKEN_URI,
    devtoolsTypes.string,
  )
  .addParam(
    "computeUnitPriceScaleFactor",
    "The compute unit price scale factor",
    4,
    devtoolsTypes.float,
    true,
  )
  .setAction(async (args: CreateOFTTaskArgs) => {
    // console.log(args.programId);
    await createOFT(args);
  });
