import fs from 'fs';
import process from 'process';

import { ethers } from 'ethers';

const url = 'http://fullnode.dappnode:8545';
const provider = new ethers.providers.JsonRpcProvider(url);

const contractInfo = JSON.parse(fs.readFileSync('./KeepRandomBeaconOperator.json', 'utf8'));
const contractAddress = contractInfo.networks['1'].address;
const abi = contractInfo.abi;
const contract = new ethers.Contract(contractAddress, abi, provider);

const eventName = 'DkgResultSubmittedEvent';
const contractInitBlock = 10834116;

const operator = ethers.utils.getAddress(process.argv[2]);
console.log(operator);

(async function () {
  const events = await contract.queryFilter(eventName, contractInitBlock);
  // var groups = {};
  var members, groupPubKey, event, hasWithdrawn, isStale, rewards;
  for (var groupIndex = 0; groupIndex < events.length; groupIndex++) {
    event = events[groupIndex];
    groupPubKey = event.args.groupPubKey;
    members = await contract.getGroupMembers(groupPubKey);
    members.forEach(async function (member) {
      if (member === operator) {
        hasWithdrawn = await contract.hasWithdrawnRewards(operator, groupIndex);
        isStale = await contract.isStaleGroup(groupPubKey);
        if (isStale && !hasWithdrawn) {
          rewards = await contract.getGroupMemberRewards(groupPubKey);
          console.log({
            pubkey: groupPubKey,
            earnings: rewards / 10 ** 18,
            group_index: groupIndex
          });
        }
      }
    });
  }
})();
