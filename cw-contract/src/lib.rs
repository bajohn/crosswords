// use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint,
    entrypoint::ProgramResult,
    msg,
    program_error::ProgramError,
    pubkey::Pubkey,
};

// #[derive(BorshSerialize, BorshDeserialize, Debug)]
// pub struct GreetingAccount {
//     pub counter: u32,
// }

entrypoint!(process_instruction);
pub fn process_instruction(
    program_id: &Pubkey, 
    accounts: &[AccountInfo],
    _instruction_data: &[u8],
) -> ProgramResult {
    msg!("Escrow program entry");

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
