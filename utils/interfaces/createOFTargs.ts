import { EndpointId } from '@layerzerolabs/lz-definitions'

export interface CreateOFTTaskArgs {
    /**
     * The initial supply to mint on solana.
     */
    amount: number

    /**
     * The endpoint ID for the Solana network.
     */
    eid: EndpointId

    /**
     * The number of decimal places to use for the token.
     */
    localDecimals: number

    /**
     * OFT shared decimals.
     */
    sharedDecimals: number

    /**
     * The optional token mint ID, for Mint-And-Burn-Adapter only.
     */
    mint?: string

    /**
     * The name of the token.
     */
    name: string

    /**
     * The program ID for the OFT program.
     */
    programId: string

    /**
     * The seller fee basis points.
     */
    sellerFeeBasisPoints: number

    /**
     * The symbol of the token.
     */
    symbol: string

    /**
     * Whether the token metadata is mutable.
     */
    tokenMetadataIsMutable: boolean

    /**
     * The CSV list of additional minters.
     */
    additionalMinters?: string[]

    /**
     * The token program ID, for Mint-And-Burn-Adapter only.
     */
    tokenProgram: string

    /**
     * If you plan to have only the OFTStore and no additional minters.  This is not reversible, and will result in
     * losing the ability to mint new tokens for everything but the OFTStore.  You should really be intentional about
     * using this flag, as it is not reversible.
     */
    onlyOftStore: boolean

    /**
     * The URI for the token metadata.
     */
    uri: string

    computeUnitPriceScaleFactor: number
}
