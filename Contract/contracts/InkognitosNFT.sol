// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// https://github.com/openzeppelin/openzeppelin-contracts-upgradeable
import "./InkognitosInk.sol";
import "./InkognitosRoyaltySplitter.sol";
import "./INKStudioPass.sol";
import "./InkUsed.sol";
import "./Buffer.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/interfaces/IERC165Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/interfaces/IERC2981Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/ClonesUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/Base64Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/cryptography/draft-EIP712Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/cryptography/SignatureCheckerUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/introspection/ERC165StorageUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/StringsUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

contract InkognitosNFT is
    Initializable,
    ERC721Upgradeable,
    EIP712Upgradeable,
    ERC165StorageUpgradeable,
    ERC721BurnableUpgradeable,
    ERC721EnumerableUpgradeable,
    OwnableUpgradeable
{
    /* Utils */
    using AddressUpgradeable for address;
    using StringsUpgradeable for uint256;
    using CountersUpgradeable for CountersUpgradeable.Counter;
    using Buffer for Buffer.buffer;

    /*
    -------------------------------------
    Structs
    -------------------------------------
    */

    /* Token Metadata */
    struct Token {
        address creator;
        address revoker;
        uint256 imageHash;
    }

    /* Permit, signed by _addrVerifier, required to publish */
    struct SubmitPermit {
        address author;
        uint256 imageHash;
        uint256 timestamp;
        uint256[] inkIds;
        uint256[] inkQtys;
    }

    /* State */
    CountersUpgradeable.Counter private _tokenIdCounter;
    string private TOKEN_NAME_PREFIX;
    string private DESCRIPTION;
    uint256 private FEE_DENOMINATOR;
    string public baseImageURI;
    string public baseImageURISuffix;
    uint256 public maxInkPalette;
    uint256 public feeNumerator;
    uint256 public maxSupply;
    string public baseURI;
    string private AUX_METADATA;

    /* _tokens[uint256] */
    mapping(uint256 => Token) private _tokens;

    /* _usedHashes[hash] = tokenId */
    mapping(uint256 => bool) private _usedHashes;

    /* _createdTokens[index][tokenId] */
    mapping(address => mapping(uint256 => uint256)) private _createdTokens;

    /* _createdTokensIndex[tokenId] = index */
    mapping(uint256 => uint256) private _createdTokensIndex;

    /* _createdByAddress[address] = count */
    mapping(address => uint256) private _createdByAddress;

    /* _rewardSplitterContracts */
    mapping(address => address) private _splitters;

    /*
    -------------------------------------
    Contract References
    -------------------------------------
    */
    address public _refInkContract;
    address public _refInkUsed;
    address public _refSplitter;
    address public _addrVerifier;
    address public _pointsTracker;
    address public _royaltyFund;

    bool public mintPaused;
    bool public burnPaused;
    string private _contractURI;
    string private _externalUrlPrefix;

    address public _refPassContract;

    /*
    -------------------------------------
    Events
    -------------------------------------
    */
    /* Publish */
    event TokenPublished(
        address indexed owner,
        uint256 indexed tokenId,
        uint256 imageHash
    );

    event TokenBurned(address indexed burner, uint256 indexed tokenId);

    /*
    -------------------------------------
    Upgradable Constructor
    -------------------------------------
    */
    function initialize(address _owner) public initializer {
        __EIP712_init("InkognitosNFT", "1");
        __ERC721_init("Inkognitos", "NITOS");
        __ERC165Storage_init();
        __ERC721Burnable_init();
        __ERC721Enumerable_init();
        __Ownable_init();

        _transferOwnership(_owner);

        /* Init State */
        TOKEN_NAME_PREFIX = "Inkognitos/";
        feeNumerator = 1000;
        FEE_DENOMINATOR = 10000;
        maxInkPalette = 8;
        maxSupply = 10000;
        AUX_METADATA = '"description":"Community-driven NFT Factory.",';
        _externalUrlPrefix = "https://inkognitos.decentfactory.xyz/tokens/";
        /* baseImage URI */
        baseImageURI = "https://inkognitos.decentfactory.xyz/api/tokens/";
        baseImageURISuffix = "/image";

        _contractURI = 'data:application/json,{"name":"Inkognitos-Factory","description":"Community-driven%20NFT%20art%20factory.%20https://inkognitos.decentfactory.xyz","external_link":"https://inkognitos.decentfactory.xyz"}';
        _royaltyFund = _owner;
    }

    function set_AUX_METADATA(string memory val) public onlyOwner {
        AUX_METADATA = val;
    }

    function set_externalUrlPrefix(string memory val) public onlyOwner {
        _externalUrlPrefix = val;
    }

    /* Reference Addresses */
    function set_refInkContract(address _ref) public onlyOwner {
        _refInkContract = _ref;
    }

    function set_refPassContract(address _ref) public onlyOwner {
        _refPassContract = _ref;
    }

    function set_refSplitter(address _ref) public onlyOwner {
        _refSplitter = _ref;
    }

    function set_addrVerifier(address _ref) public onlyOwner {
        _addrVerifier = _ref;
    }

    function set_royaltyFund(address _ref) public onlyOwner {
        _royaltyFund = _ref;
    }

    function set_refInkUsed(address _ref) public onlyOwner {
        _refInkUsed = _ref;
    }

    /* Number of tokens created by a creator */
    function createdBy(address creator) public view returns (uint256) {
        require(
            creator != address(0),
            "ERC721: address zero is not a valid owner"
        );
        return _createdByAddress[creator];
    }

    /* Burn Token */
    function burn(uint256 tokenId) public override(ERC721BurnableUpgradeable) {
        require(
            _isApprovedOrOwner(_msgSender(), tokenId),
            "ERC721: caller is not token owner nor approved"
        );
        require(burnPaused != true, "Burning is paused.");
        require(_refInkContract != address(0), "Undefined _refInkContract.");
        require(_refInkUsed != address(0), "Undefined _refInkUsed.");

        _burn(tokenId);
    }

    /* Opensea Contract Info */
    function contractURI() public view returns (string memory) {
        return _contractURI;
    }

    /* ERC721 Burn */
    function _burn(uint256 tokenId) internal override(ERC721Upgradeable) {
        (uint256[] memory inkIds, uint256[] memory inkQtys) = InkUsed(
            _refInkUsed
        ).inkUsed(tokenId);

        uint256[] memory inkQtys2 = new uint256[](inkQtys.length);

        uint256 smallHalf;

        uint256 I = inkIds.length;
        for (uint256 i = 0; i < I; ) {
            smallHalf = inkQtys[i] / 2;
            inkQtys2[i] = inkQtys[i] - smallHalf;
            inkQtys[i] = smallHalf;
            unchecked {
                ++i;
            }
        }
        super._burn(tokenId);

        InkognitosInk(payable(_refInkContract)).safeBatchTransferFrom(
            _refInkUsed,
            creatorOf(tokenId),
            inkIds,
            inkQtys2,
            ""
        );

        InkognitosInk(payable(_refInkContract)).safeBatchTransferFrom(
            _refInkUsed,
            _msgSender(),
            inkIds,
            inkQtys,
            ""
        );

        InkUsed(_refInkUsed).destroyToken(tokenId);

        emit TokenBurned(_msgSender(), tokenId);
    }

    /* ERC2981 Royalties */
    function royaltyInfo(
        uint256 _tokenId,
        uint256 _salePrice
    ) public view returns (address receiver, uint256 royaltyAmount) {
        require(_exists(_tokenId), "Token does not exist");
        royaltyAmount = ((feeNumerator * _salePrice) / FEE_DENOMINATOR);

        Token memory token = _tokens[_tokenId];
        address splitter = royaltyAddress(token.creator);

        if (splitter == address(0)) {
            return (owner(), royaltyAmount);
        } else {
            return (splitter, royaltyAmount);
        }
    }

    function royaltyAddress(address creator) public view returns (address) {
        require(
            _splitters[creator] != address(0),
            "Royalties not set up for this address"
        );
        return _splitters[creator];
    }

    /* Rendering */
    function tokenURI(
        uint256 tokenId
    ) public view override(ERC721Upgradeable) returns (string memory) {
        require(
            _exists(tokenId),
            "ERC721Metadata: URI query for nonexistent token"
        );

        if (bytes(baseURI).length == 0) {
            (uint256[] memory inkIds, uint256[] memory inkQtys) = InkUsed(
                _refInkUsed
            ).inkUsed(tokenId);

            Buffer.buffer memory attrs;
            attrs.init(8192);

            attrs.append(
                abi.encodePacked(
                    '{ "trait_type": "creator","value":"',
                    StringsUpgradeable.toHexString(creatorOf(tokenId)),
                    '"}'
                )
            );

            uint256 I = inkIds.length;
            for (uint i = 0; i < I; ) {
                attrs.append(",");
                string memory color = InkognitosInk(payable(_refInkContract))
                    .getTokenColor(inkIds[i]);
                attrs.append(
                    abi.encodePacked(
                        '{ "trait_type":"',
                        color,
                        '","value":',
                        (inkQtys[i]).toString(),
                        "}"
                    )
                );
                unchecked {
                    ++i;
                }
            }

            return
                string(
                    abi.encodePacked(
                        "data:application/json;base64,",
                        Base64.encode(
                            bytes(
                                abi.encodePacked(
                                    "{",
                                    '"name":"',
                                    TOKEN_NAME_PREFIX,
                                    tokenId.toString(),
                                    '",',
                                    '"image":"',
                                    tokenImageURL(tokenId),
                                    '",',
                                    '"external_url":"',
                                    _externalUrlPrefix,
                                    tokenId.toString(),
                                    '",',
                                    AUX_METADATA,
                                    '"attributes":[',
                                    string(attrs.buf),
                                    "]",
                                    "}"
                                )
                            )
                        )
                    )
                );
        } else {
            return string.concat(baseURI, tokenId.toString());
        }
    }

    // <baseImageURI><tokenId><baseImageURISuffix>
    function tokenImageURL(
        uint256 tokenId
    ) public view returns (string memory) {
        return
            string.concat(baseImageURI, tokenId.toString(), baseImageURISuffix);
    }

    function tokenHash(uint256 tokenId) public view returns (uint256) {
        return _tokens[tokenId].imageHash;
    }

    /* Validate PERMIT */
    function isValidPermit(
        SubmitPermit memory permit,
        bytes memory signature
    ) public view returns (bool) {
        require(_addrVerifier != address(0), "Verifier is not defined");

        bytes32 digest = _hashTypedDataV4(
            keccak256(
                abi.encode(
                    keccak256(
                        "SubmitPermit(address author,uint256 imageHash,uint256 timestamp,uint256[] inkIds,uint256[] inkQtys)"
                    ),
                    permit.author,
                    permit.imageHash,
                    permit.timestamp,
                    keccak256(abi.encodePacked(permit.inkIds)),
                    keccak256(abi.encodePacked(permit.inkQtys))
                )
            )
        );

        return
            SignatureCheckerUpgradeable.isValidSignatureNow(
                _addrVerifier,
                digest,
                signature
            );
    }

    // function mintSimple(SubmitPermit memory permit, bytes memory signature) public {
    //     require(_addrVerifier != address(0), "Undefined _addrVerifier.");
    //     require(_refSplitter != address(0), "Undefined _refSplitter.");
    //     require(_refInkContract != address(0), "Undefined _refInkContract.");
    //     require(_refPassContract != address(0), "Undefined _refPassContract.");
    //     require(mintPaused != true, "Minting is paused");

    //     /* Pass holder */
    //     require( INKStudioPass(payable(_refPassContract)).balanceOf(author) > 1, "No pass.");

    //     /* Permit holder */
    //     address author = _msgSender();
    //     require(
    //         permit.author == author,
    //         "Permit was signed for different author."
    //     );

    //     /* Unique hash */
    //     require(
    //         _usedHashes[permit.imageHash] != true,
    //         "Image hash must be unique."
    //     );
    //     /* Permit is fresh */
    //     require(permit.timestamp > block.timestamp, "Permit expired.");

    //     /* Valid permit */
    //     require(isValidPermit(permit, signature) == true, "Invalid signature.");

    //     /* Allocate tokenId */
    //     uint256 tokenId = _tokenIdCounter.current();
    //     _tokenIdCounter.increment();

    //     _publish(tokenId, author, permit.imageHash);
    // }

    /* Mint/Publish */
    function mint(SubmitPermit memory permit, bytes memory signature) public {
        /* Preflight */
        require(_addrVerifier != address(0), "Undefined _addrVerifier.");
        require(_refSplitter != address(0), "Undefined _refSplitter.");
        require(_refInkContract != address(0), "Undefined _refInkContract.");
        require(_refPassContract != address(0), "Undefined _refPassContract.");
        require(mintPaused != true, "Minting is paused");
        address author = _msgSender();

        /* Pass holder */
        bool passHolder = INKStudioPass(payable(_refPassContract)).balanceOf(
            author
        ) > 0;

        // require( !passHolder, "No pass.");

        /* Permit holder */
        require(
            permit.author == author,
            "Permit was signed for different author."
        );

        /* Unique hash */
        require(
            _usedHashes[permit.imageHash] != true,
            "Image hash must be unique."
        );

        /* Permit is fresh */
        require(permit.timestamp > block.timestamp, "Permit expired.");

        /* Valid permit */
        require(isValidPermit(permit, signature) == true, "Invalid signature.");

        /* Maxium number of tokens */
        require((totalSupply() + 1) < maxSupply, "Active token limit reached.");

        /* Allocate tokenId */
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();

        /* INK Sanity */
        uint256[] memory inkIds = permit.inkIds;
        uint256[] memory inkQtys = permit.inkQtys;

        require(
            inkIds.length == inkQtys.length,
            "inkIds and inkQtys must be the same length."
        );
        require(
            permit.inkIds.length <= maxInkPalette,
            "Using too many colors. See maxInkPalette()"
        );

        /* Send INK to vault */
        if (passHolder) {
            InkognitosInk(payable(_refInkContract)).ownerMint(
                _refInkUsed,
                inkIds,
                inkQtys
            );
        } else {
            /* Check INK Balance */
            uint256 I = inkIds.length;
            for (uint256 i = 0; i < I; ) {
                require(
                    InkognitosInk(payable(_refInkContract)).balanceOf(
                        author,
                        inkIds[i]
                    ) >= inkQtys[i],
                    "Insufficient INK."
                );
                unchecked {
                    ++i;
                }
            }
            InkognitosInk(payable(_refInkContract)).safeBatchTransferFrom(
                author,
                _refInkUsed,
                inkIds,
                inkQtys,
                ""
            );
        }
        InkUsed(_refInkUsed).store(tokenId, inkIds, inkQtys);
        _publish(tokenId, author, permit.imageHash);
    }

    function _publish(
        uint256 tokenId,
        address creator,
        uint256 imageHash
    ) internal {
        /* Allocate new tokenId */
        _tokens[tokenId].creator = creator;
        _tokens[tokenId].imageHash = imageHash;
        _usedHashes[imageHash] = true;
        _safeMint(creator, tokenId);

        // Provision royalty receiver
        if (_splitters[creator] == address(0)) {
            _createRoyaltyAccount(creator);
        }

        emit TokenPublished(creator, tokenId, imageHash);
    }

    function _createRoyaltyAccount(
        address author
    ) internal returns (address instance) {
        require(_royaltyFund != address(0), "Undefined _royaltyFund.");
        require(_refSplitter != address(0), "Undefined _refSplitter.");
        require(
            _splitters[author] == address(0),
            "User already has a publisher account."
        );
        require(author != address(0), "Invalid beneficiary.");
        address impl = _refSplitter;
        /// @solidity memory-safe-assembly
        assembly {
            let ptr := mload(0x40)
            mstore(
                ptr,
                0x3d602d80600a3d3981f3363d3d373d3d3d363d73000000000000000000000000
            )
            mstore(add(ptr, 0x14), shl(0x60, impl))
            mstore(
                add(ptr, 0x28),
                0x5af43d82803e903d91602b57fd5bf30000000000000000000000000000000000
            )
            instance := create(0, ptr, 0x37)
        }
        require(instance != address(0), "ERC1167: create failed");

        InkognitosRoyaltySplitter(payable(instance)).init(_royaltyFund, author);
        _splitters[author] = instance;
    }

    function _addTokenToCreatorEnumeration(
        address to,
        uint256 tokenId
    ) private {
        uint256 length = createdBy(to);
        _createdTokens[to][length] = tokenId;
        _createdTokensIndex[tokenId] = length;
        _createdByAddress[to] += 1;
    }

    function _removeTokenFromCreatorEnumeration(
        address from,
        uint256 tokenId
    ) private {
        uint256 lastTokenIndex = createdBy(from) - 1;
        uint256 tokenIndex = _createdTokensIndex[tokenId];

        if (tokenIndex != lastTokenIndex) {
            uint256 lastTokenId = _createdTokens[from][lastTokenIndex];

            _createdTokens[from][tokenIndex] = lastTokenId; // Move the last token to the slot of the to-delete token
            _createdTokensIndex[lastTokenId] = tokenIndex; // Update the moved token's index
        }
        delete _createdTokensIndex[tokenId];
        delete _createdTokens[from][lastTokenIndex];

        _createdByAddress[from] -= 1;
    }

    /* Tokens of Owner */
    function tokensOfOwner(
        address _owner
    ) public view returns (uint256[] memory tokens) {
        uint256 balance = balanceOf(_owner);
        tokens = new uint256[](balance);
        for (uint256 i = 0; i < balance; i++) {
            tokens[i] = tokenOfOwnerByIndex(_owner, i);
        }
    }

    /* Tokens of Creator */
    function tokensOfCreator(
        address _owner
    ) public view returns (uint256[] memory tokens) {
        uint256 balance = createdBy(_owner);
        tokens = new uint256[](balance);
        for (uint256 i = 0; i < balance; i++) {
            tokens[i] = _createdTokens[_owner][i];
        }
    }

    function creatorOf(uint256 tokenId) public view returns (address) {
        return _tokens[tokenId].creator;
    }

    /*
    -------------------------------------
    Administrative
    -------------------------------------
    */
    function set_contractURI(string memory val) public onlyOwner {
        // https://docs.opensea.io/docs/contract-level-metadata
        _contractURI = val;
    }

    /* Maximum number of tokens */
    function set_maxSupply(uint256 val) public onlyOwner {
        maxSupply = val;
    }

    /* Royalty =  */
    function set_feeNumerator(uint256 val) public onlyOwner {
        require(
            val < FEE_DENOMINATOR,
            "Numerator must be less than FEE_DENOMINATOR"
        );
        feeNumerator = val;
    }

    /* Set baseURI */
    function set_baseURI(string memory val) public onlyOwner {
        /* Will fallback to on-chain Base64-encoded JSON if baseURI is empty */
        baseURI = val;
    }

    /* Max number of ink ids per mint */
    function set_maxInkPalette(uint256 val) public onlyOwner {
        maxInkPalette = val;
    }

    function set_baseImageURI(
        string memory uri,
        string memory suffix
    ) public onlyOwner {
        baseImageURI = uri;
        baseImageURISuffix = suffix;
    }

    // function set_mintStartTime(uint256 _time) public onlyOwner {
    //     mintStartTime = _time;
    // }

    function withdrawTo(address to, uint256 amt) external onlyOwner {
        uint256 balance = address(this).balance;
        require(amt <= balance);
        (bool success, ) = to.call{value: amt}("");
        require(success, "Failed to transfer the funds, aborting.");
    }

    /*
    -------------------------------------
    Overrides
    -------------------------------------
    */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    )
        internal
        virtual
        override(ERC721Upgradeable, ERC721EnumerableUpgradeable)
    {
        super._beforeTokenTransfer(from, to, tokenId);

        if (from == address(0)) {
            _addTokenToCreatorEnumeration(to, tokenId);
        }
        if (to == address(0)) {
            _removeTokenFromCreatorEnumeration(from, tokenId);
        }
    }

    function supportsInterface(
        bytes4 interfaceId
    )
        public
        view
        override(
            ERC165StorageUpgradeable,
            ERC721Upgradeable,
            ERC721EnumerableUpgradeable
        )
        returns (bool)
    {
        return
            interfaceId == type(IERC2981Upgradeable).interfaceId ||
            super.supportsInterface(interfaceId);
    }

    receive() external payable {}
}
