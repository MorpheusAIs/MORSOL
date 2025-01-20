use anchor_lang::prelude::*;

#[error_code]
pub enum TokenErrors {
    #[msg("Invalid mint amount")]
    InvalidMintAmount,
    #[msg("Invalid burn amount")]
    InvalidBurnAmount,
    #[msg("The admin must be a signer.")]
    AdminMustBeSigner,
    #[msg("The mint authority does not match the transfer manager.")]
    InvalidMintAuthority,
    #[msg("Failed to create the metadata account.")]
    MetadataCreationFailed,
    #[msg("The signer is not authorized to mint tokens.")]
    UnauthorizedSigner,
    #[msg("Failed to mint tokens.")]
    MintFailed,
}
