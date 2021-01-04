def test_withdraw_eth(accounts, BulkClaimer):
    deployer = accounts[0]

    starting_balance = deployer.balance()

    claimer = BulkClaimer.deploy(
            '0xdF708431162Ba247dDaE362D2c919e0fbAfcf9DE',
            {'from': deployer})

    accounts[1].transfer(claimer, "10 ether", gas_price=0)

    tx = claimer.withdrawEth(10**18)

    # transaction is successful
    assert tx.status == 1

    assert deployer.balance() == starting_balance + "1 ether"


def test_withdraw_erc20(accounts, BulkClaimer, Token):
    claimer_deployer = accounts[0]
    claimer = BulkClaimer.deploy(
        '0xdF708431162Ba247dDaE362D2c919e0fbAfcf9DE',
        {'from': claimer_deployer})

    token_deployer = accounts[1]
    initial_supply = 10
    token = token_deployer.deploy(Token, initial_supply)

    token.transfer(claimer, 5, {'from': token_deployer})

    claimer.withdrawERC20(5, token)

    assert token.balanceOf(claimer_deployer.address) == 5
