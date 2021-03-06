use borsh::{BorshDeserialize, BorshSerialize};
use bs58::encode;
// use hex_literal::hex;
// use sha2::{Digest, Sha256};
// use std::collections::HashMap;
// use rand::Rng;

use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint,
    entrypoint::ProgramResult,
    log::sol_log_compute_units,
    msg,
    pubkey::Pubkey,
};

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct PasswordStore {
    pub password: String,
}

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct SaltStore {
    pub saltstore: Vec<SaltStruct>,
}

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct SaltStruct {
    pub acc: String,
    pub salt: String,
}

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct GreetingAccount {
    /// number of greetings
    pub counter: u32,
}

entrypoint!(process_instruction);
pub fn process_instruction(
    _program_id: &Pubkey,
    accounts: &[AccountInfo],
    _instruction_data: &[u8],
) -> ProgramResult {
    sol_log_compute_units();
    msg!("Escrow program entry");

    // Get salt account info from instructions
    // TODO: this should be hardcoded in-contract, not sent as an arg
    let accounts_iter = &mut accounts.iter();
    let sender_account = next_account_info(accounts_iter)?;
    let salt_account = next_account_info(accounts_iter)?;
    msg!("Sender Account");
    sender_account.key.log(); // Log sender acc
    if !sender_account.is_signer {
        panic!("Sender must be signer");
    }
    msg!("Salt Account owned by program");
    salt_account.key.log();

    let salt_store_res = SaltStore::try_from_slice(&salt_account.data.borrow());
    let mut salt_store = match salt_store_res {
        Ok(T) => {
            msg!("Deserialized successfully");
            T
        }
        Err(E) => {
            msg!("Failed to deserialize, probably new address");
            SaltStore { saltstore: vec![] }
        }
    };

    let mut found = false;
    let sender_acc_str = encode(*sender_account.key).into_string();
    for i in &salt_store.saltstore {
        let x = &i.acc;
        if x == &sender_acc_str {
            msg!("Match!");
            found = true;
        }
    }
    if !found {
        msg!("Not yet found, adding to store!");
        salt_store.saltstore.push(SaltStruct {
            acc: sender_acc_str,
            salt: String::from("abc"),
        });
        salt_store.serialize(&mut &mut salt_account.data.borrow_mut()[..])?;
    } else {
        msg!("Already exists, exiting!");
    }
    msg!("Done");
    sol_log_compute_units();

    Ok(())
}

// Return last index of input
// vec that is non-zero.
// Used to chop off tail of "00" bytes on buffers.
// Sample usage:
// let idx = truncate_vec(&salt_account.data.borrow());
// msg!("Found goodies {}", idx);
fn truncate_vec(vec_in: &[u8]) -> usize {
    let mut i = vec_in.len();
    let mut ret: usize = 0;
    while i > 0 {
        i -= 1;
        // msg!("Iterate {}", i);
        match vec_in.get(i) {
            Some(num) => {
                if !(*num == 0) {
                    ret = i + 1;
                    break;
                }
            }
            None => panic!("Error truncating buffer; this should not happen."),
        }
    }
    ret
}

// TODO - random salt here?
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
