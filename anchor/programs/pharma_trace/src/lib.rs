use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("5DMXqq7v2gkNSyBQ9P6XMFgUFQNcLdJHdhFi9JEPfcpa");

const RESEARCHER_PUBKEY: Pubkey = pubkey!("ESQzmo4dRJ6g3ECjUUDVTarwaFfpqqMuzwCGiDBub6xt");

#[program]
pub mod pharma_trace {
    use super::*;

    pub fn sign_consent(ctx: Context<SignConsent>, agreement_hash: [u8; 32]) -> Result<()> {
        let record = &mut ctx.accounts.consent_record;
        record.patient = *ctx.accounts.patient.key;
        record.agreement_hash = agreement_hash;
        record.is_verified = false;
        record.bump = ctx.bumps.consent_record;
        msg!("Consent recorded for patient: {:?}", record.patient);
        Ok(())
    }

    pub fn reward_patient(ctx: Context<RewardPatient>, amount: u64) -> Result<()> {
        require_keys_eq!(
            ctx.accounts.researcher.key(), 
            RESEARCHER_PUBKEY, 
            PharmaError::UnauthorizedResearcher
        );
        let record = &mut ctx.accounts.consent_record;
        record.is_verified = true;

        let seeds = &[b"vault_authority".as_ref(), &[ctx.bumps.vault_authority]];
        let signer = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: ctx.accounts.vault_token_account.to_account_info(),
            to: ctx.accounts.patient_token_account.to_account_info(),
            authority: ctx.accounts.vault_authority.to_account_info(),
        };

        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        token::transfer(cpi_ctx, amount)?;
        Ok(())
    }
}

#[account]
pub struct ConsentRecord {
    pub patient: Pubkey,
    pub agreement_hash: [u8; 32],
    pub is_verified: bool,
    pub bump: u8,
}

#[derive(Accounts)]
pub struct SignConsent<'info> {
    #[account(
        init, 
        payer = patient, 
        space = 8 + 32 + 32 + 1 + 1,
        seeds = [b"consent", patient.key().as_ref()],
        bump
    )]
    pub consent_record: Account<'info, ConsentRecord>,
    #[account(mut)]
    pub patient: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RewardPatient<'info> {
    #[account(mut, seeds = [b"consent", patient_wallet.key().as_ref()], bump = consent_record.bump)]
    pub consent_record: Account<'info, ConsentRecord>,
    #[account(mut)]
    pub vault_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub patient_token_account: Account<'info, TokenAccount>,
    #[account(seeds = [b"vault_authority"], bump)]
    pub vault_authority: UncheckedAccount<'info>,
    pub patient_wallet: SystemAccount<'info>,
    #[account(mut)]
    pub researcher: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[error_code]
pub enum PharmaError {
    #[msg("Only the authorized researcher can verify and pay rewards.")]
    UnauthorizedResearcher,
}