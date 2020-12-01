# Keep Benefits
Accrue Random Beacon rewards more efficiently!

keep-benefits is a contract for claiming rewards for operators of the keep network random beacon.
Specifically, this contract is used as the beneficiary address (which is set when delegating KEEP tokens).

In the current implementation of the Keep Random Beacon, rewards for operators must be claimed
with a transaction *per beacon group*.

Unfortunately, the rewards for participating in an individual random beacon group are rather small (on the order of ~0.02 eth).
This means that the transaction fees associated with claiming each random beacon reward burn a substantial portion of each reward!

The purpose of the keep-benefits contract is to claim these rewards in bulk in a single transaction,
saving you the overhead (and inconvenience) of claiming each reward individually with a distinct transaction.

To use keep-benefits, deploy your own instance of the contract, and set it as the beneficiary address when creating your KEEP token delegation.

The address you use to deploy the contract will be the contract's owner, and only this account
can be used to claim rewards and withdraw eth/erc20s from the contract.

At any time, you can claim these rewards in bulk and withdraw them from the contract.
This saves gas, which means more ETH! 🧧🤑⧫

## Deploying the beneficiary contract
Initially, you will need to deploy the contract.
The account that deploys the contract will be the owner, however
it is possible to transfer the ownership of the contract to a different
address in the future (see [openzeppelin docs](https://docs.openzeppelin.com/contracts/3.x/api/access#Ownable)).

```
pip install -r requirements.txt
cd keep-benefits

export WEB3_INFURA_PROJECT_ID='...'
export PRIVATE_KEY='...'

# use --network mainnet for mainnet deploy
brownie run deployment --network ropsten
```

## Claiming rewards
```
# use your operator address here
export OPERATOR='0x...'


# set an http rpc eth endpoint
export HTTP_RPC_URL='https://mainnet.infura.io/v3/...'

fab list_unclaimed_beacon_rewards:$OPERATOR

# NOTE: only the contract owner can claim rewards!
export PRIVATE_KEY='...'
fab claim_beacon_rewards:$OPERATOR
```

# Development
keep-benefits is developed using the [brownie framework](https://eth-brownie.readthedocs.io/en/stable/)

## Testing
```
cd keep-benefits
brownie test
```
