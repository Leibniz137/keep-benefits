import fs from 'fs';
import { ethers } from 'ethers';

const url = 'http://fullnode.dappnode:8545';
const provider = new ethers.providers.JsonRpcProvider(url);

const contractInfo = JSON.parse(fs.readFileSync('./KeepRandomBeaconOperator.json', 'utf8'));
const contractAddress = contractInfo.networks['1'].address;
const abi = contractInfo.abi;
const contract = new ethers.Contract(contractAddress, abi, provider);

const eventName = 'DkgResultSubmittedEvent';
const contractInitBlock = 10834116;

const operator = ethers.utils.getAddress('0x2baf3650263348f3304c18900a674bb0bf830801');
console.log(operator);

(async function () {
  const events = await contract.queryFilter(eventName, contractInitBlock);
  // var groups = {};
  var members, groupPubKey, event;
  for (var groupIndex = 0; groupIndex < events.length; groupIndex++) {
    event = events[groupIndex];
    groupPubKey = event.args.groupPubKey;
    members = await contract.getGroupMembers(groupPubKey);
    members.forEach(function (member) {
      if (member === operator) {
        console.log(groupPubKey);
      }
    });
  }
})();
