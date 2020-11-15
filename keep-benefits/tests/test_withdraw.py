def test_withdraw_eth(accounts, Beneficiary):
    deployer = accounts[0]

    beneficiary = deployer.deploy(Beneficiary)

    accounts[1].transfer(beneficiary, "10 ether", gas_price=0)

    assert beneficiary.balance() == "10 ether"
