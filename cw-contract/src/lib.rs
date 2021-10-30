use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint,
    entrypoint::ProgramResult,
    msg,
    program_error::ProgramError,
    pubkey::Pubkey,
    log::sol_log

};
use sha2::{Sha256, Digest};


#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct PasswordStore {
    pub password: String,
}

entrypoint!(process_instruction);
pub fn process_instruction(
    program_id: &Pubkey, 
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    msg!("Escrow program entry");
    sol_log("Escrow program entry");

    // Increment and store the number of times the account has been greeted
    let greeting_account = PasswordStore::try_from_slice(&instruction_data)?;
    msg!("Input data is {}.", greeting_account.password);


    let mut hasher = Sha256::new();

    // write input message
    hasher.update(greeting_account.password);
    
    // read hash digest and consume hasher
    let result = hasher.finalize();
    msg!("Result: {:x}", result);

    panic!("Exiting");
    
    const LAMPORTS_PER_SOL: u64 = 1_000_000_000;
    
    let accounts_iter = &mut accounts.iter();

    let source_account = next_account_info(accounts_iter)?;
    let destination_account = next_account_info(accounts_iter)?;
    msg!("Account owner is {}", source_account.owner);
    // The account must be owned by the program in order to modify its data
    if source_account.owner != program_id {
        msg!("Escrow account does not have the correct program id");
        return Err(ProgramError::IncorrectProgramId);
    }

    // Withdraw five lamports from the source
    **source_account.try_borrow_mut_lamports()? -= LAMPORTS_PER_SOL;
    // Deposit five lamports into the destination
    **destination_account.try_borrow_mut_lamports()? += LAMPORTS_PER_SOL;


    Ok(())
}
