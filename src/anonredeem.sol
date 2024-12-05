// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "./NFT.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {JwtProof} from "../lib/jwt-tx-builder/packages/contracts/src/interfaces/IVerifier.sol";
import {JwtVerifier} from "../lib/jwt-tx-builder/packages/contracts/src/utils/JwtVerifier.sol";

contract NFTRedeemer is Ownable {
    NFT public nftContract;
    IERC20 public erc20Token;
    JwtVerifier public jwtVerifier;

    // Array to keep track of available token IDs for redemption
    uint256[] private availableTokenIds;

    // Mapping to check if a token ID is available for redemption
    mapping(uint256 => bool) private isTokenAvailable;

    event Redeemed(address redeemer, uint256 tokenId, NFT.TokenType tokenType, string content);
    event NFTAdded(uint256 tokenId);
    event NFTRemoved(uint256 tokenId);

    constructor(address _nftAddress, address _jwtVerifier) {
        nftContract = NFT(_nftAddress);
        erc20Token = IERC20(_erc20Address);
        jwtVerifier = JwtVerifier(_jwtVerifier);
    }

    // Owner can add NFTs to the list of redeemable tokens
    function addNFT(uint256 tokenId) public onlyOwner {
        require(nftContract.ownerOf(tokenId) == address(this));
        require(!isTokenAvailable[tokenId], "Token already available");
        availableTokenIds.push(tokenId);
        isTokenAvailable[tokenId] = true;
        emit NFTAdded(tokenId);
    }

    // Function to redeem an NFT without specifying the tokenId
    function redeemNFT(string memory content, JwtProof memory proof) public {
        require(erc20Token.balanceOf(msg.sender) > 5000 * 10**18, "Insufficient $ANON balance");

        require(availableTokenIds.length > 0, "No NFTs available for redemption");

        require(jwtVerifier.verifyJwtProof(proof), "Invalid JWT proof");

        // Select the first available token ID for redemption
        uint256 tokenId = availableTokenIds[availableTokenIds.length - 1];

        // Call the redeem function on the NFT contract
        nftContract.redeem(tokenId, content, NFT.TWEET);

        // Remove the token from the available list
        availableTokenIds.pop();
        isTokenAvailable[tokenId] = false;

        // Emit an event for successful redemption
        emit Redeemed(msg.sender, tokenId, tokenType, content);
    }

    // Utility function to get the count of available NFTs
    function availableNFTCount() public view returns (uint256) {
        return availableTokenIds.length;
    }
}