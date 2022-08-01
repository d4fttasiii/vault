use anchor_lang::prelude::*;

declare_id!("GWDtSYERr74SqwyirLDfUBS15Hnp6gwsp49qtTQkwJhs");

pub const PROFILE_PDA_SEED: &[u8] = b"vault-profile";
pub const PROFILE_DOCUMENT_PDA_SEED: &[u8] = b"vault-document";
pub const PROFILE_DOCUMENT_SHARE_PDA_SEED: &[u8] = b"vault-document-share";

#[program]
pub mod vault {
    use super::*;

    pub fn create_profile(ctx: Context<CreateProfile>) -> Result<()> {
        let profile_account = &mut ctx.accounts.profile_data;
        profile_account.profile = ctx.accounts.profile.key();
        profile_account.created = Clock::get()?.unix_timestamp;
        profile_account.document_count = 0;
        
        Ok(())
    }

    pub fn create_profile_document(ctx: Context<CreateProfileDocument>, name: String) -> Result<()> {
        let profile = &mut ctx.accounts.profile_data;
        if profile.profile.key() != ctx.accounts.profile.key() {
            return err!(ErrorCode::OnlyProfileOwnerCanAccess);
        }

        let document = &mut ctx.accounts.document;
        document.created = Clock::get()?.unix_timestamp;
        document.profile = ctx.accounts.profile.key();
        document.name = name;
        document.index = profile.document_count;

        profile.document_count += 1;
        profile.updated = Clock::get()?.unix_timestamp;
       
        Ok(())
    }

    pub fn create_profile_document_share(
        ctx: Context<CreateProfileDocumentShare>,
        _document_index: u64, 
        invitee: Pubkey,
        valid_until: i64) -> Result<()> {        

        if ctx.accounts.profile.key() != ctx.accounts.document.profile.key() {
            return err!(ErrorCode::OnlyProfileOwnerCanAccess);
        }

        let document_share = &mut ctx.accounts.document_share;
        document_share.created = Clock::get()?.unix_timestamp;
        document_share.updated = Clock::get()?.unix_timestamp;
        document_share.document_index = ctx.accounts.document.index;
        document_share.is_public = false;
        document_share.is_active = true;
        document_share.invitee = invitee.key();
        document_share.valid_until = valid_until;

        Ok(())
    }

    pub fn toggle_profile_document_share(
        ctx: Context<ToggleProfileDocumentShare>, 
        _document_index: u64, 
        _invitee: Pubkey,) -> Result<()> {        

        if ctx.accounts.profile.key() != ctx.accounts.document.profile.key() {
            return err!(ErrorCode::OnlyProfileOwnerCanAccess);
        }

        let document_share = &mut ctx.accounts.document_share;
        document_share.updated = Clock::get()?.unix_timestamp;
        document_share.is_active = !document_share.is_active;

        Ok(())
    }

}

#[derive(Accounts)]
pub struct CreateProfile<'info> {
    #[account(mut)]
    pub profile: Signer<'info>,
    #[account(
        init, 
        payer = profile,
        space = PROFILE_DATA_LEN,
        seeds = [
            PROFILE_PDA_SEED.as_ref(), 
            profile.key().as_ref()
        ], 
        bump,
    )]
    pub profile_data: Account<'info, ProfileData>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateProfileDocument<'info> {
    #[account(mut)]
    pub profile: Signer<'info>,
    #[account(
        init, 
        payer = profile,
        space = DOCUMENT_LEN,
        seeds = [
            PROFILE_DOCUMENT_PDA_SEED.as_ref(), 
            profile.key().as_ref(), 
            profile_data.document_count.to_string().as_bytes().as_ref()
        ], 
        bump,
    )]
    pub document: Account<'info, DocumentData>,
    #[account(
        mut,
        seeds = [PROFILE_PDA_SEED.as_ref(), profile.key().as_ref()], 
        bump
    )]
    pub profile_data: Account<'info, ProfileData>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(document_index: u64, invitee: Pubkey)]
pub struct CreateProfileDocumentShare<'info> {
    #[account(mut)]
    pub profile: Signer<'info>,
    #[account(
        init, 
        payer = profile,
        space = DOCUMENT_SHARE_LEN,
        seeds = [
            document.key().as_ref(),
            PROFILE_DOCUMENT_SHARE_PDA_SEED,
            invitee.key().as_ref()
        ], 
        bump,
    )]
    pub document_share: Account<'info, DocumentShareData>,
    #[account(
        mut,
        seeds = [
            PROFILE_DOCUMENT_PDA_SEED.as_ref(), 
            profile.key().as_ref(), 
            document_index.to_string().as_bytes().as_ref()
        ], 
        bump
    )]
    pub document: Account<'info, DocumentData>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(document_index: u64, invitee: Pubkey)]
pub struct ToggleProfileDocumentShare<'info> {
    #[account(mut)]
    pub profile: Signer<'info>,
    #[account(
        mut,
        seeds = [
            document.key().as_ref(),
            PROFILE_DOCUMENT_SHARE_PDA_SEED,
            invitee.key().as_ref()
        ], 
        bump,
    )]
    pub document_share: Account<'info, DocumentShareData>,
    #[account(
        mut,
        seeds = [
            PROFILE_DOCUMENT_PDA_SEED.as_ref(), 
            profile.key().as_ref(), 
            document_index.to_string().as_bytes().as_ref()
        ], 
        bump
    )]
    pub document: Account<'info, DocumentData>,
    pub system_program: Program<'info, System>,
}

pub const PROFILE_DATA_LEN: usize = 32 + 8 + 8 + 8 + 8;
#[account]
pub struct ProfileData {
    pub profile: Pubkey,
    pub document_count: u64,
    pub created: i64,
    pub updated: i64,
}

pub const DOCUMENT_LEN: usize = 32 + (4 + 64) + 8 + 8 + 8;
#[account]
pub struct DocumentData {
    pub profile: Pubkey,
    pub name: String,
    pub index: u64,
    pub created: i64,
}

pub const DOCUMENT_SHARE_LEN: usize = 32 + 8 + 8 + 8 + 8 + 1 + 1 + 8;
#[account]
pub struct DocumentShareData {
    pub invitee: Pubkey,
    pub document_index: u64,
    pub created: i64,
    pub updated: i64,
    pub valid_until: i64,
    pub is_public: bool,
    pub is_active: bool,
}

#[error_code]
pub enum ErrorCode {
    #[msg("OnlyProfileOwnerCanAccess")]
    OnlyProfileOwnerCanAccess,
}