use anchor_lang::prelude::*;

#[account]
#[derive(Debug)]
pub struct GlobalConfig {
    pub admin: Pubkey,
    pub transfer_manager_bumps: u8,
    pub mint_bumps: u8,
    pub transfer_manager: Pubkey,
    pub mint: Pubkey,
}
