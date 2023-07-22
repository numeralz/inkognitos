// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";

contract RenderInk{
    /* Libs */
    using Strings for uint256;

    /* Token image */
    string public constant header =
        '<svg id="svg" width="100%" height="100%" version="1.1" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">';

    string public constant footer = "</svg>";

    function getSVG(string memory color) public pure returns (string memory) {
        return
            string(
                abi.encodePacked(
                    header,
                    "<circle cx='32' cy='32' r='24' strokeWidth='4px' stroke='#000' fill='",
                    color,
                    "'/>",
                    footer
                )
            );
    }

    /* Uint 0xRRGGBB code to #RRGGBB hex string */
    function toColor(uint256 i) public pure returns (string memory) {
        if (i == 0) return "#000000";
        uint256 j = i;
        uint256 length;
        while (j != 0) {
            length++;
            j = j >> 4;
        }
        uint256 mask = 15;
        uint256 k = 7;
        bytes memory bstr = new bytes(k);
        while (i != 0) {
            uint256 curr = (i & mask);
            bstr[--k] = curr > 9
                ? bytes1(uint8(55 + curr))
                : bytes1(uint8(48 + curr)); // 55 = 65 - 10
            i = i >> 4;
        }
        while (k != 0) {
            bstr[--k] = "0";
        }
        bstr[0] = "#";
        return string(bstr);
    }

    function renderTokenURI(uint256 tokenId, string memory colorString)
        public
        pure
        returns (string memory)
    {
        return
            string(
                abi.encodePacked(
                    "data:application/json;base64,",
                    Base64.encode(
                        bytes(
                            abi.encodePacked(
                                '{"name":"INK',
                                colorString,
                                '","description":"A pigment used to draw INKOGNITOS NFTs.","image":"data:image/svg+xml;base64,',
                                Base64.encode(bytes(getSVG(colorString))),
                                '","attributes":{"color":"',
                                colorString,
                                '"}}'
                            )
                        )
                    )
                )
            );
    }
}
