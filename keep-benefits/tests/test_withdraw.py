def test_withdraw_eth(accounts, Beneficiary):
    deployer = accounts[0]

    starting_balance = deployer.balance()

    beneficiary = deployer.deploy(Beneficiary)

    accounts[1].transfer(beneficiary, "10 ether", gas_price=0)

    tx = beneficiary.withdrawEth(10**18)

    # transaction is successful
    assert tx.status == 1

    assert deployer.balance() == starting_balance + "1 ether"


def test_withdraw_erc20(accounts, Beneficiary, Token):
    beneficiary_deployer = accounts[0]
    beneficiary = beneficiary_deployer.deploy(Beneficiary)

    token_deployer = accounts[1]
    initial_supply = 10
    token = token_deployer.deploy(Token, initial_supply)

    token.transfer(beneficiary, 5, {'from': token_deployer})

    beneficiary.withdrawERC20(5, token)

    assert token.balanceOf(beneficiary_deployer.address) == 5
