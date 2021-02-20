# Keep Benefits
Accrue Random Beacon earnings more efficiently!

keep-benefits is a contract for claiming earnings for operators of the keep network random beacon.
Specifically, this contract is used as the beneficiary address (which is set when delegating KEEP tokens).

In the current implementation of the Keep Random Beacon, operator income must be claimed
with a transaction *per beacon group*.

Unfortunately, the earnings for participating in an individual random beacon group are rather small (on the order of ~0.02 eth).
This means that the transaction fees associated with claiming each random beacon reward burn a substantial portion of each reward!

The purpose of the keep-benefits contract is to claim these earnings in bulk in a single transaction,
saving you the overhead (and inconvenience) of claiming each reward individually with a distinct transaction.

## Claiming earnings
```
# use your operator address here
export OPERATOR='0x...'

# set an http rpc eth endpoint
export HTTP_RPC_URL='https://mainnet.infura.io/v3/...'

fab list_unclaimed_beacon_earnings:$OPERATOR

# this can be any account with sufficient eth balance
# to perform the transaction
export PRIVATE_KEY='...'
fab claim_beacon_rewards:$OPERATOR
```

## Gas Usage
keep-benefits is more efficient than claiming earnings for four or more beacon
groups.

| Number of Beacon Groups | Keep BulkClaimer Contract Gas Usage | Individual Transaction Gas Usage |
| :-----------------------|:--------------------------------:|----------------:|
| 4 | 1217869 | 1283984 |
| 3 | 919991 | 962988 |
| 2 | 622113 | 641992 |
| 1 | 410270 | 320996 |


# Development
keep-benefits is developed using the [brownie framework](https://eth-brownie.readthedocs.io/en/stable/)


## Deploying the BulkClaimer contract
Initially, you will need to deploy the contract.
The account that deploys the contract will be the owner, however
it is possible to transfer the ownership of the contract to a different
address in the future (see [openzeppelin docs](https://docs.openzeppelin.com/contracts/3.x/api/access#Ownable)).

```
pip install -r requirements.txt
cd keep-benefits

export WEB3_INFURA_PROJECT_ID='...'
export PRIVATE_KEY='...'

# required to verify contract source code
export ETHERSCAN_TOKEN='...'

# use --network mainnet for mainnet deploy
# NOTE: delete build/ directory after each deployment!
#       (cause etherscan contract verification to fail)
brownie run deployment --network ropsten
```

## Testing
```
cd keep-benefits
brownie test
```
