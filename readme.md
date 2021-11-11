# Crosswords

## Concept

- Smart contract is deployed with a hard-coded threshold, b, which is enough funding to pay for the experience
- Interested users enter c tokens into escrow, called an entry. Multiple entries are allowed
- Let n = b/c. If n entries are received, the game can be created.
- Continue accepting entries until the game is created
- Once the crossword is created, enter it into the smart contract (hash of the solution is stored on-contract)
- Let m = total number of entries. Entries are no longer accepted once the crossword is entered. 
- p + q = m * c, where p = prize pool, q = amount paid to developers/crossword maker
- First l entries that enter the correct hash can claim p/l credits. This means players can "wager" multiple entries that they'll win.
    - On first run, l = m/2 might be nice - half of entries win


## Guides

Start here, simpler guides
https://solana.blog/building-on-solana-the-experience-of-a-hackathon-participant/
https://blog.chain.link/how-to-build-and-deploy-a-solana-smart-contract/

More advanced, escrow example (will be useful)
https://paulx.dev/blog/2021/01/14/programming-on-solana-an-introduction/


## Notes 

From root dir:

Start local testnet via
```
solana-test-validator
```

Build contract via:
```
cargo build-bpf --manifest-path=./cw-contract/Cargo.toml --bpf-out-dir=dist/program
```


Then deploy contract via
```
solana program deploy ./dist/program/cwcontract.so
```


Then run local client via
```
cd cw-client
npm run dev
```

Log program output with 
```
solana log
```


Fund a wallet using 
```
solana transfer {wallet public key} 1 --allow-unfunded-recipient
solana transfer Gh3EmjisqQZLEyW6fjW1VWg82b3jmomwqr2G7285m1US 1 --allow-unfunded-recipient
```
## TODO

- Try buildng an escrow service.
    1. One account only
        - Send funds to contract 
        - Run an instruction to have the funds returned
    2. One account w/ phrase
        - Send funds to contract
         deserialize the instruction in-contract and check for validity
        - Run an instruction that returns funds iff a correct phrase is sent
    3. Two accounts w/ phrase
        - Have two accounts send funds to a contract
        - Whoever sends the phrase first gets all the funds
    4. Two accounts w/ hash phrase
        - Same as (3), but hash the phrase sent, to obfuscate what phrase unlocks the funds
    --> TODO WE ARE HERE!
    PROBLEM - the instructions are stored on-chain. How can we obfuscate?
    SOLUTION?? 
        - Store a random salt value for each player account in a hashmap account owned by the contract
            {account: salt}
        - When puzzle is ready, some external process populates another hashmap account with 
            {account: hash(hash(salt + puzzle solution))}
        - Players then send hash(salt + (puzzle solution)), and contract calculates  hash(hash(salt + puzzle solution)
    5. n accounts with accounts tracking
        - Same as (4), but allow arbitrary number of accounts, and check the claimer is an original funder
        - Payout is based on length of account array

    6. Game started state
        - Only allow funding before game start, only allow claims after game start
    
    7. Proportional payout
        - Payment for first x winners? 
            - Easy to cheat by making multiple wallets 
            - 


