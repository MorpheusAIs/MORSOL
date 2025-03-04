import * as multisig from "@sqds/multisig";
import {
  Keypair,
  PublicKey,
  LAMPORTS_PER_SOL,
  Connection,
} from "@solana/web3.js";
import { EndpointId } from "@layerzerolabs/lz-definitions";
import * as anchor from "@coral-xyz/anchor";
import { deriveConnection, getExplorerTxLink } from "../infrastructure/helpers";
import bs58 from "bs58";

export async function createSquadsMultisig(
  connection: Connection,
  eid: EndpointId,
  umiWalletSigner: Keypair,
  signers: PublicKey[],
  threshold: number,
  mintAuthorityEnabled: boolean = true,
): Promise<PublicKey> {
  const createKey = Keypair.generate();
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

  console.log("Program Config PDA:", programConfigPda.toBase58());

  const members = signers.map((key) => ({
    key,
    permissions: multisig.types.Permissions.all(),
  }));
  console.log(signers);

  // const members = [];

  members.push({
    key: umiWalletSigner.publicKey,
    permissions: multisig.types.Permissions.all(),
  });

  const signature = await multisig.rpc.multisigCreateV2({
    connection,
    createKey,
    creator: umiWalletSigner,
    multisigPda,
    configAuthority: mintAuthorityEnabled ? umiWalletSigner.publicKey : null,
    timeLock: 0,
    members,
    threshold,
    rentCollector: null,
    treasury: configTreasury,
    sendOptions: { skipPreflight: true },
  });

  await connection.confirmTransaction(signature);
  console.log(`Squads Multisig created: ${signature}`);

  const [vaultPda] = multisig.getVaultPda({ multisigPda, index: 0 });
  console.log(vaultPda);

  return new PublicKey(multisigPda);
}

export async function checkSquadsMultisigSigners(
  connection: Connection,
  multisigAddress: PublicKey,
  expectedSigners: PublicKey[],
) {
  const multisigAccount = await multisig.accounts.Multisig.fromAccountAddress(
    connection,
    multisigAddress,
  );
  const currentSigners = multisigAccount.members.map((member) => member.key);

  for (const signer of expectedSigners) {
    if (!currentSigners.find((s) => s.equals(signer))) {
      throw new Error(
        `Signer ${signer.toBase58()} not found in multisig account`,
      );
    }
  }
  return currentSigners;
}
