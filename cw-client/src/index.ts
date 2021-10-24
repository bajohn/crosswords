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
    TransferParams,
} from '@solana/web3.js';
import * as borsh from 'borsh';




const main = async () => {
    const programPath = '../dist/program/cwcontract-keypair.json';
    const userPath = 'userkeypair.json';
    // await createUserKey(userPath); // create and store private key for the user

    const playerKeyPair = await getPayer(userPath);
    console.log('Player key', playerKeyPair.publicKey.toString());
    const connection = await establishConnection();
    const programKeypair = await getProgramKeypair(connection, programPath);
    const escrowAccount = await createAccountOwnedByProgram(
        connection,
        playerKeyPair,
        programKeypair.publicKey);
    // await fundEscrowAccount(connection, playerKeyPair, escrowAccount);
    await logAccInfo(connection, escrowAccount)
    await logAccInfo(connection, playerKeyPair.publicKey);
    await transferFunds(connection, programKeypair.publicKey, escrowAccount, playerKeyPair);
    await logAccInfo(connection, escrowAccount)
    await logAccInfo(connection, playerKeyPair.publicKey);
}

const logAccInfo = async (connection: Connection, account: PublicKey)=>{
    const info = await connection.getAccountInfo(account);
    console.log(info);
}

const fundEscrowAccount = async (connection: Connection, payerKeypair: Keypair, receiverPubkey: PublicKey) => {
    const transferParams: TransferParams = {
        toPubkey: receiverPubkey,
        fromPubkey: payerKeypair.publicKey,
        lamports: 1 * LAMPORTS_PER_SOL
    };

    const transactionInstruction = SystemProgram.transfer(transferParams);
    const transaction = new Transaction().add(transactionInstruction);
    await sendAndConfirmTransaction(connection, transaction, [payerKeypair]);

}




const createAccountOwnedByProgram = async (connection: Connection, payer: Keypair, programId: PublicKey) => {
    const GREETING_SEED = 'escrowseed';
    const escrowPubkey = await PublicKey.createWithSeed(
        payer.publicKey,
        GREETING_SEED,
        programId,
    );

    const GREETING_SIZE = borsh.serialize(
        GreetingSchema,
        new GreetingAccount(),
    ).length;
    // Check if the greeting account has already been created
    const escrowAccount = await connection.getAccountInfo(escrowPubkey);
    if (escrowAccount === null) {
        console.log(
            'Creating account', escrowPubkey.toBase58(),
        );
        const lamports = await connection.getMinimumBalanceForRentExemption(
            GREETING_SIZE,
        );
        const transaction = new Transaction().add(
            SystemProgram.createAccountWithSeed({
                fromPubkey: payer.publicKey,
                basePubkey: payer.publicKey,
                seed: GREETING_SEED,
                newAccountPubkey: escrowPubkey,
                lamports,
                space: GREETING_SIZE,
                programId,
            }),
        );
        await sendAndConfirmTransaction(connection, transaction, [payer]);
    } else {
        console.log(
            'Account exists', escrowPubkey.toBase58(),
        );
    }
    return escrowPubkey;
}

const createUserKey = async (filePath: string): Promise<string> => {
    const newPair = Keypair.generate();
    fs.writeFile(filePath, `[${newPair.secretKey.toString()}]`, { encoding: 'utf8' });
    return filePath;
}

const getBalance = async (connection: Connection, keyPair: Keypair) => {
    const balance = await connection.getBalance(keyPair.publicKey);
    console.log(`Balance ${balance}`);
    return balance;
}

const getProgramKeypair = async (connection: Connection, programPath: string) => {
    const secretKeyString = await fs.readFile(programPath, { encoding: 'utf8' });
    const secretKey = Uint8Array.from(JSON.parse(secretKeyString));
    const programKeyPair = Keypair.fromSecretKey(secretKey)
    console.log(`Program ID ${programKeyPair.publicKey.toString()}`);
    return programKeyPair;
}

class GreetingAccount {
    counter = 0;
    constructor(fields: { counter: number } | undefined = undefined) {
        if (fields) {
            this.counter = fields.counter;
        }
    }
}
const GreetingSchema = new Map([
    [GreetingAccount, { kind: 'struct', fields: [['counter', 'u32']] }],
]);


const getPayer = async (userPath: string): Promise<Keypair> => {
    const secretKeyString = await fs.readFile(userPath, { encoding: 'utf8' });
    const secretKey = Uint8Array.from(JSON.parse(secretKeyString));
    const keyPair = Keypair.fromSecretKey(secretKey);
    console.log(`Wallet found at ${keyPair.publicKey.toString()}`)
    return keyPair;
}

const establishConnection = async () => {
    const rpcUrl = 'http://127.0.0.1:8899';
    const connection = new Connection(rpcUrl, 'confirmed');
    const version = await connection.getVersion();
    console.log('Connection to cluster established:', rpcUrl);
    return connection;
}


const transferFunds = async (
    connection: Connection,
    programId: PublicKey,
    escrowAccount: PublicKey,
    receiverKeypair: Keypair
) => {

    const instruction = new TransactionInstruction({
        keys: [
            { pubkey: escrowAccount, isSigner: false, isWritable: true },
            { pubkey: receiverKeypair.publicKey, isSigner: false, isWritable: true }
        ],
        programId,
        data: Buffer.alloc(0),
    });
    await sendAndConfirmTransaction(
        connection,
        new Transaction().add(instruction),
        [receiverKeypair],
    );
}



const reportGreetings = async (connection: Connection, greetedKey: PublicKey) => {
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


main();

