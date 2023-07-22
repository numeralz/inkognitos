// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/introspection/ERC165StorageUpgradeable.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165Storage.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract Profile is ERC165StorageUpgradeable, OwnableUpgradeable {
    struct ProfilePic {
        address collection;
        uint256 tokenId;
    }

    mapping(address => ProfilePic) private _profilePics;

    function initialize(address _owner) public initializer {
        __ERC165Storage_init();
        __Ownable_init();
        _transferOwnership(_owner);
    }

    function getProfilePic(
        address user
    ) public view returns (address collection, uint256 tokenId) {
        ProfilePic memory pic = _profilePics[user];
        require(
            ERC721(collection).ownerOf(tokenId) == _msgSender(),
            "Not owner of token"
        );

        return (pic.collection, pic.tokenId);
    }

    function setProfilePic(address collection, uint256 tokenId) public {
        require(
            ERC165Storage(collection).supportsInterface(
                type(IERC721).interfaceId
            ),
            "Interface not supported"
        );
        require(
            ERC721(collection).ownerOf(tokenId) == _msgSender(),
            "Not owner of token"
        );
    }

    receive() external payable {}
}
