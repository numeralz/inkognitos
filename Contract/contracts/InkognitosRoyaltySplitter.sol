// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "hardhat/console.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts-upgradeable/finance/PaymentSplitterUpgradeable.sol";

interface IInkognitosNFT {
    function owner() external returns (address);
}

contract InkognitosRoyaltySplitter is PaymentSplitterUpgradeable {
    address private _owner;

    function init(address owner, address user) public initializer {
        address[] memory _payees = new address[](2);
        uint256[] memory _shares = new uint256[](2);

        _payees[0] = (owner);
        _shares[0] = (33);

        _payees[1] = (user);
        _shares[1] = (66);

        __PaymentSplitter_init(_payees, _shares);

        _owner = owner;
    }

    receive() external payable override {}
}
