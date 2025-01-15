use crate::errors::ErrorMOR;
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Burn as TokenBurn, Token};

pub fn burn_token(ctx: Context<BurnTokens>, amount: u64) -> Result<()> {
    match amount == 0 {
        true => return Err(ErrorMOR::InvalidBurnAmount.into()),
        false => (),
    }

    match ctx.accounts.from.amount < amount * 10u64.pow(9 as u32) {
        true => return Err(ErrorMOR::InvalidBurnAmount.into()),
        false => (),
    }

    msg!("Initiating token burn...");
    msg!("Mint Address: {}", &ctx.accounts.mint.key());
    msg!("Token Account Address: {}", &ctx.accounts.from.key());
    msg!("Burn Authority: {}", &ctx.accounts.authority.key());
    msg!("Amount to Burn: {}", amount);

    let cpi_accounts = TokenBurn {
        mint: ctx.accounts.mint.to_account_info(),
        from: ctx.accounts.from.to_account_info(),
        authority: ctx.accounts.authority.to_account_info(),
    };

    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

    token::burn(cpi_ctx, amount * 10u64.pow(9 as u32))?;

    msg!("Burn completed successfully.");
    msg!("Updated Mint Supply: {}", ctx.accounts.mint.supply);
    msg!(
        "Remaining Balance in Token Account: {}",
        ctx.accounts.from.amount
    );

    Ok(())
}
#[derive(Accounts)]
pub struct BurnTokens<'info> {
    #[account(mut)]
    pub mint: Account<'info, token::Mint>,
    #[account(mut)]
    pub from: Account<'info, token::TokenAccount>,
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}
