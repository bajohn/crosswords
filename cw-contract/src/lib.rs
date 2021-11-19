use borsh::{BorshDeserialize, BorshSerialize};
use hex_literal::hex;
use sha2::{Digest, Sha256};
// use std::collections::HashMap;
// use rand::Rng;

use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint,
    entrypoint::ProgramResult,
    log::{sol_log, sol_log_compute_units},
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
    pub saltstore: Vec<String>,
}

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct GreetingAccount {
    /// number of greetings
    pub counter: u32,
}

entrypoint!(process_instruction);
pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    sol_log_compute_units();
    msg!("Escrow program entry");

    // Get salt account info from instructions
    // TODO: this should be hardcoded in-contract, not sent as an arg
    let accounts_iter = &mut accounts.iter();
    let account = next_account_info(accounts_iter)?;
    account.key.log();

    let salt_acc = SaltStore {
        saltstore: Vec::from([
            String::from("abcd"),
            String::from("defg"),
            String::from("hijklmnop"),
        ]),
    };
    let idx = truncate_vec(&account.data.borrow());
    msg!("Found goodies {}", idx);
    let mut salt_acc = SaltStore::try_from_slice(&account.data.borrow()[0..idx])?;
    //let mut salt_acc = SaltStore::try_from_slice(&account.data.borrow()[0..33])?;
    msg!("Stored data {}", salt_acc.saltstore[0]);

    //salt_acc.serialize(&mut &mut account.data.borrow_mut()[..])?;

    // As a test, based on a hash for "a password"
    msg!("Done");
    sol_log_compute_units();

    // let correct_hash = hex!("afd1368cbf1509870eecbbce3c3bc4614e5d10e9f03aa6590db688d4cffbe86b");

    // let mut hasher = Sha256::new();
    // let password_store = PasswordStore::try_from_slice(&instruction_data)?;

    // // write input message
    // hasher.update(password_store.password);
    // // read hash digest and consume hasher
    // let result = hasher.finalize();

    // if result[..] == correct_hash {
    //     msg!("Correct password! Paying reward");

    //     const LAMPORTS_PER_SOL: u64 = 1_000_000_000;
    //     let transfer_ammount = 2 * LAMPORTS_PER_SOL;
    // let source_account = next_account_info(accounts_iter)?;
    // let destination_account = next_account_info(accounts_iter)?;
    // msg!("Account owner is {}", source_account.owner);

    // if source_account.owner != program_id {
    //     msg!("Escrow account does not have the correct program id");
    //     return Err(ProgramError::IncorrectProgramId);
    // }

    // **source_account.try_borrow_mut_lamports()? -= transfer_ammount;
    // **destination_account.try_borrow_mut_lamports()? += transfer_ammount;
    // } else {
    //     msg!("incorrect password! Exiting.");
    // }

    Ok(())
}
// NEXT UP - copy latest from rust sandbox repo, implement
// chopper
fn truncate_vec(vecIn: &[u8]) -> usize {
    let mut i = vecIn.len();
    let mut truncIdx = 0;
    let mut ret: usize = 0;
    while i > 0 {
        i -= 1;
        match vecIn.get(i) {
            Some(num) => {
                if !(*num == 0) {
                    ret = i+1;
                    break;
                }
                // msg!("Found {}", num);
            }
            None => println!("Not found!"),
        }
    }
    ret
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
