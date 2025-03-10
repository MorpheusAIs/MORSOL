import { EndpointId } from "@layerzerolabs/lz-definitions";

export interface SendOFTSolanaArgs {
  /**
   * Amount of the tokens (18 decimals).
   */
  amount: number;

  /**
   * Solana destination account.
   */
  to: string;

  /**
   * Source EVM chain.
   */
  fromEid: EndpointId;

  /**
   * Solana EID.
   */
  toEid: EndpointId;

  /**
   * Solana program ID.
   */
  programId: string;

  /**
   * Token mint account.
   */
  mint: string;

  /**
   * Generated through OFT secrow account.
   */
  escrow: string;

  /**
   * Solana Token Program ID.
   */
  tokenProgram: string;

  /**
   * Parameter related to the cost scaling of Compute Units in transactions.
   */
  computeUnitPriceScaleFactor: number;
}
