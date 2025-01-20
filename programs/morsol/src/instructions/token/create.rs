use crate::constants::{TOKEN_NAME, TOKEN_SYMBOL, TOKEN_URI};
use crate::errors::TokenErrors;
use crate::state::GlobalConfig;
use {
    anchor_lang::prelude::*,
    anchor_spl::{
        metadata::{
            create_metadata_accounts_v3, mpl_token_metadata::types::DataV2,
            CreateMetadataAccountsV3, Metadata,
        },
        token::{Mint, Token},
    },
};

pub fn create_token(ctx: Context<CreateToken>) -> Result<()> {
    let global_config = &mut ctx.accounts.global_config;

    require!(ctx.accounts.admin.is_signer, TokenErrors::AdminMustBeSigner);

    let expected_authority = Some(ctx.accounts.transfer_manager.key()).into();

    require!(
        ctx.accounts.mint.mint_authority == expected_authority,
        TokenErrors::InvalidMintAuthority
    );

    msg!("Creating metadata account");

    let signer_seeds: &[&[&[u8]]] =
        &[&[b"transfer_manager", &[global_config.transfer_manager_bumps]]];

    create_metadata_accounts_v3(
        CpiContext::new(
            ctx.accounts.token_metadata_program.to_account_info(),
            CreateMetadataAccountsV3 {
                metadata: ctx.accounts.metadata_account.to_account_info(),
                mint: ctx.accounts.mint.to_account_info(),
                mint_authority: ctx.accounts.transfer_manager.to_account_info(),
                update_authority: ctx.accounts.transfer_manager.to_account_info(),
                payer: ctx.accounts.admin.to_account_info(),
                system_program: ctx.accounts.system_program.to_account_info(),
                rent: ctx.accounts.rent.to_account_info(),
            },
        )
        .with_signer(signer_seeds),
        DataV2 {
            name: TOKEN_NAME.to_string(),
            symbol: TOKEN_SYMBOL.to_string(),
            uri: TOKEN_URI.to_string(),
            seller_fee_basis_points: 0,
            creators: None,
            collection: None,
            uses: None,
        },
        false,
        true,
        None,
    )
    .map_err(|_| TokenErrors::MetadataCreationFailed)?;
    msg!("Token created successfully.");

    Ok(())
}

#[derive(Accounts)]
pub struct CreateToken<'info> {
    #[account(mut, has_one = admin)]
    pub global_config: Account<'info, GlobalConfig>,

    /// CHECK: Validation performed in handler
    #[account(mut)]
    pub transfer_manager: AccountInfo<'info>,

    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(mut)]
    pub mint: Account<'info, Mint>,

    /// CHECK: Validate address by deriving PDA
    #[account(
        mut,
        seeds = [b"metadata", token_metadata_program.key().as_ref(), mint.key().as_ref()],
        bump,
        seeds::program = token_metadata_program.key(),
    )]
    pub metadata_account: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
    pub token_metadata_program: Program<'info, Metadata>,

    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}
