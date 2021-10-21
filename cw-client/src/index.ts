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





const main = async () => {
    const programPath = '../dist/program/cwcontract-keypair.json';
    const userPath = await createUserKey(); // create and store private key for the user

    const payerKeyPair = await getPayer(userPath);
    const programId = await getProgramId(programPath);
    console.log(programId);

    const connection = await establishConnection();

    await sayHello(connection, programId, payerKeyPair);
    console.log('2')
}

const createUserKey = async (): Promise<string> => {
    const filePath = 'userkeypair.json';
    const newPair = Keypair.generate();
    fs.writeFile(filePath, `[${newPair.secretKey.toString()}]`, { encoding: 'utf8' });
    return filePath
}

const getProgramId = async (programPath: string) => {
    const secretKeyString = await fs.readFile(programPath, { encoding: 'utf8' });
    const secretKey = Uint8Array.from(JSON.parse(secretKeyString));
    return Keypair.fromSecretKey(secretKey).publicKey;

}

const sayHello = async (connection: Connection, programId: PublicKey, payerKeypair: Keypair) => {
    console.log('Saying hello to', payerKeypair.publicKey.toBase58());
    const instruction = new TransactionInstruction({
        keys: [{ pubkey: payerKeypair.publicKey, isSigner: false, isWritable: true }],
        programId,
        data: Buffer.alloc(0),
    });
    await sendAndConfirmTransaction(
        connection,
        new Transaction().add(instruction),
        [payerKeypair],
    );
}

const getPayer = async (userPath: string): Promise<Keypair> => {
    const secretKeyString = await fs.readFile(userPath, { encoding: 'utf8' });
    const secretKey = Uint8Array.from(JSON.parse(secretKeyString));
    console.log(secretKey)
    return Keypair.fromSecretKey(secretKey);
}

// /**
//  * Establish a connection to the cluster
//  */
const establishConnection = async () => {
    const rpcUrl = 'http://127.0.0.1:8899';
    const connection = new Connection(rpcUrl, 'confirmed');
    const version = await connection.getVersion();
    console.log('Connection to cluster established:', rpcUrl, version);
    return connection;
}

main();

