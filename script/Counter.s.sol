// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";

contract AnonRedeemScript is Script {
    function setUp() public {}

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address owner = 0x36e7Fda8CC503D5Ec7729A42eb86EF02Af315Bf9;
        // Assuming you have the NFT contract and ERC20 token addresses
        address nftAddress = 0xAA875A983746F2A5e9F7ECcDC1BC988Ca7cE4035;
        address erc20Address = 0x0Db510e79909666d6dEc7f5e49370838c16D950f;

        vm.startBroadcast(deployerPrivateKey);

        // Deploy the NFTRedeemer contract with the NFT and ERC20 token addresses
        NFTRedeemer redeemer = new NFTRedeemer(nftAddress, erc20Address);

        vm.stopBroadcast();
    }
}
