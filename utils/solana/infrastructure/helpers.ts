import assert from "assert";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";

import {
  fetchAddressLookupTable,
  mplToolbox,
  setComputeUnitLimit,
  setComputeUnitPrice,
} from "@metaplex-foundation/mpl-toolbox";
import {
  AddressLookupTableInput,
  EddsaInterface,
  Instruction,
  KeypairSigner,
  PublicKey,
  TransactionBuilder,
  Umi,
  createSignerFromKeypair,
  publicKey,
  signerIdentity,
  transactionBuilder,
} from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { createWeb3JsEddsa } from "@metaplex-foundation/umi-eddsa-web3js";
import {
  toWeb3JsInstruction,
  toWeb3JsPublicKey,
} from "@metaplex-foundation/umi-web3js-adapters";
import {
  AddressLookupTableAccount,
  Connection,
  PublicKey as PK,
} from "@solana/web3.js";
import { getSimulationComputeUnits } from "@solana-developers/helpers";
import bs58 from "bs58";
import { backOff } from "exponential-backoff";

import { formatEid } from "@layerzerolabs/devtools";
import { promptToContinue } from "@layerzerolabs/io-devtools";
import { EndpointId, endpointIdToNetwork } from "@layerzerolabs/lz-definitions";
import { OftPDA } from "@layerzerolabs/oft-v2-solana-sdk";

import { OmniAddress } from "@layerzerolabs/devtools";

import { UlnProgram } from "@layerzerolabs/lz-solana-sdk-v2";
import {
  IEndpointV2,
  Timeout,
  Uln302ConfigType,
  Uln302ExecutorConfig,
  Uln302UlnConfig,
} from "@layerzerolabs/protocol-devtools";

import { Keypair } from "@solana/web3.js";

import {
  OmniPoint,
  OmniSigner,
  OmniTransactionReceipt,
  OmniTransactionResponse,
  firstFactory,
} from "@layerzerolabs/devtools";
import { createConnectedContractFactory } from "@layerzerolabs/devtools-evm-hardhat";
import {
  OmniSignerSolana,
  OmniSignerSolanaSquads,
  createConnectionFactory,
  createRpcUrlFactory,
} from "@layerzerolabs/devtools-solana";
import {
  ChainType,
  endpointIdToChainType,
} from "@layerzerolabs/lz-definitions";
import { IOApp } from "@layerzerolabs/ua-devtools";
import { createOAppFactory } from "@layerzerolabs/ua-devtools-evm";
import { createOFTFactory } from "@layerzerolabs/ua-devtools-solana";

export const createSolanaConnectionFactory = () =>
  createConnectionFactory(
    createRpcUrlFactory({
      [EndpointId.SOLANA_V2_MAINNET]: process.env.RPC_URL_SOLANA,
      [EndpointId.SOLANA_V2_TESTNET]: process.env.RPC_URL_SOLANA_TESTNET,
    }),
  );

export const createSdkFactory = (
  userAccount: PK,
  programId: PK,
  connectionFactory = createSolanaConnectionFactory(),
) => {
  // To create a EVM/Solana SDK factory we need to merge the EVM and the Solana factories into one
  //
  // We do this by using the firstFactory helper function that is provided by the devtools package.
  // This function will try to execute the factories one by one and return the first one that succeeds.
  const evmSdkfactory = createOAppFactory(createConnectedContractFactory());
  const solanaSdkFactory = createOFTFactory(
    // The first parameter to createOFTFactory is a user account factory
    //
    // This is a function that receives an OmniPoint ({ eid, address } object)
    // and returns a user account to be used with that SDK.
    //
    // For our purposes this will always be the user account coming from the secret key passed in
    () => userAccount,
    // The second parameter is a program ID factory
    //
    // This is a function that receives an OmniPoint ({ eid, address } object)
    // and returns a program ID to be used with that SDK.
    //
    // Since we only have one OFT deployed, this will always be the program ID passed as a CLI parameter.
    //
    // In situations where we might have multiple configs with OFTs using multiple program IDs,
    // this function needs to decide which one to use.
    () => programId,
    // Last but not least the SDK will require a connection
    connectionFactory,
  );

  // We now "merge" the two SDK factories into one.
  //
  // We do this by using the firstFactory helper function that is provided by the devtools package.
  // This function will try to execute the factories one by one and return the first one that succeeds.
  return firstFactory<[OmniPoint], IOApp>(evmSdkfactory, solanaSdkFactory);
};

export const createSolanaSignerFactory = (
  wallet: Keypair,
  connectionFactory = createSolanaConnectionFactory(),
  multisigKey?: PK,
) => {
  return async (
    eid: EndpointId,
  ): Promise<OmniSigner<OmniTransactionResponse<OmniTransactionReceipt>>> => {
    assert(
      endpointIdToChainType(eid) === ChainType.SOLANA,
      `Solana signer factory can only create signers for Solana networks. Received ${formatEid(eid)}`,
    );

    return multisigKey
      ? new OmniSignerSolanaSquads(
          eid,
          await connectionFactory(eid),
          multisigKey,
          wallet,
        )
      : new OmniSignerSolana(eid, await connectionFactory(eid), wallet);
  };
};

import getFee from "./getFee";

/**
 * Assert that the account is initialized on the Solana blockchain.  Due to eventual consistency, there is a race
 * between account creation and initialization.  This function will retry 10 times with backoff to ensure the account is
 * initialized.
 * @param connection {Connection}
 * @param publicKey {PublicKey}
 */
export const assertAccountInitialized = async (
  connection: Connection,
  publicKey: PK,
) => {
  return backOff(
    async () => {
      const accountInfo = await connection.getAccountInfo(publicKey);
      if (!accountInfo) {
        throw new Error("Multisig account not found");
      }
      return accountInfo;
    },
    {
      maxDelay: 30000,
      numOfAttempts: 10,
      startingDelay: 5000,
    },
  );
};

const LOOKUP_TABLE_ADDRESS: Partial<Record<EndpointId, PublicKey>> = {
  [EndpointId.SOLANA_V2_MAINNET]: publicKey(
    "AokBxha6VMLLgf97B5VYHEtqztamWmYERBmmFvjuTzJB",
  ),
  [EndpointId.SOLANA_V2_TESTNET]: publicKey(
    "9thqPdbR27A1yLWw2spwJLySemiGMXxPnEvfmXVk4KuK",
  ),
};

const getFromEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`${key} is not defined in the environment variables.`);
  }
  return value;
};

/**
 * Extracts the SOLANA_PRIVATE_KEY from the environment.  This is purposely not exported for encapsulation purposes.
 */
const getSolanaPrivateKeyFromEnv = () => getFromEnv("SOLANA_PRIVATE_KEY");

/**
 * Derive common connection and UMI objects for a given endpoint ID.
 * @param eid {EndpointId}
 */
export const deriveConnection = async (eid: EndpointId) => {
  const privateKey = getSolanaPrivateKeyFromEnv();
  const connectionFactory = createSolanaConnectionFactory();
  const connection = await connectionFactory(eid);
  const umi = createUmi(connection.rpcEndpoint).use(mplToolbox());
  const umiWalletKeyPair = umi.eddsa.createKeypairFromSecretKey(
    bs58.decode(privateKey),
  );
  const umiWalletSigner = createSignerFromKeypair(umi, umiWalletKeyPair);
  umi.use(signerIdentity(umiWalletSigner));
  return {
    connection,
    umi,
    umiWalletKeyPair,
    umiWalletSigner,
  };
};

/**
 * Derive the keys needed for the OFT program.
 * @param programIdStr {string}
 */
export const deriveKeys = (programIdStr: string) => {
  const programId = publicKey(programIdStr);
  const eddsa: EddsaInterface = createWeb3JsEddsa();
  const oftDeriver = new OftPDA(programId);
  const lockBox = eddsa.generateKeypair();
  const escrowPK = lockBox.publicKey;
  const [oftStorePda] = oftDeriver.oftStore(escrowPK);
  return {
    programId,
    lockBox,
    escrowPK,
    oftStorePda,
    eddsa,
  };
};

/**
 * Outputs the OFT accounts to a JSON file.
 * @param eid {EndpointId}
 * @param programId {string}
 * @param mint {string}
 * @param mintAuthority {string}
 * @param escrow {string}
 * @param oftStore {string}
 */
export const output = (
  eid: EndpointId,
  programId: string,
  mint: string,
  mintAuthority: string,
  escrow: string,
  oftStore: string,
) => {
  const outputDir = `./deployments/${endpointIdToNetwork(eid)}`;
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }
  writeFileSync(
    `${outputDir}/OFT.json`,
    JSON.stringify(
      {
        programId,
        mint,
        mintAuthority,
        escrow,
        oftStore,
      },
      null,
      4,
    ),
  );
  console.log(`Accounts have been saved to ${outputDir}/OFT.json`);
};

export const getLayerZeroScanLink = (hash: string, isTestnet = false) =>
  isTestnet
    ? `https://testnet.layerzeroscan.com/tx/${hash}`
    : `https://layerzeroscan.com/tx/${hash}`;

export const getExplorerTxLink = (hash: string, isTestnet = false) =>
  `https://solscan.io/tx/${hash}?cluster=${isTestnet ? "devnet" : "mainnet-beta"}`;

export const getAddressLookupTable = async (
  connection: Connection,
  umi: Umi,
  fromEid: EndpointId,
) => {
  const lookupTableAddress = LOOKUP_TABLE_ADDRESS[fromEid];
  assert(
    lookupTableAddress != null,
    `No lookup table found for ${formatEid(fromEid)}`,
  );
  const addressLookupTableInput: AddressLookupTableInput =
    await fetchAddressLookupTable(umi, lookupTableAddress);
  if (!addressLookupTableInput) {
    throw new Error(`No address lookup table found for ${lookupTableAddress}`);
  }
  const { value: lookupTableAccount } = await connection.getAddressLookupTable(
    toWeb3JsPublicKey(lookupTableAddress),
  );
  if (!lookupTableAccount) {
    throw new Error(
      `No address lookup table account found for ${lookupTableAddress}`,
    );
  }
  return {
    lookupTableAddress,
    addressLookupTableInput,
    lookupTableAccount,
  };
};

export enum TransactionType {
  CreateToken = "CreateToken",
  CreateMultisig = "CreateMultisig",
  InitOft = "InitOft",
  SetAuthority = "SetAuthority",
  InitConfig = "InitConfig",
  SendOFT = "SendOFT",
}

const TransactionCuEstimates: Record<TransactionType, number> = {
  // for the sample values, they are: devnet, mainnet
  [TransactionType.CreateToken]: 125_000, // actual sample: (59073, 123539), 55785 (more volatile as it has CPI to Metaplex)
  [TransactionType.CreateMultisig]: 5_000, // actual sample: 3,230
  [TransactionType.InitOft]: 70_000, // actual sample: 59207, 65198 (note: this is the only transaction that createOFTAdapter does)
  [TransactionType.SetAuthority]: 8_000, // actual sample: 6424, 6472
  [TransactionType.InitConfig]: 42_000, // actual sample: 33157, 40657
  [TransactionType.SendOFT]: 230_000, // actual sample: 217,784
};

export const getComputeUnitPriceAndLimit = async (
  connection: Connection,
  ixs: Instruction[],
  wallet: KeypairSigner,
  lookupTableAccount: AddressLookupTableAccount,
  transactionType: TransactionType,
) => {
  const { averageFeeExcludingZeros } = await getFee(connection);
  const priorityFee = Math.round(averageFeeExcludingZeros);
  const computeUnitPrice = BigInt(priorityFee);

  let computeUnits;

  try {
    computeUnits = await backOff(
      () =>
        getSimulationComputeUnits(
          connection,
          ixs.map((ix) => toWeb3JsInstruction(ix)),
          toWeb3JsPublicKey(wallet.publicKey),
          [lookupTableAccount],
        ),
      {
        maxDelay: 10000,
        numOfAttempts: 3,
      },
    );
  } catch (e) {
    console.error(`Error retrieving simulations compute units from RPC:`, e);
    const continueByUsingHardcodedEstimate = await promptToContinue(
      "Failed to call simulateTransaction on the RPC. This can happen when the network is congested. Would you like to use hardcoded estimates (TransactionCuEstimates) ? This may result in slightly overpaying for the transaction.",
    );
    if (!continueByUsingHardcodedEstimate) {
      throw new Error(
        "Failed to call simulateTransaction on the RPC and user chose to not continue with hardcoded estimate.",
      );
    }
    console.log(
      `Falling back to hardcoded estimate for ${transactionType}: ${TransactionCuEstimates[transactionType]} CUs`,
    );
    computeUnits = TransactionCuEstimates[transactionType];
  }

  if (!computeUnits) {
    throw new Error("Unable to compute units");
  }

  return {
    computeUnitPrice,
    computeUnits,
  };
};

export const addComputeUnitInstructions = async (
  connection: Connection,
  umi: Umi,
  eid: EndpointId,
  txBuilder: TransactionBuilder,
  umiWalletSigner: KeypairSigner,
  computeUnitPriceScaleFactor: number,
  transactionType: TransactionType,
) => {
  const computeUnitLimitScaleFactor = 1.1; // hardcoded to 1.1 as the estimations are not perfect and can fall slightly short of the actual CU usage on-chain
  const { addressLookupTableInput, lookupTableAccount } =
    await getAddressLookupTable(connection, umi, eid);
  const { computeUnitPrice, computeUnits } = await getComputeUnitPriceAndLimit(
    connection,
    txBuilder.getInstructions(),
    umiWalletSigner,
    lookupTableAccount,
    transactionType,
  );
  // Since transaction builders are immutable, we must be careful to always assign the result of the add and prepend
  // methods to a new variable.
  const newTxBuilder = transactionBuilder()
    .add(
      setComputeUnitPrice(umi, {
        microLamports:
          computeUnitPrice * BigInt(Math.floor(computeUnitPriceScaleFactor)),
      }),
    )
    .add(
      setComputeUnitLimit(umi, {
        units: computeUnits * computeUnitLimitScaleFactor,
      }),
    )
    .setAddressLookupTables([addressLookupTableInput])
    .add(txBuilder);
  return newTxBuilder;
};

/**
 * Get the receive config for a Solana OApp
 * @param endpointV2Sdk {IEndpointV2} SDK for the endpoint
 * @param remoteEid {EndpointId} remote eid
 * @param address {OmniAddress} address of the OApp
 */
export async function getSolanaReceiveConfig(
  endpointV2Sdk: IEndpointV2,
  remoteEid: EndpointId,
  address: OmniAddress,
): Promise<[OmniAddress, Uln302UlnConfig, Timeout] | undefined> {
  const [receiveLibrary] = await endpointV2Sdk.getReceiveLibrary(
    address,
    remoteEid,
  );
  return [
    receiveLibrary ?? UlnProgram.PROGRAM_ADDRESS,
    await endpointV2Sdk.getAppUlnConfig(
      address,
      UlnProgram.PROGRAM_ID.toBase58(),
      remoteEid,
      Uln302ConfigType.Receive,
    ),
    {
      lib: UlnProgram.PROGRAM_ID.toBase58(),
      expiry: 0n, // unsupported for Solana
    },
  ];
}

/**
 * Get the send config for a Solana OApp.
 * @param endpointV2Sdk {IEndpointV2} SDK for the endpoint
 * @param eid {EndpointId} remote eid
 * @param address {OmniAddress} address of the OApp
 */
export async function getSolanaSendConfig(
  endpointV2Sdk: IEndpointV2,
  eid: EndpointId,
  address: OmniAddress,
): Promise<[OmniAddress, Uln302UlnConfig, Uln302ExecutorConfig] | undefined> {
  const sendLibrary =
    (await endpointV2Sdk.getSendLibrary(address, eid)) ??
    UlnProgram.PROGRAM_ADDRESS;
  return [
    sendLibrary,
    await endpointV2Sdk.getAppUlnConfig(
      address,
      UlnProgram.PROGRAM_ID.toBase58(),
      eid,
      Uln302ConfigType.Send,
    ),
    await endpointV2Sdk.getAppExecutorConfig(address, sendLibrary, eid),
  ];
}
