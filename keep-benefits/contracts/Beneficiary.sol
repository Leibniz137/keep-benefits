/*
Can't use 0.7.4 (current latest)
*/
pragma solidity 0.7.1;

// SPDX-License-Identifier: GPL-3.0-or-later

import "openzeppelin/openzeppelin-contracts@3.2.2-solc-0.7/contracts/access/Ownable.sol";
import "openzeppelin/openzeppelin-contracts@3.2.2-solc-0.7/contracts/token/ERC20/IERC20.sol";
import "../interfaces/IKeepRandomBeaconOperator.sol";


contract Beneficiary is Ownable {
    IKeepRandomBeaconOperator private randomBeaconOperator;

    event ReceivedEther(address, uint);

    // solhint-disable-next-line func-visibility
    constructor(address randomBeaconOperatorAddress) {
        randomBeaconOperator = IKeepRandomBeaconOperator(randomBeaconOperatorAddress);
    }

    /*
    Withdraw eth to the contract owner
    */
    function withdrawEth(uint amount) external onlyOwner {
        require(amount <= address(this).balance);

        // must use type "address payable", to send eth, not just "address"
        address payable payableOwner = payable(owner());
        payableOwner.transfer(amount);
    }

    /*
    Withdraw an arbitrary erc20 token to the contract owner
    */
    function withdrawERC20(uint amount, IERC20 token) external onlyOwner {
        require(amount <= token.balanceOf(address(this)));

        token.transfer(owner(), amount);
    }

    function claimBeaconRewards(uint256[] calldata groupIndicies, address operator) external onlyOwner {
        for (uint256 i = 0; i < groupIndicies.length; i++) {
            randomBeaconOperator.withdrawGroupMemberRewards(operator, i);
        }
    }

    /*
    To make this contract able to receive ether

    NOTE: solhint doesn't seem to understand the receive function w/out function keyword...
    */
    /* solhint-disable */
    receive() external payable {
        emit ReceivedEther(msg.sender, msg.value);
    }
    /* solhint-enable */
}
