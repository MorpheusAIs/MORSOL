import { EndpointId } from "@layerzerolabs/lz-definitions";

export interface SendOFTSolanaArgs {
  amount: number;
  to: string;
  fromEid: EndpointId;
  toEid: EndpointId;
  programId: string;
  mint: string;
  escrow: string;
  tokenProgram: string;
  computeUnitPriceScaleFactor: number;
}
