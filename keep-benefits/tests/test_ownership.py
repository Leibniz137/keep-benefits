from brownie.exceptions import VirtualMachineError
import pytest


def test_non_owner_withdraw_eth(accounts, Beneficiary):
    deployer = accounts[0]

    beneficiary = Beneficiary.deploy(
        '0xdF708431162Ba247dDaE362D2c919e0fbAfcf9DE', {'from': deployer})

    accounts[1].transfer(beneficiary, "10 ether", gas_price=0)

    with pytest.raises(VirtualMachineError):
        beneficiary.withdrawEth(10**18, {'from': accounts[1]})
