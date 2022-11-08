# ParaSwapPool4 and ParaSwapPool10 epoch 24 compenstation rewards

## DAO Proposal
Voted snapshot proposal: https://vote.paraswap.network/#/proposal/0x3850c6c5032d7feeba94ad2c017b998180a41b66229af741c722ae5941a2762e


## Construction of merkle tree
Data have been computed by script in [script/computeRewardsCompensations.js](https://github.com/paraswap/paraswap-spsp-compensation-claimer/blob/master/scripts/computeRewardsCompensations.ts) by rigorously respecting proposal up.

Inputs were computed from different standalone codes. The data should be verifiable onchain at designated block 15712957
see

-> [spsps_snapshot_15712957.json](https://github.com/paraswap/paraswap-spsp-compensation-claimer/blob/master/scripts/spsps_snapshot_15712957.json)

-> [apwine_snapshot_15712957.csv](https://github.com/paraswap/paraswap-spsp-compensation-claimer/blob/master/scripts/apwine_snapshot_15712957.csv)

The output has been pushed to ipfs with hash **QmX8CWo43RD5gY85kb96GWSkPF8A6FbPxTJWmZGxYCqC4H**.
Note: same ipfs hash has been included in snaphsot and decentralised ui loads file from same location.


## Distributor contract
Contract has been deployed on ethereum mainnet at address **0xb7c74317fe4d0cabd414430d8253af087152a5f3**

## UI 
Decentralised UI has been deployed on fleek from this code at https://claim-spsp-4-10-compensation.on.fleek.co or lastest immutable link https://ipfs.fleek.co/ipfs/QmVUyFtPM1KXGUfCiNrGF1bpbMcUrvKF7pb5yGFvN6ZqNG/
