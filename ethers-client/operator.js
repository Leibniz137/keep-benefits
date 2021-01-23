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

(async function () {
  const events = await contract.queryFilter(eventName, contractInitBlock);
  console.log(events);
})();
