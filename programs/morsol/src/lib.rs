use anchor_lang::prelude::*;

pub mod constants;
pub mod errors;
pub mod instructions;
pub mod state;

use instructions::*;
declare_id!("7CGU4crYR2Usi4intnru51BGNjkZHfkGbMuofy6HbtJD");

#[program]
pub mod morsol {
    use super::*;

    pub fn initialize_config(ctx: Context<InitializeGlobalConfig>) -> Result<()> {
        instructions::config::initialize_config(ctx)
    }

    pub fn create_token(ctx: Context<CreateToken>) -> Result<()> {
        instructions::create::create_token(ctx)
    }

    pub fn mint_token(ctx: Context<MintToken>, amount: u64) -> Result<()> {
        instructions::mint::mint_token(ctx, amount)
    }

    pub fn burn_token(ctx: Context<BurnTokens>, amount: u64) -> Result<()> {
        instructions::burn::burn_token(ctx, amount)
    }
}
