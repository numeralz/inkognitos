// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

// import "@openzeppelin/contracts-upgradeable/access/AccessControlEnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/finance/PaymentSplitterUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/extensions/ERC1155BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/extensions/ERC1155SupplyUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/utils/ERC1155ReceiverUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/Base64Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/cryptography/MerkleProofUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/introspection/ERC165StorageUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/StringsUpgradeable.sol";

import "./RenderInk.sol";

/* InkCollection */
contract InkognitosInk is
    Initializable,
    ERC165StorageUpgradeable,
    ERC1155Upgradeable,
    OwnableUpgradeable,
    ERC1155BurnableUpgradeable,
    ERC1155SupplyUpgradeable,
    RenderInk
{
    /* Libs */
    using Strings for uint256;

    /* State */
    bool public salePaused;
    uint256 public mintMaxCount;
    uint256 public maxMintPerWallet;
    string public name;
    string public symbol;
    uint256 public numColors;
    string private _contractURI;

    /*
    -------------------------------------
    Structs
    -------------------------------------
    */

    /* Ink Metadata */
    struct InkMeta {
        uint256 index; /* Starts at 1, index>0 == exists */
        uint256 maxSupply;
        uint256 price;
    }

    // _tokens[tokenId] = InkMeta
    mapping(uint256 => InkMeta) private _tokens;

    // _tokensIndex[i] = tokenId
    mapping(uint256 => uint256) private _tokensIndex;

    /* Ref Contracts */
    address _refFactoryContract;

    /* ----------------------------------------------------------- */
    function initialize(
        address _owner,
        string memory _name,
        string memory _symbol
    ) public initializer {
        __ERC1155_init("");
        _transferOwnership(_owner);

        /* Initial values */
        salePaused = false;
        name = _name;
        symbol = _symbol;
        mintMaxCount = 1000;
        maxMintPerWallet = 1000000;
        _contractURI = 'data:application/json,{"name":"InkognitosINK","description":"Community-driven%20NFT%20art%20factory.","external_link":"https://inkognitos.decentfactory.xyz"}';
    }

    function initialize2(
        string memory _name,
        string memory _symbol
    ) public reinitializer(2) {
        name = _name;
        symbol = _symbol;
    }

    /*
    -------------------------------------
    Administrative
    -------------------------------------
    */
    function setURI(string memory newuri) public onlyOwner {
        _setURI(newuri);
    }

    function setName(string memory _name, string memory _symbol) public onlyOwner {
        name = _name;
        symbol = _symbol;
    }

    /* Update Metadata */
    function updateTokenMeta(
        uint256 tokenId,
        uint256 _supply,
        uint256 _price
    ) public onlyOwner {
        _updateTokenMeta(tokenId, _supply, _price);
    }

    /* Withdraw */
    function withdrawTo(address to, uint256 amt) external onlyOwner {
        (bool success, ) = to.call{value: amt}("");
        require(success, "Failed to transfer the funds, aborting.");
    }

    function set_refFactoryContract(address _ref) public onlyOwner {
        _refFactoryContract = _ref;
    }

    function togglePaused() public onlyOwner returns (bool) {
        return salePaused = !salePaused;
    }

    function setLimits(uint256 maxMintPerWallet_, uint256 mintMaxCount_)
        public
        onlyOwner
    {
        maxMintPerWallet = maxMintPerWallet_;
        mintMaxCount = mintMaxCount_;
    }

    /* index -> tokenId */
    function getTokenId(uint256 index /* start at 1 */) public view returns (uint256) {
        require(index > 0, "index must be greater than 0");
        return _tokensIndex[index];
    }

    function indexOf(uint256 tokenId) public view returns (uint256) {
        return _tokens[tokenId].index;
    }

    function getTokenColor(uint256 _tokenId)
        public
        view
        virtual
        returns (string memory)
    {
        require(exists(_tokenId), "Ink Color does not exist");
        return toColor(_tokenId);
    }

    /* API Helper */
    function batchTokenInfo()
        public
        view
        returns (
            uint256[] memory ids,
            string[] memory colors,
            uint256[] memory prices,
            uint256[] memory maxSupplies,
            uint256[] memory totalSupplies
        )
    {
        ids = new uint256[](numColors);
        colors = new string[](numColors);
        prices = new uint256[](numColors);
        maxSupplies = new uint256[](numColors);
        totalSupplies = new uint256[](numColors);

        for (uint256 i = 0; i < numColors; i++) {
            uint256 tokenId = _tokensIndex[i + 1];
            ids[i] = tokenId;
            colors[i] = toColor(tokenId);
            prices[i] = _tokens[tokenId].price;
            maxSupplies[i] = _tokens[tokenId].maxSupply;
            totalSupplies[i] = totalSupply(tokenId);
        }
    }

    function exists(uint256 tokenId) public view override returns (bool) {
        require(tokenId <= 0xFFFFFF, "TokenId exceeds 0xFFFFFF");
        return _tokens[tokenId].index > 0;
    }

    /*
    -------------------------------------
    Token Price
    -------------------------------------
    */
    function mintPrice(uint256 _tokenId, uint256 qty)
        public
        view
        returns (uint256)
    {
        require(exists(_tokenId), "Token does not exist");
        return _tokens[_tokenId].price * qty;
    }

    function mintPriceMany(uint256[] memory inkIds, uint256[] memory inkQtys)
        public
        view
        returns (uint256 total)
    {
        require(
            inkIds.length == inkQtys.length,
            "inkIds and inkQtys must be the same length"
        );
        uint256 I = inkIds.length;
        for (uint256 i = 0; i < I;) {
            total += mintPrice(inkIds[i], inkQtys[i]);
            unchecked { ++i; }
        }
    }

    function maxSupply(uint256 _id) public view virtual returns (uint256) {
        return _tokens[_id].maxSupply;
    }

    /* Sum of all balances */
    function totalBalanceOf(address user)
        public
        view
        returns (uint256 totalBalance)
    {
        for (uint256 i = 0; i < numColors; i++) {
            totalBalance += balanceOf(user, i);
        }
    }

    /* Special */
    function ownerMint(
        address user,
        uint256[] memory tokenIds,
        uint256[] memory counts
    ) public {
        require( _msgSender() == owner() || _msgSender() == _refFactoryContract, "Unauthorized");
        _mintBatch(user, tokenIds, counts, "");
    }

    /* Mint Many */
    function mintMany(
        address user,
        uint256[] memory tokenIds,
        uint256[] memory counts
    ) public payable {
        require(!salePaused, "Sale is salePaused()");

        uint256 tokenId;
        uint256 qty;
        for (uint256 i = 0; i < tokenIds.length; i++) {
            tokenId = tokenIds[i];
            qty = counts[i];

            require(
                (qty + totalSupply(tokenId)) <= maxSupply(tokenId),
                "Exceeds maxSupply"
            );
        }

        /* Payment */
        require(
            mintPriceMany(tokenIds, counts) == msg.value,
            "Payment must match mintPriceMany(tokenIds,counts)"
        );

        /* Per-wallet limit */
        require(
            (sumOf(counts) + totalBalanceOf(user)) <= maxMintPerWallet,
            "totalBalanceOf(you) cannot exceed maxMintPerWallet()"
        );

        _mintBatch(user, tokenIds, counts, "");
    }

    function tokenURI(uint256 _tokenId) public view returns (string memory) {
        string memory color = getTokenColor(_tokenId);
        return renderTokenURI(_tokenId, color);
    }

    /**
     * @dev See {IERC1155-isApprovedForAll}.
     */
    function isApprovedForAll(address _owner, address operator)
        public
        view
        override(ERC1155Upgradeable)
        returns (bool)
    {
        // Allow NFT Contract to move tokens
        if (operator == _refFactoryContract) return true;
        return super.isApprovedForAll(_owner, operator);
    }

    function set_contractURI(string memory val) public onlyOwner {
        // https://docs.opensea.io/docs/contract-level-metadata
        _contractURI = val;
    }

    /* Opensea Contract Info */
    function contractURI() public view returns (string memory) {
        return _contractURI;
    }

    function _updateTokenMeta(
        uint256 tokenId,
        uint256 _supply,
        uint256 _price
    ) internal {
        if (_tokens[tokenId].index == 0) {
            numColors = numColors + 1;
            _tokensIndex[numColors] = tokenId;
            _tokens[tokenId].index = numColors;
        }

        _tokens[tokenId].price = _price;
        _tokens[tokenId].maxSupply = _supply;
    }

    /* ERC1155 token uri */
    function uri(uint256 id_)
        public
        view
        virtual
        override(ERC1155Upgradeable)
        returns (string memory)
    {
        return tokenURI(id_);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC165StorageUpgradeable, ERC1155Upgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal virtual override(ERC1155SupplyUpgradeable, ERC1155Upgradeable) {
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
    }

    /*
    -------------------------------------
    Utilities
    -------------------------------------
    */
    function sumOf(uint256[] memory values) public pure returns (uint256 sum) {
        for (uint256 i = 0; i < values.length; i++) {
            sum += values[i];
        }
    }

    /* Fallback rx */
    receive() external payable {}

}
