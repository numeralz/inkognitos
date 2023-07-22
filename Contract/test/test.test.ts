/* eslint-disable no-underscore-dangle */

import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import "@nomiclabs/hardhat-waffle";
import { expect, use } from "chai";
import { chaiEthers } from "chai-ethers";
import chalk from "chalk";
import { solidity } from "ethereum-waffle";
import { BigNumber, utils } from "ethers";
import { formatEther, parseEther } from "ethers/lib/utils";
import hre, { ethers, getChainId, upgrades } from "hardhat";
// import MerkleTree from "merkletreejs";
import { getPermit } from "utils/utils";
import { InkognitosInk, InkognitosInk__factory, InkognitosNFT, InkognitosNFT__factory, InkognitosRoyaltySplitter, InkognitosRoyaltySplitter__factory, InkUsed } from "../typechain";
Error.stackTraceLimit = Infinity;

const keccak256 = ethers.utils.keccak256;

type BNMaybeArray = BigNumber | BigNumber[] | BNMaybeArray[];

export function $( n:BNMaybeArray ){
  if( Array.isArray( n ) ){
    return n.map( $ );
  }
  return n.toString();
}


use( chaiEthers );
use( solidity );


describe( "Tests", function () {
  let $ink: InkognitosInk;
  let $inkUsed: InkUsed;
  let $nft: InkognitosNFT;
  let $splitter: InkognitosRoyaltySplitter;

  let [
    owner,
    verifier,
    creator,
    buyer,
  ]: SignerWithAddress[
  ] = [];

  let signers: SignerWithAddress[] = [];

  describe( "InkognitosInk", function () {
    it( "Contract deployment", async function () {
      [
        owner,
        verifier,
        creator,
        buyer,
      ] = signers = await ethers.getSigners();

      console.log( [

        owner,
        verifier,
        creator,
        buyer,
      ].map( x => x.address ) );
      
      const ink_ = await (
        await upgrades.deployProxy(
          await ethers.getContractFactory( "InkognitosInk", owner ) as InkognitosInk__factory,
          [
            owner.address,
            "InkognitosInk",
            "INK",
            1654041600,
          ],
          {}
        )
      ).deployed() as InkognitosInk;

      $ink = <InkognitosInk>await ethers.getContractAt(
        "InkognitosInk",
        ink_.address
      );


      const nft_ = await (
        await upgrades.deployProxy(
          await ethers.getContractFactory( "InkognitosNFT", owner ) as InkognitosNFT__factory,
          [
            owner.address,
          ],
          {}
        )
      ).deployed() as InkognitosNFT;

      await hre.upgrades.forceImport( nft_.address, await ethers.getContractFactory( "InkognitosNFT", owner ) );
      $nft = <InkognitosNFT>await ethers.getContractAt(
        "InkognitosNFT",
        nft_.address
      );

      owner.provider.on;

      /* RoyaltySplitter */
      const _InkognitosRoyaltySplitter = await ( await ( await ethers.getContractFactory(
        "InkognitosRoyaltySplitter",
        owner
      ) as InkognitosRoyaltySplitter__factory ).deploy() ).deployed();

      $splitter = <InkognitosRoyaltySplitter>await ethers.getContractAt(
        "InkognitosRoyaltySplitter",
        _InkognitosRoyaltySplitter.address
      );
      
      const inkUsed_ = await (
        await upgrades.deployProxy(
          await ethers.getContractFactory( "InkUsed", owner ) as InkognitosNFT__factory,
          [
            owner.address,
            $nft.address,
          ],
          {}
        )
      ).deployed() as InkognitosNFT;

      $inkUsed = await ethers.getContractAt(
        "InkognitosInk",
        inkUsed_.address
      );

      await $ink.set_refFactoryContract( $nft.address );
      await $nft.set_refInkContract( $ink.address );
      await $nft.set_addrVerifier( verifier.address );
      await $nft.set_refSplitter( $splitter.address );
      await $nft.set_refInkUsed( $inkUsed.address );
      // await $inkUsed.set_refNftAddress( $nft.address );

      console.log( {
        $Ink     : $ink.address,
        $Factory : $nft.address,
        $Rx      : $nft.address,
      } );
    } );
    /* Interfaces */
    const _INTERFACE_ID_ERC1155 = 0xd9b67a26;
    const _INTERFACE_ID_ERC1155_METADATA_URI = 0x0e89341c;
    const _INTERFACE_ID_ERC721 = 0x80ac58cd;
    const _INTERFACE_ID_ERC721_METADATA = 0x5b5e139f;
    const _INTERFACE_ID_ERC721_ENUMERABLE = 0x780e9d63;
    const _INTERFACE_ID_ERC2981 = 0x2a55205a;
    
    it( "Contract interfaces", async function () {
      // const factories = [
      //   ERC721__factory,
      //   ERC721EnumerableUpgradeable__factory,
      //   ERC721BurnableUpgradeable__factory,
      //   OwnableUpgradeable__factory,
      // ];
      
      await Promise.all(
        [
          _INTERFACE_ID_ERC1155,
          _INTERFACE_ID_ERC1155_METADATA_URI,
        ].map(
          async ( id ) => {
            const ID = BigNumber.from( id ).toHexString();
            console.log( ID );
            return expect( await $ink.supportsInterface( ID ) ).to.equal( true );
          }
        )
      );
      await Promise.all(
        [
          _INTERFACE_ID_ERC721,
          _INTERFACE_ID_ERC721_METADATA,
          _INTERFACE_ID_ERC721_ENUMERABLE,
          _INTERFACE_ID_ERC2981,
        ].map(
          async ( id ) => {
            const ID = BigNumber.from( id ).toHexString();
            console.log( ID );
            return expect( await $nft.supportsInterface( ID ) ).to.equal( true );
          }
        )
      );
    } );

    const inks = [
      "000011",
      "000022",
      "000033",
      "000044",
      "000055",
    ];

    it( "Ink Tokens", async function () {
      for ( let i = 1; i <= inks.length; i++ ) {
        await $ink.connect( owner ).updateTokenMeta(
          BigNumber.from( `0x${ inks[i - 1] }` ),
          10000,
          ethers.utils.parseEther( "0.1" )
        );
          
        const tokenId = await $ink.getTokenId( i );

        expect(
          await $ink.getTokenColor( tokenId )
        ).to.equal(
          `#${ utils.hexZeroPad( tokenId.toHexString(), 12 ).slice( -6 ) }`
        );
      }
    } );

    it( "Mint Ink Tokens", async function () {
      const qty = 1000;
      // const qty =  BigNumber.from( 10 );
      for ( let i = 1; i <= inks.length; i++ ) {
        const tokenId = await $ink.getTokenId( i );

        expect(
          await $ink.balanceOf( creator.address, await $ink.getTokenId( tokenId ) )
        ).to.equal(
          0
        );

        await $ink
        .connect( creator )
        .mintMany(
          creator.address,
          [
            tokenId,
          ],
          [
            qty,
          ],
          { value : await $ink.mintPrice( tokenId, qty ), }
        );

        expect(
          await $ink.balanceOf( creator.address, tokenId )
        ).to.equal(
          qty
        );
      }
    } );

    it( "Transfer Ink", async function () {
      const qty = 10;
      for ( let i = 1; i <= inks.length; i++ ) {
        const tokenId = await $ink.getTokenId( i );
        const balance0 = await $ink.balanceOf( creator.address, tokenId );

        expect( balance0 ).to.be.gt( 0 );

        await $ink.connect( creator ).safeTransferFrom(
          creator.address,
          buyer.address,
          tokenId,
          qty,
          Uint8Array.from( [
            0,
          ] )
        );

        expect(
          await $ink.balanceOf( creator.address, tokenId )
        ).to.equal(
          ( balance0 ).sub( qty )
        );

        expect(
          await $ink.balanceOf( buyer.address, tokenId )
        ).to.equal(
          qty
        );
      }
    } );
  } );


  describe( "Factory", function () {
    it( "Contract Setup", async function () {
      const H = 6;
      const S = 3;
      const tokenId = 0;
      for ( let s = 0; s < S; s++ ) {
        const sat = s / ( S - 1 );

        for ( let h = 0; h < H; h++ ) {
          const _hue = h / H;
          const hue = 360 * _hue;

          const lum = s ? 0.5 : 1 - ( h / ( H - 1 ) );
          const color = hslToHex( hue, sat, lum );

          const price = parseEther( "0.01" ).mul( Math.pow( 1.5, s + 1 ) | 0 );
          const supply = BigNumber.from( 10000000 ).div( Math.pow( 2, s + 1 ) | 0 );
          console.log( [

            chalk.bgHsl( hue, 100 * sat, 100 * lum )
            .hsl( hue, 100 * sat, ( 100 * lum + 50 ) % 100 )( ` ${ String( color ) } ` ),
            `x ${ supply }`,
            formatEther( price ),
          ].join( " | " ) );

          await $ink.updateTokenMeta(
            color,
            supply,
            price
          );
        }
      }
    } );

    const OWNABLE_REASON = "Ownable: caller is not the owner";

    // it( "INK Owner-only Methods", async function () {
    //   // Ink
    //   await expect(
    //     $ink.connect( user1 ).withdrawTo( owner.address, ethers.utils.parseEther( "1" ) )
    //   ).to.be.revertedWith( OWNABLE_REASON );

    //   await expect(
    //     $ink.connect( user1 ).set_refFactoryContract( $ink.address )
    //   ).to.be.revertedWith( OWNABLE_REASON );

    //   await expect(
    //     $ink.connect( user1 ).updateTokenMeta(
    //       3,
    //       "0x112233",
    //       ethers.utils.parseEther( "0.1" ),
    //       10000
    //     )
    //   ).to.be.revertedWith( OWNABLE_REASON );
    // } );

    // it( "FACTORY Owner-only Methods", async function () {
    //   // Factory
    //   await expect(
    //     $nft.connect( user1 ).set_refInkContract( $ink.address )
    //   ).to.be.revertedWith( OWNABLE_REASON );

    //   await expect(
    //     $nft.connect( user1 ).set_addrVerifier( $ink.address )
    //   ).to.be.revertedWith( OWNABLE_REASON );

    //   await expect(
    //     $nft.connect( user1 ).set_baseImageURI( "fuck", "/image" )
    //   ).to.be.revertedWith( OWNABLE_REASON );

    //   await expect(
    //     $nft.connect( user1 ).set_mintStartTime( Math.round( Date.now() / 1000 ) )
    //   ).to.be.revertedWith( OWNABLE_REASON );

    //   await expect(
    //     $nft.connect( user1 ).withdrawTo( owner.address, ethers.utils.parseEther( "1" ) )
    //   ).to.be.revertedWith( OWNABLE_REASON );
    // } );


    /*
    -------------------------------------
    Whitelist
    -------------------------------------
    */
    // it( "Test whitelist", async function () {
    //   // const wlHashes = [
    //   //   user1.address, owner.address, verifier.address,
    //   // ].map( x => keccak256( x ) );

    //   // const tree = new MerkleTree( wlHashes, keccak256, {
    //   //   sortPairs : true,
    //   // } );
    //   // const root = Buffer.from( tree.getRoot() );

    //   // // Sanity
    //   // await $Ink.connect( owner ).updateWhitelist( root );
    //   const tree = await updateWhitelist( [
    //     user1.address, owner.address, verifier.address,
    //   ] );

    //   {
    //     const leaf = keccak256( user1.address );
    //     const proof = tree.getHexProof( leaf );
    //     expect( tree.verify( proof, leaf, tree.getRoot() ) ).to.be.true;
    //     expect( await $Ink.connect( user1 ).isWhitelisted( proof ) ).to.be.true;
    //   }
    //   {
    //     const leaf = keccak256( user2.address );
    //     const proof = tree.getHexProof( leaf );
    //     expect( tree.verify( proof, leaf, tree.getRoot() ) ).to.be.false;
    //     expect( await $Ink.connect( user2 ).isWhitelisted( proof ) ).to.be.false;
    //   }
    // } );

    // async function updateWhitelist( wallets: string[] ){
    //   const wlHashes = wallets.map( x => keccak256( x ) );

    //   const tree = new MerkleTree( wlHashes, keccak256, {
    //     sortPairs : true,
    //   } );
    //   const root = Buffer.from( tree.getRoot() );

    //   await $Ink.connect( owner ).updateWhitelist( root );
    //   return tree;
    // }


    // it( "getPermitSigner Sanity1", async function () {
    //   const {
    //     permit,
    //     signature,
    //   } = await getPermit( {
    //     author     : user1.address,
    //     verifier,
    //     contract   : $Factory,
    //     imageData  : "<svg>My awesome svg image</svg>",
    //     chainId    : ( await $Factory.getChainID() ).toString(),
    //     tokensUsed : {
    //       10 : 100,
    //       30 : 300,
    //     },
    //   } );
    //   expect( await $Factory.isValidPermit( permit, signature ) ).to.equal( true );
    // } );

    // it( "getPermitSigner Sanity2", async function () {
    //   const {
    //     permit,
    //     signature,
    //   } = await getPermit( {
    //     author     : user1.address,
    //     verifier   : user2,
    //     contract   : $Factory,
    //     imageData  : "<svg>My awesome svg image</svg>",
    //     chainId    : ( await $Factory.getChainID() ).toString(),
    //     tokensUsed : {
    //       10 : 100,
    //       30 : 300,
    //     },
    //   } );
    //   expect( await $Factory.isValidPermit( permit, signature ) ).to.equal( false );
    // } );


    let tokenData : {
      imageData: string,
      tokensUsed: {
        [tokenId: string]: number,
      }
    };

    it( "Obtain INK", async function () {
      tokenData = {
        imageData  : "<svg>My awesome svg image</svg>",
        tokensUsed : Object.fromEntries(
          await Promise.all( [
            1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
          ].map( async ( i ) => ( [
            ( await $ink.callStatic.getTokenId( i ) ).toString(),
            10,
          ] ) ) ) as [string, number][]
        ),
      };

      const ids = Object.keys( tokenData.tokensUsed );
      const qtys = Object.values( tokenData.tokensUsed );
      const qtys0: BigNumber[] = [];
      
      for( let i = 0; i < ids.length; i++ ){
        const tokenId = ids[ i ];
        const qty = qtys[ i ];
        qtys0[i] = await $ink.balanceOf( creator.address, tokenId );
      }

      await $ink.connect( creator ).mintMany(
        creator.address,
        ids,
        qtys,
        {
          value : await $ink.mintPriceMany( ids, qtys ),
        }
      );
      for( let i = 0; i < ids.length; i++ ){
        const tokenId = ids[ i ];
        const qty = qtys[ i ];
        expect( await $ink.balanceOf( creator.address, tokenId ) ).to.equal( qtys0[i].add( qty ) );
      }
    } );

    it( "Mint Factory Token", async function () {
      const author = creator;
      const numTokens = 3;

      for ( let i = 0; i < numTokens; i++ ) {
        const {
          permit,
          signature,
        } = await getPermit( {
          author    : author.address,
          verifier,
          contract  : $nft,
          chainId   : ( await getChainId() ).toString(),
          ...tokenData,
          imageData : `<svg>${ i }</svg>`,
        } );

        const balances = {};
        await Promise.all(
          Object.entries( tokenData.tokensUsed ).map( async ( [
            tokenId, qty,
          ] ) => {
            const balance = await $ink.balanceOf( author.address, tokenId );
            console.log( `Balance ${ tokenId }: ${ balance }` );
            balances[ tokenId ] = balance;
          } )
        );

        const totalSupply = await $nft.totalSupply();

        await expect(
          ( $nft.connect( author ).mint(
            permit,
            signature
          ) )
        ).to.emit( $nft, "TokenPublished" ).withArgs( author.address, totalSupply, permit.timestamp );

        await Promise.all(
          Object.entries( tokenData.tokensUsed ).map( async ( [
            tokenId, qty,
          ] ) => {
            const balance = await $ink.connect( author ).balanceOf( author.address, tokenId );
            console.log( `Balance ${ tokenId }: ${ balance }` );
            expect( balance ).to.lt( balances[ tokenId ] );
          } )
        );

        const myCreated = await $nft.tokensOfCreator( author.address );
        console.log( "myCreated", myCreated.map( x => `${ x }` ) );

        const myOwned = await $nft.tokensOfOwner( author.address );
        console.log( "myOwned", myOwned.map( x => `${ x }` ) );
      }
    } );

    it( "Royalty 10% of Sale Price", async function () {
      const salePrice = parseEther( "10" );

      /* Sell for 10 ETH */
      const tokenId = await $nft.tokenOfOwnerByIndex( creator.address, 0 );

      const [
        receiver,
        amount,
      ] = await $nft.royaltyInfo( tokenId, salePrice );
      console.log( `Receiver: ${ receiver } ${ formatEther( amount ) }` );

      await expect( amount ).to.equal( salePrice.div( 10 ) );
    } );

    it( "Token Owner Can Withhdraw", async function () {
      const salePrice = parseEther( "10" );
      const amountExpected = salePrice.div( 10 );
      const userAmountExpected = amountExpected.mul( 60 ).div( 100 );
      const tokenId = await $nft.tokenOfOwnerByIndex( creator.address, 0 );

      const [
        receiver,
        amount,
      ] = await $nft.royaltyInfo( tokenId, salePrice );
      
      const tokenOwner = await $nft.ownerOf( tokenId );
      
      console.log( {
        salePrice : salePrice.toString(),
        royalty   : salePrice.toString(),
        receiver  : receiver.toString(),
        amount    : amount.toString(),
      } );

      expect( tokenOwner ).to.equal( creator.address );

      expect( amount ).to.equal( amountExpected );

      const splitterBalance0 = await ethers.provider.getBalance( receiver );

      await ( await owner.sendTransaction( {
        to       : receiver,
        value    : amount,
        gasLimit : 50000,
      } ) ).wait();

      expect( ( await ethers.provider.getBalance( receiver ) ).sub( splitterBalance0 ) ).to.equal( amount );


      const balance0 = await creator.getBalance();
      await $splitter.attach( receiver )["release(address)"]( creator.address );

      expect( ( await creator.getBalance() ).sub( balance0 ) ).to.equal( userAmountExpected );
    } );

    // it( "Contracts can be upgraded", async function(){
    //   const impl0 = await upgrades.erc1967.getImplementationAddress( $nft.address );

    //   const up = await upgrades.upgradeProxy(
    //     $nft,
    //     await ethers.getContractFactory( "InkognitosNFT_V2", owner )
    //   );
    //   const impl1 = await upgrades.erc1967.getImplementationAddress( $nft.address );

    //   console.log( {
    //     impl0,
    //     impl1,
    //   } );
      
    //   expect ( impl1 ).to.not.equal( impl0 );
    // } );
    
    
    it( "Burn", async function(){
      const ownedTokens0 = await $nft.tokensOfOwner( creator.address );
      const createdTokens0 = await $nft.tokensOfCreator( creator.address );

      // console.log( { ownedTokens, createdTokens, } );

      const tokenId = ownedTokens0[0];

      try{
        await ( await $nft.connect( creator ).burn( tokenId, {
          gasLimit : 550000,
        } ) ).wait();
      }catch( err ){
        console.log(
          err
        );
      }
      
      const ownedTokens1 = await $nft.tokensOfOwner( creator.address );
      const createdTokens1 = await $nft.tokensOfCreator( creator.address );

      console.log( { owned : $( [
        ownedTokens0, ownedTokens1,
      ] ),
      created : $( [
        createdTokens0, createdTokens1,
      ] ), } );
      

      // expect( await $nft.ownerOf( tokenId ) ).to.equal( ethers.constants.AddressZero );
    } );


    // /* Balances after */

    // /* Attempt withdrawal */
    // HEADER("Attempt withdrawal");

    // it("Royalty Withdrawal", async function () {

    //   await $RxUser1.withdrawTo(user1.address, 0);
    //   console.table({
    //     userBalance: formatEther(await .userBalance()),
    //     totalBalance: formatEther(await .totalBalance()),
    //     user1: formatEther(await user1.getBalance()),
    //   });

    //   await expect(
    //     $RxUser1.withdrawTo(user1.address, parseEther("0.5"))
    //   ).to.revertedWith("Amount exceeds balance");

    //   console.table({
    //     userBalance: formatEther(await $RxOwner.userBalance()),
    //     totalBalance: formatEther(await $RxOwner.totalBalance()),
    //     user1: formatEther(await user1.getBalance()),
    //   });


    //   await $RxOwner.withdrawTo(owner.address, parseEther("0.4"));

    //   console.table({
    //     userBalance: formatEther(await $RxOwner.userBalance()),
    //     totalBalance: formatEther(await $RxOwner.totalBalance()),
    //     user1: formatEther(await user1.getBalance()),
    //   });
    // });

    // it( "Transfer", async function () {
    //   const user1Bal0 = await $Factory.balanceOf( user1.address );
    //   const user2Bal0 = await $Factory.balanceOf( user2.address );

    //   await $Factory.connect( user1 ).transferFrom(
    //     user1.address,
    //     user2.address,
    //     0
    //   );
    //   const user1Bal1 = await $Factory.balanceOf( user1.address );
    //   const user2Bal1 = await $Factory.balanceOf( user2.address );

    //   expect( user1Bal1 ).to.eq( user1Bal0.add( -1 ) );
    //   expect( user2Bal1 ).to.eq( user2Bal0.add( 1 ) );
    // } );
  } );
} );


function hslToHex( h: number, s: number, l: number ) {
  const a = s * Math.min( l, 1 - l );
  const f = n => {
    const k = ( n + h / 30 ) % 12;
    const color = l - a * Math.max( Math.min( k - 3, 9 - k, 1 ), -1 );
    return Math.round( 255 * color ).toString( 16 ).padStart( 2, "0" );
  };
  return `0x${ f( 0 ) }${ f( 8 ) }${ f( 4 ) }`;
}
