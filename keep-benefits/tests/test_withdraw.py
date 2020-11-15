def test_withdraw_eth(accounts, Beneficiary):
    deployer = accounts[0]

    starting_balance = deployer.balance()

    beneficiary = deployer.deploy(Beneficiary)

    accounts[1].transfer(beneficiary, "10 ether", gas_price=0)

    tx = beneficiary.withdrawEth(10**18)

    # transaction is successful
    assert tx.status == 1

    assert deployer.balance() == starting_balance + "1 ether"

#
# def test_withdraw_erc20(Beneficiary):
#     deployer = accounts[0]
