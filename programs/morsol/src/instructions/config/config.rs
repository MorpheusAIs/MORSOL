use crate::errors::GlobalConfigError;
use crate::state::GlobalConfig;

use ::{
    anchor_lang::prelude::*,
    anchor_spl::token::{Mint, Token},
};

pub fn initialize_config(ctx: Context<InitializeGlobalConfig>) -> Result<()> {
    require!(
        ctx.accounts.admin.is_signer,
        GlobalConfigError::AdminMustBeSigner
    );

    let global_config = &mut ctx.accounts.global_config;

    global_config.transfer_manager_bumps = ctx.bumps.transfer_manager;
    global_config.mint_bumps = ctx.bumps.mint;
    global_config.transfer_manager = ctx.accounts.transfer_manager.key();
    global_config.mint = ctx.accounts.mint.key();
    global_config.admin = ctx.accounts.admin.key();

    Ok(())
}

#[derive(Accounts)]
pub struct InitializeGlobalConfig<'info> {
    #[account(
        init,
        payer = admin,
        seeds = [b"config"],
        space = 8 + 32 + 1 + 1 + 32 + 32,
        bump
    )]
    pub global_config: Account<'info, GlobalConfig>,

    #[account(mut)]
    pub admin: Signer<'info>,

    pub rent: Sysvar<'info, Rent>,

    /// CHECK:unchecked
    #[account(
        init,
        seeds = [b"transfer_manager"],
        bump,
        payer = authority,
        space = 0,
    )]
    pub transfer_manager: AccountInfo<'info>,

    pub system_program: Program<'info, System>,

    pub token_program: Program<'info, Token>,

    #[account(
        init,
        seeds = [b"mint"],
        bump,
        payer = authority,
        mint::authority = transfer_manager,
        mint::freeze_authority = transfer_manager,
        mint::decimals = 9,
    )]
    pub mint: Box<Account<'info, Mint>>,

    #[account(mut)]
    pub authority: Signer<'info>,
}
