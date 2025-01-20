use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, MintTo, Token, TokenAccount};

use crate::{errors::TokenErrors, state::GlobalConfig};

pub fn mint_token(ctx: Context<MintToken>, amount: u64) -> Result<()> {
    require!(
        ctx.accounts.signer.key() == ctx.accounts.global_config.admin,
        TokenErrors::UnauthorizedSigner
    );

    let expected_authority = Some(ctx.accounts.transfer_manager.key()).into();
    require!(
        ctx.accounts.mint.mint_authority == expected_authority,
        TokenErrors::InvalidMintAuthority
    );

    let manager_bumps = ctx.accounts.global_config.transfer_manager_bumps.clone();
    let manager_seeds: &[&[&[u8]]] = &[&[b"transfer_manager", &[manager_bumps]]];

    let context = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        MintTo {
            mint: ctx.accounts.mint.to_account_info(),
            to: ctx.accounts.associated_token_account.to_account_info(),
            authority: ctx.accounts.transfer_manager.to_account_info(),
        },
        manager_seeds,
    );

    anchor_spl::token::mint_to(context, amount).map_err(|_| TokenErrors::MintFailed)?;

    Ok(())
}

#[derive(Accounts)]
pub struct MintToken<'info> {
    /// CHECK: This account is the transfer manager PDA signing the mint
    #[account(mut)]
    pub global_config: Account<'info, GlobalConfig>,

    #[account(mut)]
    pub mint: Account<'info, Mint>,

    /// CHECK: The transfer manager account
    #[account(mut)]
    pub transfer_manager: AccountInfo<'info>,

    #[account(mut)]
    pub associated_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,

    pub signer: Signer<'info>,
}
