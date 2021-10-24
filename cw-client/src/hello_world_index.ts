import os from 'os';
import fs from 'mz/fs';

import {
    Keypair,
    Connection,
    PublicKey,
    LAMPORTS_PER_SOL,
    SystemProgram,
    TransactionInstruction,
    Transaction,
    sendAndConfirmTransaction,
} from '@solana/web3.js';
import * as borsh from 'borsh';




const main = async () => {
    const programPath = '../dist/program/cwcontract-keypair.json';
    const userPath = 'userkeypair.json';
    // await createUserKey(userPath); // create and store private key for the user

    const payerKeyPair = await getPayer(userPath);
    const connection = await establishConnection();
    const programKeypair = await getProgramKeypair(connection, programPath);
    const accountToBeGreeted = await createAccountOwnedByProgram(
        connection,
        payerKeyPair, 
        programKeypair.publicKey,);
    const accInfo = await connection.getAccountInfo(accountToBeGreeted);
    console.log('owner')
    console.log(accInfo.owner);


    const balance = await getBalance(connection, payerKeyPair);

    // return 0;
    await sayHello(connection, programKeypair.publicKey, accountToBeGreeted, payerKeyPair);
    await reportGreetings(connection, accountToBeGreeted);
}

const getBalance = async (connection: Connection, keyPair: Keypair) => {
    const balance = await connection.getBalance(keyPair.publicKey);
    console.log(`Balance ${balance}`);
    return balance;
}

export async function reportGreetings(connection: Connection, greetedKey: PublicKey): Promise<void> {
    const accountInfo = await connection.getAccountInfo(greetedKey);
    if (accountInfo === null) {
      throw 'Error: cannot find the greeted account';
    }
    const greeting = borsh.deserialize(
      GreetingSchema,
      GreetingAccount,
      accountInfo.data,
    );
    console.log(
        greetedKey.toBase58(),
      'has been greeted',
      greeting.counter,
      'time(s)',
    );
  }
  

const createAccountOwnedByProgram = async (connection: Connection, payer: Keypair, programId: PublicKey) => {
    const GREETING_SEED = 'wadwa';
    const greetedPubkey = await PublicKey.createWithSeed(
        payer.publicKey,
        GREETING_SEED,
        programId,
    );

    const GREETING_SIZE =  borsh.serialize(
        GreetingSchema,
        new GreetingAccount(),
      ).length;;
    // Check if the greeting account has already been created
    const greetedAccount = await connection.getAccountInfo(greetedPubkey);
    if (greetedAccount === null) {
        console.log(
            'Creating account',
            greetedPubkey.toBase58(),
            'to say hello to',
        );
        const lamports = await connection.getMinimumBalanceForRentExemption(
            GREETING_SIZE,
        );

        const transaction = new Transaction().add(
            SystemProgram.createAccountWithSeed({
                fromPubkey: payer.publicKey,
                basePubkey: payer.publicKey,
                seed: GREETING_SEED,
                newAccountPubkey: greetedPubkey,
                lamports,
                space: GREETING_SIZE,
                programId,
            }),
        );
        await sendAndConfirmTransaction(connection, transaction, [payer]);

        
    };
    return greetedPubkey;
}

const createUserKey = async (filePath: string): Promise<string> => {
    const newPair = Keypair.generate();
    fs.writeFile(filePath, `[${newPair.secretKey.toString()}]`, { encoding: 'utf8' });
    return filePath;
}

// const getProgramId = async (connection: Connection, programPath: string) => {
//     const secretKeyString = await fs.readFile(programPath, { encoding: 'utf8' });
//     const secretKey = Uint8Array.from(JSON.parse(secretKeyString));
//     const programId = Keypair.fromSecretKey(secretKey).publicKey
//     console.log(`Program ID ${programId}`);
//     const programInfo = await connection.getAccountInfo(programId);
//     console.log(`Is executable? ${programInfo.executable}`)
//     return programId;
// }
const getProgramKeypair = async (connection: Connection, programPath: string) => {
    const secretKeyString = await fs.readFile(programPath, { encoding: 'utf8' });
    const secretKey = Uint8Array.from(JSON.parse(secretKeyString));
    const programKeyPair = Keypair.fromSecretKey(secretKey)
    console.log(`Program ID ${programKeyPair.publicKey.toString()}`);
    return programKeyPair;
}

class GreetingAccount {
    counter = 0;
    constructor(fields: {counter: number} | undefined = undefined) {
      if (fields) {
        this.counter = fields.counter;
      }
    }
  }
  const GreetingSchema = new Map([
    [GreetingAccount, {kind: 'struct', fields: [['counter', 'u32']]}],
  ]);
  
const sayHello = async (
    connection: Connection,
    programId: PublicKey,
    accountToBeGreeted: PublicKey,
    payerAccount: Keypair) => {
    console.log('Saying hello to', accountToBeGreeted.toString());
    const instruction = new TransactionInstruction({
        keys: [{ pubkey: accountToBeGreeted, isSigner: false, isWritable: true }],
        programId,
        data: Buffer.alloc(0),
    });
    await sendAndConfirmTransaction(
        connection,
        new Transaction().add(instruction),
        [payerAccount],
    );
}

const getPayer = async (userPath: string): Promise<Keypair> => {
    const secretKeyString = await fs.readFile(userPath, { encoding: 'utf8' });
    const secretKey = Uint8Array.from(JSON.parse(secretKeyString));
    const keyPair = Keypair.fromSecretKey(secretKey);
    console.log(`Wallet found at ${keyPair.publicKey.toString()}`)
    return keyPair;
}

// /**
//  * Establish a connection to the cluster
//  */
const establishConnection = async () => {
    const rpcUrl = 'http://127.0.0.1:8899';
    const connection = new Connection(rpcUrl, 'confirmed');
    const version = await connection.getVersion();
    console.log('Connection to cluster established:', rpcUrl);
    return connection;
}

main();

