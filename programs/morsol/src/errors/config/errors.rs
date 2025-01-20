use anchor_lang::prelude::*;

#[error_code]
pub enum GlobalConfigError {
    #[msg("The admin must be a signer.")]
    AdminMustBeSigner,
    #[msg("Invalid owner for the transfer manager account.")]
    InvalidTransferManagerOwner,
}
