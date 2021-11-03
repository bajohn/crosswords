use borsh::{BorshDeserialize, BorshSerialize};
use sha2::{Digest, Sha256};
use hex_literal::hex;

use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint,
    entrypoint::ProgramResult,
    log::sol_log,
    msg,
    program_error::ProgramError,
    pubkey::Pubkey,
};

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
    let password_store = PasswordStore::try_from_slice(&instruction_data)?;

    // As a test, based on a hash for "a password"
    let correct_hash = hex!("afd1368cbf1509870eecbbce3c3bc4614e5d10e9f03aa6590db688d4cffbe86b");
    msg!("Input data is {}.", password_store.password);

    let mut hasher = Sha256::new();

    // write input message
    hasher.update(password_store.password);
    // read hash digest and consume hasher
    let result = hasher.finalize();

    if result[..] == correct_hash {
        msg!("Correct password! Paying reward");
        
        const LAMPORTS_PER_SOL: u64 = 1_000_000_000;
        let transfer_ammount = 2 * LAMPORTS_PER_SOL; 
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
        **source_account.try_borrow_mut_lamports()? -= transfer_ammount;
        // Deposit five lamports into the destination
        **destination_account.try_borrow_mut_lamports()? += transfer_ammount;
    
    } else {
        msg!("incorrect password! Exiting.");
    }



    Ok(())
}
