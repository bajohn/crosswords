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
    ParsedAccountData,
} from '@solana/web3.js';
import * as borsh from 'borsh';
import * as crypto from 'crypto';



const main = async () => {

    const programPath = '../dist/program/cwcontract-keypair.json';
    const userPath1 = 'userkeypair1.json';
    const userPath2 = 'userkeypair2.json';
    const dealerPath = 'dealerkeypair.json';

    // Run once to create accounts, then fund 
    // with solana transfer {pubkey} {solamount} --allow-unfunded-recipient
    // await createUserKeys([userPath1, userPath2, dealerPath]);

    // Current keys:
    // New key stored at userkeypair1.json, public key 59kWuFvVnjZiQQ2NHyxpedLnZZ5ENW1QJ2u2neshUW7z
    // New key stored at userkeypair2.json, public key A42p9XXPPV2C7mpdfH21Zi9G2VU9US4W2y14huQfXy12
    // New key stored at dealerkeypair.json, public key H9ewgnBZPgPTciT6mrZzKhzRPwijXNxsypjw53jkpUj8

    console.log('Start');
    const dealerKeyPair = await getWalletKeyPair(dealerPath); // Dealer pays to set up escrow
    const player1KeyPair = await getWalletKeyPair(userPath1);
    const player2KeyPair = await getWalletKeyPair(userPath2);
    const allKeypairs = [dealerKeyPair, player1KeyPair, player2KeyPair];

    const connection = await establishConnection();
    const programKeypair = await getProgramKeypair(connection, programPath);
    const hashMapAccount = await createHashmapAccountOwnedByProgram(
        connection,
        dealerKeyPair,
        programKeypair.publicKey);
    await runContract(connection, programKeypair.publicKey, hashMapAccount, player1KeyPair);

    await checkHashmapAccount(connection, hashMapAccount);
    console.log('Done');

    return 'done';

    const escrowAccount = await createAccountOwnedByProgram(
        connection,
        dealerKeyPair,
        programKeypair.publicKey);

    console.log('BEFORE');
    await logAccsInfo(connection, allKeypairs)

    await fundEscrowAccount(connection, player1KeyPair, escrowAccount);
    await fundEscrowAccount(connection, player2KeyPair, escrowAccount);

    const correctPassword = logPasswordHash('a password');
    const incorrectPassword = logPasswordHash('nope nope');

    await payFromEscrow(connection, programKeypair.publicKey, escrowAccount, player1KeyPair, correctPassword);
    await payFromEscrow(connection, programKeypair.publicKey, escrowAccount, player2KeyPair, incorrectPassword);
    console.log('AFTER');
    await logAccsInfo(connection, allKeypairs)
}

const logPasswordHash = (password: string) => {
    const hashed = crypto.createHash('sha256').update(password);
    console.log('TS HASH', hashed.digest('hex'));
    return password;
}

const logAccsInfo = async (connection: Connection, keyPairs: Keypair[]) => {
    Promise.all(keyPairs.map(keypair => logAccInfo(connection, keypair)));
}

const logAccInfo = async (connection: Connection, keyPair: Keypair) => {
    const info = await connection.getAccountInfo(keyPair.publicKey);
    console.log('Account:', keyPair.publicKey.toBase58(), info.lamports);
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
    const FIXED_ACC_SEED = 'escrowseed';
    const escrowPubkey = await PublicKey.createWithSeed(
        payer.publicKey,
        FIXED_ACC_SEED,
        programId,
    );

    // Minimum size per Solana docs https://docs.solana.com/developing/programming-model/accounts
    const MIN_ACC_BYTES = 128;
    // Check if the greeting account has already been created
    const escrowAccount = await connection.getAccountInfo(escrowPubkey);
    if (escrowAccount === null) {
        console.log(
            'Creating account', escrowPubkey.toBase58(),
        );
        const lamports = await connection.getMinimumBalanceForRentExemption(
            MIN_ACC_BYTES,
        );
        const transaction = new Transaction().add(
            SystemProgram.createAccountWithSeed({
                fromPubkey: payer.publicKey,
                basePubkey: payer.publicKey,
                seed: FIXED_ACC_SEED,
                newAccountPubkey: escrowPubkey,
                lamports,
                space: MIN_ACC_BYTES,
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



const createHashmapAccountOwnedByProgram = async (connection: Connection, payer: Keypair, programId: PublicKey) => {
    const FIXED_ACC_SEED = 'ddbbbb';
    const hashmapPubkey = await PublicKey.createWithSeed(
        payer.publicKey,
        FIXED_ACC_SEED,
        programId,
    );

    const SALT_STORE_BYTES = borsh.serialize(
        SaltStoreSchema,
        new SaltStore({ saltstore: ['abcd', 'abcd'] }),
    ).length;

    const escrowAccount = await connection.getAccountInfo(hashmapPubkey);
    if (escrowAccount === null) {
        console.log(
            'Creating account', hashmapPubkey.toBase58(),
        );
        const lamports = await connection.getMinimumBalanceForRentExemption(
            SALT_STORE_BYTES,
        );
        const transaction = new Transaction().add(
            SystemProgram.createAccountWithSeed({
                fromPubkey: payer.publicKey,
                basePubkey: payer.publicKey,
                seed: FIXED_ACC_SEED,
                newAccountPubkey: hashmapPubkey,
                lamports,
                space: 1024,//SALT_STORE_BYTES,
                programId,
            }),
        );
        await sendAndConfirmTransaction(connection, transaction, [payer]);
    } else {
        console.log(
            'Account exists', hashmapPubkey.toBase58(),
        );
    }
    return hashmapPubkey;
}

const checkProgramData = async (connection: Connection, key: PublicKey) => {
    const resp = await connection.getParsedAccountInfo(key);
    console.log('Check:')
    console.log(resp);
    const parsedData = resp.value.data as ParsedAccountData;
    const programData = parsedData.parsed.info.programData as string;
    console.log(programData);


    var binary_string = Buffer.from(programData, 'base64');

    const greeting = borsh.deserialize(
        SaltStoreSchema,
        SaltStore,
        binary_string
    );
};

const truncateBuffer = (buf: Buffer) => {
    for (let i = buf.length - 1; i >= 0; i--) {
        if (buf[i] !== 0) {
            console.log('buf length', i+1);
            return buf.subarray(0, i+1);
        }
    }
}

const checkHashmapAccount = async (connection: Connection, key: PublicKey) => {
    const resp = await connection.getParsedAccountInfo(key);
    console.log('Check:')
    console.log(resp);
    const parsedData = resp.value.data as Buffer;
    const truncatedData = truncateBuffer(parsedData);

    console.log(parsedData);
    console.log(truncatedData);
    const deserialized = borsh.deserialize(
        SaltStoreSchema,
        SaltStore,
        truncatedData
    );
    console.log(deserialized.saltstore);
};



const createUserKeys = async (paths: string[]) => {
    return await Promise.all(paths.map(path => createUserKey(path)));
}
const createUserKey = async (filePath: string): Promise<string> => {
    const newPair = Keypair.generate();
    console.log(`New key stored at ${filePath}, public key ${newPair.publicKey}`);
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

// Schema for passing a password into
// the contract as serialized instruction_data
class PasswordStore {
    password: string;
    constructor(fields: { password: string } | undefined = undefined) {
        if (fields) {
            this.password = fields.password;
        } else {
            throw Error('')
        }
    }
}
const PasswordSchema = new Map([
    [PasswordStore, { kind: 'struct', fields: [['password', 'string']] }],
]);


// Schema for storing a hashmap of
// accounts and salts
class SaltStore {
    saltstore: string[] = [];
    constructor(fields: { saltstore: string[] } | undefined = undefined) {
        if (fields) {
            this.saltstore = fields.saltstore;
        } else {
            throw Error('')
        }
    }
}
const SaltStoreSchema = new Map([
    [SaltStore, {
        kind: 'struct', fields: [['saltstore', ['string']]],
    }]
]);



const getWalletKeyPair = async (userPath: string): Promise<Keypair> => {
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

const runContract = async (
    connection: Connection,
    programId: PublicKey,
    hashmapAccount: PublicKey,
    senderKeypair: Keypair
) => {
    const instruction = new TransactionInstruction({
        keys: [
            { pubkey: hashmapAccount, isSigner: false, isWritable: true },
        ],
        programId,
        data: Buffer.alloc(0),
    });
    await sendAndConfirmTransaction(
        connection,
        new Transaction().add(instruction),
        [senderKeypair],
    );
};

const payFromEscrow = async (
    connection: Connection,
    programId: PublicKey,
    escrowAccount: PublicKey,
    receiverKeypair: Keypair,
    password: string
) => {

    const serialized = borsh.serialize(PasswordSchema, new PasswordStore({ password }));
    const buff: Buffer = Buffer.alloc(serialized.length);
    for (let i = 0; i < serialized.length; i++) {
        buff[i] = serialized[i];
    }
    const instruction = new TransactionInstruction({
        keys: [
            { pubkey: escrowAccount, isSigner: false, isWritable: true },
            //flipped to isSigner to true -> might break things:
            { pubkey: receiverKeypair.publicKey, isSigner: true, isWritable: true }
        ],
        programId,
        data: buff,
    });
    await sendAndConfirmTransaction(
        connection,
        new Transaction().add(instruction),
        [receiverKeypair],
    );
}



// const reportGreetings = async (connection: Connection, greetedKey: PublicKey) => {
//     const accountInfo = await connection.getAccountInfo(greetedKey);
//     if (accountInfo === null) {
//         throw 'Error: cannot find the greeted account';
//     }
//     const greeting = borsh.deserialize(
//         GreetingSchema,
//         GreetingAccount,
//         accountInfo.data,
//     );
//     console.log(
//         greetedKey.toBase58(),
//         'has been greeted',
//         greeting.counter,
//         'time(s)',
//     );
// }


main();

