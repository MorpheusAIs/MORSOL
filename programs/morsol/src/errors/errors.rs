use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorMOR {
    #[msg("Unauthorized action")]
    Unauthorized,
    #[msg("Invalid mint amount")]
    InvalidMintAmount,
    #[msg("Invalid burn amount")]
    InvalidBurnAmount,
}
