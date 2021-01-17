// see: https://github.com/NoahZinsmeister/web3-react/blob/v6/example/connectors.ts
import { InjectedConnector } from '@web3-react/injected-connector';

export const injected = new InjectedConnector({ supportedChainIds: [1, 3, 4, 5, 42] });
