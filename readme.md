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

Build via:
```
cargo build-bpf --manifest-path=./cw-contract/Cargo.toml --bpf-out-dir=dist/program
```

Start local testnet via
```
solana-test-validator
```
Then deploy via
```
solana program deploy ./program/cwcontract.so
```
Then run local client via
```
cd cw-client
npm run dev
```

Fund a wallet using 
```
solana transfer {wallet public key} 1 --allow-unfunded-recipient
```
## TODO

- Mess around with example-helloworld solana repo, see about getting building blocks working.

- Next up: The hello world example seems to be working! We just gotta give the payer account some credits!

solana transfer Gh3EmjisqQZLEyW6fjW1VWg82b3jmomwqr2G7285m1US 1 --allow-unfunded-recipient
