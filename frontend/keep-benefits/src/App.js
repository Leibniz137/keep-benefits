import { ethers } from 'ethers';
import React from 'react';
import { useWeb3React } from '@web3-react/core';

import './App.css';
import KeepRandomBeaconOperator from './KeepRandomBeaconOperator.json';
import BulkClaimer from './BulkClaimer.json';
import { injected } from './connectors.js';

const RANDOM_BEACON_MAINNET_ADDRESS = KeepRandomBeaconOperator.networks['1'].address;
// NOTE: this is the old beacon
// new one is 0x89361Bd4E69C72194CDcAEcEA3A4df525F22Cb03
// see: https://github.com/keep-network/keep-core/blob/master/docs/run-random-beacon.adoc#823-contracts
const RANDOM_BEACON_ROPSTEN_ADDRESS = '0xC8337a94a50d16191513dEF4D1e61A6886BF410f';
const ABI = KeepRandomBeaconOperator.abi;
const CLAIMER_ABI = BulkClaimer.abi;

const CLAIMER_ADDRESS_ROPSTEN = '0xBb19d16E1Ac4127D84E2F95fE7Dc7411C05b7d77';
const CLAIMER_ADDRESS_MAINNET = '0xe35aAB9f8d5bDf50C005743362768Dd9CC883634';

const EVENT_NAME = 'DkgResultSubmittedEvent';
const RANDOM_BEACON_INIT_BLOCK_MAINNET = 10834116;
const RANDOM_BEACON_INIT_BLOCK_ROPSTEN = 8580806;

export function useEagerConnect () {
  const { activate, active } = useWeb3React();

  const [tried, setTried] = React.useState(false);

  React.useEffect(() => {
    injected.isAuthorized().then((isAuthorized) => {
      if (isAuthorized) {
        activate(injected, undefined, true).catch(() => {
          setTried(true);
        });
      } else {
        setTried(true);
      }
    });
  }, []); // intentionally only running on mount (make sure it's only mounted once :))

  // if the connection worked, wait until we get confirmation of that to flip the flag
  React.useEffect(() => {
    if (!tried && active) {
      setTried(true);
    }
  }, [tried, active]);

  return tried;
}

export function useInactiveListener (suppress = false) {
  const { active, error, activate } = useWeb3React();

  React.useEffect(() => {
    const { ethereum } = window;
    if (ethereum && ethereum.on && !active && !error && !suppress) {
      const handleConnect = () => {
        console.log("Handling 'connect' event");
        activate(injected);
      };
      const handleChainChanged = (chainId) => {
        console.log("Handling 'chainChanged' event with payload", chainId);
        activate(injected);
      };
      const handleAccountsChanged = (accounts) => {
        console.log("Handling 'accountsChanged' event with payload", accounts);
        if (accounts.length > 0) {
          activate(injected);
        }
      };
      const handleNetworkChanged = (networkId) => {
        console.log("Handling 'networkChanged' event with payload", networkId);
        activate(injected);
      };

      ethereum.on('connect', handleConnect);
      ethereum.on('chainChanged', handleChainChanged);
      ethereum.on('accountsChanged', handleAccountsChanged);
      ethereum.on('networkChanged', handleNetworkChanged);

      return () => {
        if (ethereum.removeListener) {
          ethereum.removeListener('connect', handleConnect);
          ethereum.removeListener('chainChanged', handleChainChanged);
          ethereum.removeListener('accountsChanged', handleAccountsChanged);
          ethereum.removeListener('networkChanged', handleNetworkChanged);
        }
      };
    }
  }, [active, error, suppress, activate]);
}

function ChainId () {
  const { chainId } = useWeb3React();

  // TODO: if chanid not in (1, 3) add warning/error
  return (
    <div>
      <p>Chain Id ⛓: {chainId ?? ''}</p>
    </div>
  );
}

function Account () {
  const { account } = useWeb3React();

  return (
    <div>
      <p>
      Current Account 🦊: {account === null
          ? '-'
          : account
            ? `${account.substring(0, 6)}...${account.substring(account.length - 4)}`
            : ''}
      </p>
    </div>
  );
}

function Balance () {
  const { account, library, chainId } = useWeb3React();

  const [balance, setBalance] = React.useState();
  React.useEffect(() => {
    if (!!account && !!library) {
      let stale = false;

      library
        .getBalance(account)
        .then((balance) => {
          if (!stale) {
            setBalance(balance);
          }
        })
        .catch(() => {
          if (!stale) {
            setBalance(null);
          }
        });

      return () => {
        stale = true;
        setBalance(undefined);
      };
    }
  }, [account, library, chainId]); // ensures refresh if referential identity of library doesn't change across chainIds

  return (
    <div>
      <p>
        Current Account Balance: {balance === null ? 'Error' : balance ? `Ξ${ethers.utils.formatEther(balance)}` : ''}
      </p>
    </div>
  );
}

function Rewards () {
  const { account, library, chainId } = useWeb3React();
  var claimerAddress = CLAIMER_ADDRESS_MAINNET;
  var randomBeaconAddress = RANDOM_BEACON_MAINNET_ADDRESS;
  var contractInitBlock = RANDOM_BEACON_INIT_BLOCK_MAINNET;
  if (chainId === 3) {
    claimerAddress = CLAIMER_ADDRESS_ROPSTEN;
    randomBeaconAddress = RANDOM_BEACON_ROPSTEN_ADDRESS;
    contractInitBlock = RANDOM_BEACON_INIT_BLOCK_ROPSTEN;
  }
  // TODO: unsupported network warning if chainId not in (1,3)

  const [address, setAddress] = React.useState('');
  const [totalRewards, setTotalRewards] = React.useState('');
  const [groupIndicies, setGroupIndicies] = React.useState('');

  React.useEffect(() => {
    if (!!account && !!library) {
      // TODO: what does this do?
      let stale = false;

      const provider = new ethers.providers.Web3Provider(library.provider);
      const contract = new ethers.Contract(randomBeaconAddress, ABI, provider);

      setTotalRewards(0);
      if (address) {
        setGroupIndicies('loading...');
      } else {
        setGroupIndicies('∅');
      }
      var groupIndiciesArray = [];
      (async function () {
        const events = await contract.queryFilter(EVENT_NAME, contractInitBlock);
        for (let groupIndex = 0; groupIndex < events.length; groupIndex++) {
          const event = events[groupIndex];
          const groupPubKey = event.args.groupPubKey;
          const members = await contract.getGroupMembers(groupPubKey);
          for (const member of members) {
            if (member === address) {
              const hasWithdrawn = await contract.hasWithdrawnRewards(address, groupIndex);
              const isStale = await contract.isStaleGroup(groupPubKey);
              if (isStale && !hasWithdrawn) {
                const rewards = await contract.getGroupMemberRewards(groupPubKey);
                console.log({
                  earnings: rewards / 10 ** 18,
                  group_index: groupIndex
                });
                if (!stale) { // TODO: what does this do?
                  setTotalRewards(totalRewards + rewards / 10 ** 18);
                }
                /*
                NOTE 1: check that groupIndex isn't already included
                because (at least on ropsten) you can have a single
                operator participate multiple times in a single group
                */
                /*
                NOTE 2: in testing, some of the rewards showed up as 0
                this seemed to trigger an error:
                */
                if (!(groupIndiciesArray.includes(groupIndex)) && rewards > 0) {
                  groupIndiciesArray.push(groupIndex);
                }
              }
            }
          }
        }
        // 1. initialCost + (perLoopCost * n) < blockGasLimit
        // 2. perLoopCost * n < blockGasLimit - initialCost
        // 3. n = Math.floor((blockGasLimit - initialCost) / perLoopCost)
        const block = await library.getBlock('latest');
        const blockGasLimit = block.gasLimit;
        const perLoopCost = 297878;
        const initialCost = 410270;
        // NOTE: subtracting 1 was necessary in testing on ropsten
        const maximum = Math.floor((blockGasLimit.toNumber() - initialCost) / perLoopCost) - 1;
        if (!stale) { // TODO: what does this do?
          setGroupIndicies(JSON.stringify(groupIndiciesArray.slice(0, maximum)));
        }
      })();
      return () => {
        stale = true;
        setGroupIndicies(undefined);
        setTotalRewards(undefined);
      };
    }
  }, [account, address, chainId, contractInitBlock, library, randomBeaconAddress, totalRewards]); // ensures refresh if referential identity of library doesn't change across chainIds

  function handleAddressChange (event) {
    setAddress(event.target.value);
  }

  function handleClaim () {
    const provider = new ethers.providers.Web3Provider(library.provider);
    const contractWithoutSigner = new ethers.Contract(claimerAddress, CLAIMER_ABI, provider);
    const signer = provider.getSigner();
    const contract = contractWithoutSigner.connect(signer);

    contract.claimBeaconEarnings(JSON.parse(groupIndicies), address);
  }

  return (
    <div>
      <form>
        <label>
          Operator:
          <input type='text' placeholder='0x...' value={address} onChange={handleAddressChange} />
        </label>
      </form>
      <p>Group Indices: {groupIndicies}</p>
      <p>Total Rewards: {totalRewards}</p>
      <div>
        <button onClick={handleClaim}>claim</button>
      </div>
    </div>
  );
}

function App () {
  const context = useWeb3React();
  // const { connector, library, chainId, account, activate, deactivate, active, error } = context;
  const { connector } = context;

  // handle logic to recognize the connector currently being activated
  const [activatingConnector, setActivatingConnector] = React.useState();
  React.useEffect(() => {
    if (activatingConnector && activatingConnector === connector) {
      setActivatingConnector(undefined);
    }
  }, [activatingConnector, connector]);

  // handle logic to eagerly connect to the injected ethereum provider, if it exists and has granted access already
  const triedEager = useEagerConnect();

  // handle logic to connect in reaction to certain events on the injected ethereum provider, if it exists
  useInactiveListener(!triedEager || !!activatingConnector);
  // debugger;
  return (
    <div className='App'>
      <header className='App-header'>
        <p>NOTE: Bulk claiming is more gas efficient than claiming individually only if you have rewards for 4 or more beacon groups.</p>
        <ChainId />
        <Account />
        <Balance />
        <Rewards />
      </header>
    </div>
  );
}

export default App;
