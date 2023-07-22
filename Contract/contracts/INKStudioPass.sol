// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/cryptography/draft-EIP712Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/draft-ERC721VotesUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/Base64Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/StringsUpgradeable.sol";

contract INKStudioPass is
    Initializable,
    ERC721Upgradeable,
    ERC721EnumerableUpgradeable,
    OwnableUpgradeable,
    EIP712Upgradeable,
    ERC721VotesUpgradeable,
    AccessControlUpgradeable
{
    using CountersUpgradeable for CountersUpgradeable.Counter;
    using StringsUpgradeable for uint256;

    CountersUpgradeable.Counter private _tokenIdCounter;

    /* Variables */
    uint256 public maxSupply;
    uint256 public mintPrice;
    string public imageURI;

    /* Permissions */
    bytes32 public constant PUBLISHER_ROLE = keccak256("PUBLISHER_ROLE");
    bytes32 public constant INVITER_ROLE = keccak256("INVITER_ROLE");
    bytes32 public constant FROZEN_ROLE = keccak256("FROZEN_ROLE");

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address _owner) public initializer {
        __ERC721_init("INKStudioPass", "INKPASS");
        __ERC721Enumerable_init();
        __Ownable_init();
        __EIP712_init("INKStudioPass", "1");
        __ERC721Votes_init();

        _transferOwnership(_owner);

        maxSupply = 5000;
        mintPrice = 0.1 ether;
        imageURI = "https://inkognitos.decentfactory.xyz/img/pass.svg";
    }

    function contractURI() public view returns (string memory) {
        return
            string(
                abi.encodePacked(
                    "data:application/json;base64,",
                    Base64Upgradeable.encode(
                        bytes(
                            abi.encodePacked(
                                "{",
                                '"name":"',
                                "Inkognitos Studio Pass",
                                '",',
                                '"external_link":"',
                                "https://inkognitos.decentfactory.xyz",
                                '",',
                                '"image":"',
                                imageURI,
                                '"}'
                            )
                        )
                    )
                )
            );
    }

    function tokenURI(
        uint256 tokenId
    ) public view override(ERC721Upgradeable) returns (string memory) {
        return
            string(
                abi.encodePacked(
                    "data:application/json;base64,",
                    Base64Upgradeable.encode(
                        bytes(
                            abi.encodePacked(
                                "{",
                                '"name":"',
                                "Pass #",
                                tokenId.toString(),
                                '",',
                                '"external_url":"',
                                "https://inkognitos.decentfactory.xyz",
                                '",',
                                '"image":"',
                                imageURI,
                                '"}'
                            )
                        )
                    )
                )
            );
    }

    function mint() public payable {
        require(msg.value == mintPrice, "Incorrect payment");
        require(totalSupply() < maxSupply, "Sold out");
        require(!hasRole(FROZEN_ROLE, msg.sender), "FROZEN");

        // 1 per account
        require(balanceOf(_msgSender()) == 0, "Already a holder.");

        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(_msgSender(), tokenId);
    }

    function giveTo(address to, uint256 qty) public onlyOwner {
        uint i;
        for (i = 0; i < qty; i++) {
            uint256 tokenId = _tokenIdCounter.current();
            _tokenIdCounter.increment();
            if (totalSupply() > maxSupply) {
                maxSupply = totalSupply();
            }
            _safeMint(to, tokenId);
        }
    }

    /* === onlyOwner === */

    function setMaxSupply(uint256 maxSupply_) public onlyOwner {
        require(maxSupply_ > totalSupply(), "Too low");
        maxSupply = maxSupply_;
    }

    function setMintPrice(uint256 mintPrice_) public onlyOwner {
        mintPrice = mintPrice_;
    }

    function setImageURI(string memory uri) public onlyOwner {
        imageURI = uri;
    }

    function withdraw(address to, uint256 amt) public onlyOwner {
        // uint256 balance = address(this).balance;
        // require(amt <= balance);
        if (amt == 0) {
            amt = address(this).balance;
        }
        (bool success, ) = to.call{value: amt}("");
        require(success, "Failed to transfer the funds");
    }

    // The following functions are overrides required by Solidity.
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal override(ERC721Upgradeable, ERC721EnumerableUpgradeable) {
        super._beforeTokenTransfer(from, to, tokenId);
    }

    function _afterTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal override(ERC721Upgradeable, ERC721VotesUpgradeable) {
        super._afterTokenTransfer(from, to, tokenId);
    }

    function supportsInterface(
        bytes4 interfaceId
    )
        public
        view
        override(
            ERC721Upgradeable,
            ERC721EnumerableUpgradeable,
            AccessControlUpgradeable
        )
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
