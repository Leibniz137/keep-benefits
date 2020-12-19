def test_non_owner_withdraw_eth(accounts, Beneficiary):
    deployer = accounts[0]

    starting_balance = deployer.balance()

    beneficiary = Beneficiary.deploy(
        '0xdF708431162Ba247dDaE362D2c919e0fbAfcf9DE', {'from': deployer})

    non_owner = accounts[1]
    non_owner.transfer(beneficiary, "10 ether", gas_price=0)

    tx = beneficiary.withdrawEth(10**18, {'from': non_owner})

    # transaction is successful
    assert tx.status == 1

    assert deployer.balance() == starting_balance + "1 ether"
