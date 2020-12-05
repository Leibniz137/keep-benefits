import json
import os
from pathlib import Path
from pprint import pprint

from fabric.api import task
from web3 import Web3


KEEP_RANDOM_BEACON_OPERATOR_JSON_FILE = Path(__file__).parent / 'KeepRandomBeaconOperator.json'   # noqa: E501
with KEEP_RANDOM_BEACON_OPERATOR_JSON_FILE.open() as fp:
    random_beacon_artifact = json.load(fp)
    KEEP_RANDOM_BEACON_OPERATOR_ABI = random_beacon_artifact['abi']
    KEEP_RANDOM_BEACON_OPERATOR_ADDRESS = random_beacon_artifact['networks']["1"]["address"]   # noqa: E501

KEEP_RANDOM_BEACON_OPERATOR_STATISTICS_JSON_FILE = Path(__file__).parent / 'KeepRandomBeaconOperatorStatistics.json'   # noqa: E501
with KEEP_RANDOM_BEACON_OPERATOR_STATISTICS_JSON_FILE.open() as fp:
    random_beacon_statistics_artifact = json.load(fp)
    KEEP_RANDOM_BEACON_OPERATOR_STATISTICS_ABI = random_beacon_statistics_artifact['abi']   # noqa: E501
    KEEP_RANDOM_BEACON_OPERATOR_STATISTICS_ADDRESS = random_beacon_statistics_artifact['networks']["1"]["address"]   # noqa: E501

DAPPNODE_HTTP_RPC_URL = 'http://fullnode.dappnode:8545/'
HTTP_RPC_URL = os.environ.get('HTTP_RPC_URL', DAPPNODE_HTTP_RPC_URL)
PROVIDER = Web3.HTTPProvider(HTTP_RPC_URL)
W3 = Web3(PROVIDER)


KEEP_RANDOM_BEACON_OPERATOR_CONTRACT = W3.eth.contract(
    abi=KEEP_RANDOM_BEACON_OPERATOR_ABI,
    address=KEEP_RANDOM_BEACON_OPERATOR_ADDRESS
)
KEEP_RANDOM_BEACON_OPERATOR_CONTRACT_INIT_BLOCK = 10834116

KEEP_RANDOM_BEACON_OPERATOR_STATISTICS_CONTRACT = W3.eth.contract(
    abi=KEEP_RANDOM_BEACON_OPERATOR_STATISTICS_ABI,
    address=KEEP_RANDOM_BEACON_OPERATOR_STATISTICS_ADDRESS
)
KEEP_RANDOM_BEACON_OPERATOR_STATISTICS_CONTRACT_INIT_BLOCK = 10834116


class Group:
    def __init__(self, group_pub_key, group_index=None):
        self.index = group_index
        self.pub_key = group_pub_key
        self.operator_functions = KEEP_RANDOM_BEACON_OPERATOR_CONTRACT.functions   # noqa: E501
        self.statistics_functions = KEEP_RANDOM_BEACON_OPERATOR_STATISTICS_CONTRACT.functions   # noqa: E501

    @property
    def size(self):
        return self.operator_functions.groupSize().call()

    @property
    def members(self):
        function = self.operator_functions.getGroupMembers
        return function(self.pub_key).call()

    @property
    def rewards(self):
        function = self.operator_functions.getGroupMemberRewards   # noqa:E501
        return function(self.pub_key).call()

    @property
    def stale(self):
        return self.operator_functions.isStaleGroup(self.pub_key).call()


@task
def list_all_beacon_rewards(operator):
    "operator_address -> [rewards]"
    events = KEEP_RANDOM_BEACON_OPERATOR_CONTRACT.events.DkgResultSubmittedEvent.getLogs(   # noqa: E501
        fromBlock=KEEP_RANDOM_BEACON_OPERATOR_CONTRACT_INIT_BLOCK
    )

    groups = {}
    operator = Web3.toChecksumAddress(operator)
    for group_index, event in enumerate(events):
        group = Group(event.args.groupPubKey, group_index)
        if operator in group.members:
            groups[group_index] = {
                'pubkey': group.pub_key,
                'rewards': group.rewards / 10**18,
            }
    pprint(groups)


@task
def list_unclaimed_beacon_rewards(operator):
    events = KEEP_RANDOM_BEACON_OPERATOR_CONTRACT.events.DkgResultSubmittedEvent.getLogs(   # noqa: E501
        fromBlock=KEEP_RANDOM_BEACON_OPERATOR_CONTRACT_INIT_BLOCK
    )

    groups = {}
    operator = Web3.toChecksumAddress(operator)
    for group_index, event in enumerate(events):
        group = Group(event.args.groupPubKey, group_index)
        if operator in group.members:
            has_withdrawn = KEEP_RANDOM_BEACON_OPERATOR_CONTRACT.functions.hasWithdrawnRewards(   # noqa: E501
                operator, group_index
            ).call()
            if group.stale and not has_withdrawn:
                groups[group_index] = {
                    'pubkey': group.pub_key,
                    'rewards': group.rewards / 10**18,
                }
    pprint(groups)


def load_private_key():
    if 'PRIVATE_KEY' in os.environ:
        skey = os.environ['PRIVATE_KEY']
    else:
        try:
            path = Path(os.environ['PRIVATE_KEY_FILE'])
        except KeyError:
            raise RuntimeError(
                "PRIVATE_KEY_FILE environment variable key not found.\n"
                "Set it to the path to the account json file.")
        try:
            passphrase = os.environ['PRIVATE_KEY_PASSPHRASE']
        except KeyError:
            raise RuntimeError(
                "PRIVATE_KEY_PASSPHRASE environment variable not found\n"
                "Set set it to the account's passphrase")
        with path.open() as fp:
            encrypted_key = fp.read()
        skey = W3.eth.account.decrypt(encrypted_key, passphrase)
    return skey


def load_benefits_contract():
    try:
        keep_benefits_address = os.environ['KEEP_BENEFITS_CONTRACT_ADDRESS']   # noqa: E501
    except KeyError:
        msg = "Error: Must have KEEP_BENEFITS_CONTRACT_ADDRESS environment variable set"   # noqa: E501
        raise RuntimeError(msg)
    # this was created when you initially compiled & deployed the contract
    keep_benefits_json_file = Path(__file__).parent / 'keep-benefits/build/contracts.json'   # noqa: E501
    with keep_benefits_json_file.open() as fp:
        keep_benefits_abi = json.load(fp)['abi']
    contract = W3.eth.contract(
        abi=keep_benefits_abi,
        address=keep_benefits_address
    )
    return contract


# # TODO: make this *operator
# @task
# def claim_beacon_rewards(operator):
#     "first find epochs with unclaimed rewards, then claim them in bulk"
#     skey = load_private_key()
#     benefits_contract = load_benefits_contract()
#
#     events = KEEP_RANDOM_BEACON_OPERATOR_CONTRACT.events.DkgResultSubmittedEvent.getLogs(   # noqa: E501
#         fromBlock=KEEP_RANDOM_BEACON_OPERATOR_CONTRACT_INIT_BLOCK
#     )
#     groups = []
#     operator = Web3.toChecksumAddress(operator)
#     for event in events:
#         group = Group(event.args.groupPubKey)
#         if operator in group.members and group.unclaimed(operator):
#             groups.append(group)
#     # tODO: benefits_contract.claimBeaconRewards(group_indicies, operator)
#     pprint(groups)
