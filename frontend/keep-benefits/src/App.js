import { formatEther } from '@ethersproject/units';
// import { ethers } from 'ethers';
import { useTable } from 'react-table';
import React from 'react';
import { useWeb3React } from '@web3-react/core';

import './App.css';
// import KeepRandomBeaconOperator from './KeepRandomBeaconOperator.json';
import { injected } from './connectors.js';

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

// async function loadRewards (library, operator) {
//   const contractAddress = KeepRandomBeaconOperator.networks['1'].address;
//   const abi = KeepRandomBeaconOperator.abi;
//
//   const provider = new library.providers.Web3Provider(window.ethereum);
//   const contract = new library.Contract(contractAddress, abi, provider);
//
//   const eventName = 'DkgResultSubmittedEvent';
//   const contractInitBlock = 10834116;
//
//   const events = await contract.queryFilter(eventName, contractInitBlock);
//   var groups = [];
//   var members, groupPubKey, event, hasWithdrawn, isStale, rewards;
//   for (var groupIndex = 0; groupIndex < events.length; groupIndex++) {
//     event = events[groupIndex];
//     groupPubKey = event.args.groupPubKey;
//     members = await contract.getGroupMembers(groupPubKey);
//     members.forEach(async function (member) {
//       if (member === operator) {
//         hasWithdrawn = await contract.hasWithdrawnRewards(operator, groupIndex);
//         isStale = await contract.isStaleGroup(groupPubKey);
//         if (isStale && !hasWithdrawn) {
//           rewards = await contract.getGroupMemberRewards(groupPubKey);
//           groups.append({
//             pubkey: groupPubKey,
//             earnings: rewards / 10 ** 18,
//             group_index: groupIndex
//           });
//         }
//       }
//     });
//     return groups;
//   }
// }

function OperatorAccount () {
  // const context = useWeb3React();
  // const { library } = useWeb3React();

  const [address, setAddress] = React.useState('');

  const columns = React.useMemo(
    () => [
      {
        Header: 'Group Index',
        accessor: 'groupIndex' // accessor is the "key" in the data
      },
      {
        Header: 'Rewards',
        accessor: 'rewards'
      }
    ],
    []
  );

  const data = React.useMemo(
    () => [
      {
        col1: 'Hello',
        col2: 'World'
      },
      {
        col1: 'react-table',
        col2: 'rocks'
      },
      {
        col1: 'whatever',
        col2: 'you want'
      }
    ],
    []
  );

  const tableInstance = useTable({ columns, data });
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow
  } = tableInstance;
  function handleSubmit (event) {
    event.preventDefault(); // stops default reloading behaviour
    console.log(address);
  }

  function handleAddressChange (event) {
    setAddress(event.target.value);
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
      <table {...getTableProps()} style={{ border: 'solid 1px blue' }}>
        <thead>
          {
            headerGroups.map(headerGroup => (
              <tr {...headerGroup.getHeaderGroupProps()}>
                {
                  headerGroup.headers.map(column => (
                    <th
                      {...column.getHeaderProps()}
                      style={{
                        borderBottom: 'solid 3px red',
                        background: 'aliceblue',
                        color: 'black',
                        fontWeight: 'bold'
                      }}
                    >
                      {column.render('Header')}
                    </th>
                  ))
                }
              </tr>
            ))
          }
        </thead>
        <tbody {...getTableBodyProps()}>
          {
            rows.map(
              row => {
                prepareRow(row);
                return (
                  <tr {...row.getRowProps()}>
                    {
                      row.cells.map(cell => {
                        return (
                          <td
                            {...cell.getCellProps()}
                            style={{
                              padding: '10px',
                              border: 'solid 1px gray',
                              background: 'papayawhip'
                            }}
                          >
                            {cell.render('Cell')}
                          </td>
                        );
                      })
                    }
                  </tr>
                );
              }
            )
          }
        </tbody>
      </table>
    </div>
  );
}

// {account === null
//   ? '-'
//   : account
//     ? `${account.substring(0, 6)}...${account.substring(account.length - 4)}`
//     : ''}

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
