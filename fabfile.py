import json
import os
from pathlib import Path
from pprint import pprint

from fabric.api import task
from web3 import Web3


KEEP_RANDOM_BEACON_OPERATOR_ADDRESS = '0xdF708431162Ba247dDaE362D2c919e0fbAfcf9DE'   # noqa: E501
KEEP_RANDOM_BEACON_OPERATOR_JSON_FILE = Path(__file__).parent / 'KeepRandomBeaconOperator.json'   # noqa: E501
with KEEP_RANDOM_BEACON_OPERATOR_JSON_FILE.open() as fp:
    KEEP_RANDOM_BEACON_OPERATOR_ABI = json.load(fp)['abi']

DAPPNODE_HTTP_RPC_URL = 'http://fullnode.dappnode:8545/'
HTTP_RPC_URL = os.environ.get('HTTP_RPC_URL', DAPPNODE_HTTP_RPC_URL)
PROVIDER = Web3.HTTPProvider(HTTP_RPC_URL)
W3 = Web3(PROVIDER)


KEEP_RANDOM_BEACON_OPERATOR_CONTRACT = W3.eth.contract(
    abi=KEEP_RANDOM_BEACON_OPERATOR_ABI,
    address=KEEP_RANDOM_BEACON_OPERATOR_ADDRESS
)
KEEP_RANDOM_BEACON_OPERATOR_CONTRACT_INIT_BLOCK = 10834116


class Group:
    def __init__(self, group_pub_key):
        self.pub_key = group_pub_key
        self.functions = KEEP_RANDOM_BEACON_OPERATOR_CONTRACT.functions

    @property
    def size(self):
        return self.functions.groupSize().call()

    @property
    def members(self):
        function = self.functions.getGroupMembers
        return function(self.pub_key).call()

    @property
    def rewards(self):
        function = self.functions.getGroupMemberRewards   # noqa:E501
        return function(self.pub_key).call()


@task
def list_beacon_rewards(operator):
    "operator_address -> [rewards]"
    events = KEEP_RANDOM_BEACON_OPERATOR_CONTRACT.events.DkgResultSubmittedEvent.getLogs(   # noqa: E501
        fromBlock=KEEP_RANDOM_BEACON_OPERATOR_CONTRACT_INIT_BLOCK
    )
    groups = {}
    for event in events:
        group = Group(event.args.groupPubKey)
        members = group.members
        if Web3.toChecksumAddress(operator) in members:
            reward = group.rewards / group.size
            groups[group.pub_key] = {'group': group, 'reward': reward}
    pprint(groups)
