/*
ERC20 Token. Intented to be functionally equivalent to KEEP & tBTC tokens.
*/


/*
Can't use 0.7.4 (current latest)
*/
pragma solidity 0.7.1;


import "openzeppelin/openzeppelin-contracts@3.2.2-solc-0.7/contracts/token/ERC20/ERC20.sol";


contract Token is ERC20 {
    constructor(uint256 initialSupply) public ERC20("Mock", "MOCK") {
        _mint(msg.sender, initialSupply);
    }
}
