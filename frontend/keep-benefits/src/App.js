import { formatEther } from '@ethersproject/units';
import { ethers } from 'ethers';
import React from 'react';
import { useWeb3React } from '@web3-react/core';

import './App.css';
import KeepRandomBeaconOperator from './KeepRandomBeaconOperator.json';
import BulkClaimer from './BulkClaimer.json';
import { injected } from './connectors.js';

const CONTRACT_ADDRESS = KeepRandomBeaconOperator.networks['1'].address;
const ABI = KeepRandomBeaconOperator.abi;
const CLAIMER_ABI = BulkClaimer.abi;
// TODO: change me this is ropsten
const CLAIMER_ADDRESS = '0xED73d5F347efFc2b12063c8098C3d75e540a949e';

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

  return (
    <>
      <span>Chain Id</span>
      <span role='img' aria-label='chain'>
        ⛓
      </span>
      <span>{chainId ?? ''}</span>
    </>
  );
}

function Account () {
  const { account } = useWeb3React();

  return (
    <>
      <span>Account</span>
      <span role='img' aria-label='robot'>
        🥩
      </span>
      <span>
        {account === null
          ? '-'
          : account
            ? `${account.substring(0, 6)}...${account.substring(account.length - 4)}`
            : ''}
      </span>
    </>
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
    <>
      <span>Balance</span>
      <span role='img' aria-label='gold'>
        💰
      </span>
      <span>{balance === null ? 'Error' : balance ? `Ξ${formatEther(balance)}` : ''}</span>
    </>
  );
}

function OperatorAccount () {
  const { account, library, chainId } = useWeb3React();

  const [address, setAddress] = React.useState('');
  const [balance, setBalance] = React.useState('');
  const [totalRewards, setTotalRewards] = React.useState('');
  const [groupIndicies, setGroupIndicies] = React.useState('');
  const operator = '0x2BAF3650263348f3304c18900A674bB0BF830801';

  React.useEffect(() => {
    if (!!account && !!library) {
      let stale = false;

      const provider = new ethers.providers.Web3Provider(library.provider);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);

      const eventName = 'DkgResultSubmittedEvent';
      const contractInitBlock = 10834116;
      setTotalRewards(0);
      setGroupIndicies('');
      var savedTotalRewards = 0;
      var groupIndiciesArray = [];
      (async function () {
        const events = await contract.queryFilter(eventName, contractInitBlock);
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
                  earnings: rewards / 10 ** 18,
                  group_index: groupIndex
                });
                savedTotalRewards += rewards / 10 ** 18;
                groupIndiciesArray.push(groupIndex);
              }
            }
          });
        }
        // TODO: it would be nice if this could be updated in real-time
        setTotalRewards(savedTotalRewards);
        setGroupIndicies(JSON.stringify(groupIndiciesArray));
      })();

      library
        .getBalance(operator)
        .then((b) => {
          setBalance(formatEther(b));
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
    } else {
      console.log('library is undefined');
    }
  }, [account, library, chainId]); // ensures refresh if referential identity of library doesn't change across chainIds

  function handleSubmit (event) {
    event.preventDefault(); // stops default reloading behaviour
    console.log(address);
  }

  function handleAddressChange (event) {
    setAddress(event.target.value);
  }

  function handleClaim () {
    const provider = new ethers.providers.Web3Provider(library.provider);
    const contractWithoutSigner = new ethers.Contract(CLAIMER_ADDRESS, CLAIMER_ABI, provider);
    const signer = provider.getSigner();
    const contract = contractWithoutSigner.connect(signer);

    contract.claimBeaconEarnings(JSON.parse(groupIndicies), operator);
  }

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <label>
          Operator:
          <input type='text' placeholder='0x...' value={address} onChange={handleAddressChange} />
        </label>
        <input type='submit' value='Submit' />
      </form>
      <p>Group Indices: {groupIndicies}</p>
      <p>Total Rewards: {totalRewards}</p>
      <p>Operator Balance: {balance}</p>
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
        <ChainId />
        <Account />
        <Balance />
        <OperatorAccount />
      </header>
    </div>
  );
}

export default App;
