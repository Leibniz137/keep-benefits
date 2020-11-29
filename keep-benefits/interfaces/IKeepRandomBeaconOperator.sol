pragma solidity 0.7.1;


interface IKeepRandomBeaconOperator {
    function withdrawGroupMemberRewards(address operator, uint256 groupIndex) external;
}
