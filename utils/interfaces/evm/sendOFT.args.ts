export interface SendOFTEVMArgs {
  /**
   * The endpoint ID for the Solana network.
   */
  dstEid: number;

  /**
   * Amount of the tokens (18 decimals).
   */
  amount: string;

  /**
   * Solana destination account.
   */
  to: string;

  /**
   * EVM OFT contract name.
   */
  contractName: string;
}
