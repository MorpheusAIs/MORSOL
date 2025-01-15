use anchor_lang::prelude::*;

pub mod errors;
pub mod instructions;

use instructions::*;
declare_id!("7CGU4crYR2Usi4intnru51BGNjkZHfkGbMuofy6HbtJD");

#[program]
pub mod morsol {
    use super::*;
    pub fn create_token(
        ctx: Context<CreateToken>,
        token_name: String,
        token_symbol: String,
        token_uri: String,
    ) -> Result<()> {
        instructions::create::create_token(ctx, token_name, token_symbol, token_uri)
    }
    pub fn mint_token(ctx: Context<MintToken>, amount: u64) -> Result<()> {
        instructions::mint::mint_token(ctx, amount)
    }

    pub fn burn_token(ctx: Context<BurnTokens>, amount: u64) -> Result<()> {
        instructions::burn::burn_token(ctx, amount)
    }
}
