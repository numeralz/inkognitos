// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma abicoder v2;

import "./InkognitosNFT.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/utils/ERC1155HolderUpgradeable.sol";

contract InkUsed is
    Initializable,
    ERC1155HolderUpgradeable,
    OwnableUpgradeable
{
    // using EnumerableSet for EnumerableSet.UintSet;
    // EnumerableSet.UintSet private _burned;

    struct TokenInk {
        bool valid;
        uint256[] inkIds;
        uint256[] inkQtys;
    }

    // _tokens[tokenId] = {  }
    mapping(uint256 => TokenInk) private _tokens;

    /* acts as ownee */
    address _refNftAddress;

    function initialize(address _owner, address _nftAddress)
        public
        initializer
    {
        __Ownable_init();
        __ERC1155Holder_init();

        _refNftAddress = _nftAddress;
        _transferOwnership(_owner);

        console.log("Init InkUsed at %s", address(this));
    }

    function set_refNftAddress(address _ref) public onlyOwner {
        _refNftAddress = _ref;
    }

    function store(
        uint256 nftTokenId,
        uint256[] memory inkIds,
        uint256[] memory inkQtys
    ) public {
        require((_refNftAddress != address(0)), "_refNftAddress not set");
        require(msg.sender == _refNftAddress, "Not from NFT contract");

        _tokens[nftTokenId] = TokenInk({
            valid: true,
            inkIds: inkIds,
            inkQtys: inkQtys
        });
    }

    function inkUsed(uint256 nftTokenId)
        public
        view
        returns (uint256[] memory, uint256[] memory)
    {
        require(_tokens[nftTokenId].valid == true, "Invalid token");
        TokenInk memory entry = _tokens[nftTokenId];
        return (entry.inkIds, entry.inkQtys);
    }

    function destroyToken(uint256 nftTokenId) public {
        require(_tokens[nftTokenId].valid == true, "Invalid token");
        require(msg.sender == _refNftAddress, "Not from NFT contract");
        _tokens[nftTokenId].valid = false;
    }
}
