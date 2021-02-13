import os

from brownie import (
    accounts,
    Beneficiary,
    network,
)

# see: https://github.com/keep-network/keep-core/blob/master/docs/run-random-beacon.adoc   # noqa: E501
ROPSTEN_RANDOM_BEACON_OPERATOR_ADDRESS = '0xC8337a94a50d16191513dEF4D1e61A6886BF410f'   # noqa: E501
MAINNET_RANDOM_BEACON_OPERATOR_ADDRESS = '0xdf708431162ba247ddae362d2c919e0fbafcf9de'   # noqa: E501


def main():
    skey = os.environ['PRIVATE_KEY']
    accounts.add(skey)
    network_name = network.show_active()
    if network_name == 'ropsten':
        operator_address = ROPSTEN_RANDOM_BEACON_OPERATOR_ADDRESS
    elif network_name == 'mainnet':
        operator_address = MAINNET_RANDOM_BEACON_OPERATOR_ADDRESS
    else:
        raise ValueError(f"unsupported network {network}")
    Beneficiary.deploy(operator_address, {'from': accounts[0]})
