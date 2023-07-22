// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

// @openzeppelin
// Ownable
import "@openzeppelin/contracts/access/Ownable.sol";

//ERC1155Holder
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol";
import "@openzeppelin/contracts/utils/cryptography/draft-EIP712.sol";

import "./InkognitosInk.sol";

contract Airdrop is Ownable, ERC1155Holder, EIP712 {

    address public _refInkContract;
    address public _addrVerifier;

    mapping(address => bool) private _claimed;

    struct ClaimPermit {
        address user;
        uint256 blockLimit;
        uint256[] inkIds;
        uint256[] inkQtys;
    }

    event Claimed(address user, uint256[] inkIds, uint256[] inkQtys);

    constructor() EIP712("Airdrop", "1") {

    }

    function claimAirdrop(ClaimPermit memory permit, bytes memory signature) public {
        require(
          _addrVerifier != address(0),
          "No verifier"
        );

        require(
          hasClaimed(_msgSender()) != true,
          "You have already claimed your airdrop."
        );

        require(
          isValidPermit(permit, signature, _addrVerifier) == true,
          "Invalid permit."
        );
        
        require(
          permit.user == _msgSender(),
          "You are not the owner of this permit."
        );

        require(
          block.number <= permit.blockLimit,
          "Permit expired."
        );


        // Transfer tokens
        InkognitosInk(payable(_refInkContract)).safeBatchTransferFrom(
            address(this),
            _msgSender(),
            permit.inkIds,
            permit.inkQtys,
            ""
        );

        // Mark as claimed
        _claimed[_msgSender()] = true;

        emit Claimed(_msgSender(), permit.inkIds, permit.inkQtys);
    }

    /* Balance available for airdrop */
    function inkBalance(uint256 tokenId) public view returns (uint256) {
        return InkognitosInk( payable(_refInkContract) ).balanceOf( address(this), tokenId );
    }

    /* User has claimed */
    function hasClaimed(address user) public view returns (bool) {
      return _claimed[user];
    }

    /* Validate request */
    function isValidPermit(ClaimPermit memory permit, bytes memory signature, address verifier)
      public
      view
      returns (bool)
    {
        // https://docs.openzeppelin.com/contracts/4.x/api/utils#EIP712-_hashTypedDataV4-bytes32-
        bytes32 digest = _hashTypedDataV4(
            keccak256(
                abi.encode(
                    keccak256(
                        "ClaimPermit(address user,uint256 blockLimit,uint256[] inkIds,uint256[] inkQtys)"
                    ),
                    permit.user,
                    permit.blockLimit,
                    keccak256(abi.encodePacked(permit.inkIds)),
                    keccak256(abi.encodePacked(permit.inkQtys))
                )
            )
        );

        // https://docs.openzeppelin.com/contracts/4.x/api/utils#SignatureChecker-isValidSignatureNow-address-bytes32-bytes-
        return SignatureChecker.isValidSignatureNow(
          verifier,
          digest,
          signature
        );
    }

    /* Admin */
    function set_refInkContract(address _ref) public onlyOwner {
        _refInkContract = _ref;
    }

    function set_addrVerifier(address _ref) public onlyOwner {
        _addrVerifier = _ref;
    }

}
