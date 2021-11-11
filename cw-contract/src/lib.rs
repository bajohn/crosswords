use borsh::{BorshDeserialize, BorshSerialize};
use sha2::{Digest, Sha256};
use hex_literal::hex;
use std::collections::HashMap;
// use rand::Rng;



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

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct SaltStore {
    pub saltstore: HashMap<String, String>,
}

entrypoint!(process_instruction);
pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    msg!("Escrow program entry");
    sol_log("Escrow program entry");


    // Get salt account info from instructions
    // TODO: this should be hardcoded in-contract, not sent as an arg
    let accounts_iter = &mut accounts.iter();
    let salt_acc_info = next_account_info(accounts_iter)?;
    let salt_data = salt_acc_info.try_borrow_mut_data()?;
    let mut salt_hashmap = SaltStore::try_from_slice(&salt_data)?;

    let contains_key = salt_hashmap.saltstore.contains_key(&String::from("acc_key"));
    msg!("Contains key {}", contains_key);
    salt_hashmap.saltstore.insert(String::from("acc_key"), String::from("salt"));
    let contains_key = salt_hashmap.saltstore.contains_key(&String::from("acc_key"));
    msg!("Contains key {}", contains_key);





    // As a test, based on a hash for "a password"
    msg!("Done");
    panic!();
    let correct_hash = hex!("afd1368cbf1509870eecbbce3c3bc4614e5d10e9f03aa6590db688d4cffbe86b");

    let mut hasher = Sha256::new();
    let password_store = PasswordStore::try_from_slice(&instruction_data)?;

    // write input message
    hasher.update(password_store.password);
    // read hash digest and consume hasher
    let result = hasher.finalize();

    if result[..] == correct_hash {
        msg!("Correct password! Paying reward");

        const LAMPORTS_PER_SOL: u64 = 1_000_000_000;
        let transfer_ammount = 2 * LAMPORTS_PER_SOL; 
    
        // let source_account = next_account_info(accounts_iter)?;
        // let destination_account = next_account_info(accounts_iter)?;
        // msg!("Account owner is {}", source_account.owner);

        // if source_account.owner != program_id {
        //     msg!("Escrow account does not have the correct program id");
        //     return Err(ProgramError::IncorrectProgramId);
        // }
    

        // **source_account.try_borrow_mut_lamports()? -= transfer_ammount;
        // **destination_account.try_borrow_mut_lamports()? += transfer_ammount;
    
    } else {
        msg!("incorrect password! Exiting.");
    }



    Ok(())
}

// fn get_salt(len: u8) -> String {
//     let mut rng = rand::thread_rng();
//     let mut ret = String::from("");
//     for _ in 0..len {
//         let i: u8 = rng.gen_range(97..123);
//         let utf8_vec = vec![i];
//         let s = std::str::from_utf8(&utf8_vec).unwrap();
//         ret.push_str(s);
//     }
//     ret
// }
