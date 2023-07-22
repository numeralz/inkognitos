
// import { BigNumber } from "@ethersproject/bignumber";
// import { formatEther } from "@ethersproject/units";
// import { expect, use } from "chai";
// import { chaiEthers } from "chai-ethers";
// import { solidity } from "ethereum-waffle";
// import { parseEther } from "ethers/lib/utils";
// import { ethers } from "hardhat";
// // import { beforeEach, describe, it } from "mocha";

// use( chaiEthers );
// use( solidity );

// const NAME = "HelloWorld";
// const SYMBOL = "HEWO";
// const BASEIMAGEURI = "https://example.com/";

// const getAdmin = ()=>ethers.provider.getSigner( 0 );
// const getUser = ( n = 0 )=>ethers.provider.getSigner( 1 + n );


// describe(
//   "Tests",
//   function(){
//     let nft:FoundersCollection;
//     before( async () => {
//       nft = await (
//         await new FoundersCollection__factory().connect( getAdmin() ).deploy()
//       ).deployed();
//     } );

//     this;
//     describe(
//       "Mint price",
//       function () {
//         for( let qty = 0; qty < 10; qty++ ){
//           it(
//             `mintPrice(${ qty }) == ${ formatEther( parseEther( "0.2" ).mul( qty ) ) }`,
//             async ()=>{
//               const $nft = nft.connect( getAdmin() );
      
//               expect(
//                 await nft.callStatic.mintPrice( qty )
//               ).to.equal(
//                 parseEther( "0.2" ).mul( qty )
//               );
//             }
//           );
//         }
//       }
//     );

//     describe(
//       "Basics",
//       function () {
//         let nft:FoundersCollection;
//         before( async () => {
//           nft = await (
//             await new FoundersCollection__factory().connect( getAdmin() ).deploy()
//           ).deployed();
//         } );
        
//         it( `Should be deployed`, async ()=>{
//           expect(
//             nft.address || null
//           ).not.be.null;
//         } );

//         it(
//           `Owner`,
//           async ()=>{
//             expect(
//               await nft.callStatic.owner()
//             ).to.equal(
//               await getAdmin().getAddress()
//             );
//           }
//         );

//         it(
//           `Name == ${ NAME }`,
//           async ()=>{
//             expect(
//               ( await nft.callStatic.name() ).toString()
//             ).to.equal(
//               NAME
//             );
//           }
//         );

//         it(
//           `Symbol == ${ SYMBOL }`,
//           async ()=>{
//             expect(
//               ( await nft.callStatic.symbol() ).toString()
//             ).to.equal(
//               SYMBOL
//             );
//           }
//         );
//       }
//     );
  
//     describe(
//       "Basics",
//       function () {
//         let nft:FoundersCollection;
//         beforeEach( async () => {
//           nft = await (
//             await new FoundersCollection__factory().connect( getAdmin() ).deploy()
//           ).deployed();
//         } );

//         it(
//           `Admin can mint`,
//           async ()=>{
//             let totalSupply = await nft.callStatic.totalSupply();

//             const qty = 1;
//             await nft.connect( getAdmin() ).mint( qty, {
//               value : await nft.callStatic.mintPrice( qty ),
//             } );
//             totalSupply = totalSupply.add( qty );
            
//             expect(
//               ( await nft.callStatic.totalSupply() ).toString()
//             ).to.equal(
//               totalSupply.toString()
//             );
//           }
//         );

//         it(
//           `User can not mint before public sale`,
//           async ()=>{
//             const totalSupply = await nft.callStatic.totalSupply();
      
//             try{
//               const qty = 1;
//               await nft.connect( getUser() ).mint(
//                 qty,
//                 {
//                   value : await nft.callStatic.mintPrice( qty ),
//                 }
//               );
//             } catch( err ){/*  */}

//             expect(
//               ( await nft.callStatic.totalSupply() ).toString()
//             ).to.equal(
//               totalSupply.toString()
//             );
//           }
//         );

//         it(
//           `User mint after sale open`,
//           async ()=>{
//             let totalSupply = await nft.callStatic.totalSupply();

//             /* start sale */
//             await nft.connect( getAdmin() ).setPaused( false );
//             await nft.connect( getAdmin() ).setTimeMint( Math.floor( Date.now() / 1000 ) );

//             /* mint tokens */
//             const qty = 1;
//             totalSupply = totalSupply.add( qty );
//             await nft.connect( getUser() ).mint( qty, {
//               value : await nft.callStatic.mintPrice( qty ),
//             } );

//             expect(
//               ( await nft.callStatic.totalSupply() ).toString()
//             ).to.equal(
//               totalSupply.toString()
//             );
//           }
//         );

//         it( `Should return tokens of owner`, async ()=>{
//           await nft.connect( getAdmin() ).setPaused( false );
//           await nft.connect( getAdmin() ).setTimeMint( Math.floor( Date.now() / 1000 ) );
          
//           const qty = await nft.callStatic.mintQtyMax();
//           await nft.connect( getUser() ).mint( qty, {
//             value : await nft.callStatic.mintPrice( qty ),
//           } );

//           const tokens = await nft.callStatic.tokensOfOwner( await getUser().getAddress() );

//           expect(
//             tokens.length
//           ).to.equal(
//             await nft.callStatic.balanceOf( await getUser().getAddress() )
//           );
//         } );

//         it(
//           `Should set baseURI: ${ BASEIMAGEURI }`,
//           async ()=>{
//             await nft.connect( getAdmin() ).setBaseImageURI( BASEIMAGEURI );
    
//             expect(
//               await nft.callStatic.baseImageURI()
//             ).to.equal(
//               BASEIMAGEURI
//             );
//           }
//         );
//       }
//     );
  
//     describe(
//       "ERC-721",
//       function () {
//         // balanceOf
//         it(
//           `Test: balanceOf`,
//           async ()=>{
//             await nft.connect( getAdmin() ).setPaused( false );
//             await nft.connect( getAdmin() ).setTimeMint( Math.floor( Date.now() / 1000 ) );

//             /* Mint tokens */
//             const qty = 3;
//             await nft.connect( getUser( 3 ) ).mint( qty, {
//               value : await nft.callStatic.mintPrice( qty ),
//             } );

//             expect(
//               (
//                 await nft.callStatic.balanceOf(
//                   await getUser( 3 ).getAddress()
//                 )
//               ).toString()
//             ).to.equal(
//               BigNumber.from( qty ).toString()
//             );
//           }
//         );
//         // ownerOf
//         it(
//           `Test: ownerOf`,
//           async ()=>{
//             const totalSupply = await nft.callStatic.totalSupply();

//             const qty = 3;
//             await nft.connect( getUser( 0 ) ).mint( qty, {
//               value : await nft.callStatic.mintPrice( qty ),
//             } );
            
            
//             expect(
//               await nft.callStatic.ownerOf( totalSupply )
//             ).to.equal(
//               await getUser( 0 ).getAddress()
//             );
//           }
//         );
        
//         // safeTransferFrom
//         it(
//           `Test: safeTransferFrom`,
//           async ()=>{
//             /* user0 mint */
//             const qty = 1;
//             await nft.connect( getUser( 0 ) ).mint( qty, {
//               value : await nft.callStatic.mintPrice( qty ),
//             } );

//             const tokenId = await nft.callStatic.tokenOfOwnerByIndex(
//               await getUser( 0 ).getAddress(),
//               0
//             );
            
//             /* user0 transfer token to user1 */
//             await nft.connect( getUser( 0 ) )["safeTransferFrom(address,address,uint256)"](
//               await getUser( 0 ).getAddress(),
//               await getUser( 1 ).getAddress(),
//               tokenId
//             );

//             /* check owner */
//             expect(
//               await nft.callStatic.ownerOf( tokenId )
//             ).to.equal(
//               await getUser( 1 ).getAddress()
//             );
//           }
//         );
//         // approve
//         it(
//           `Test: approve`,
//           async ()=>{
//             /* mint 1 */
//             const qty = 1;
//             await nft.connect( getUser( 0 ) ).mint( qty, {
//               value : await nft.callStatic.mintPrice( qty ),
//             } );
            
//             /* find first token */
//             const tokenId = await nft.callStatic.tokenOfOwnerByIndex(
//               await getUser( 0 ).getAddress(),
//               0
//             );
            
//             /* approve user1 */
//             await nft.connect( getUser( 0 ) ).approve(
//               await getUser( 1 ).getAddress(),
//               tokenId
//             );
            
//             /* check approval */
//             expect(
//               await nft.callStatic.getApproved( tokenId )
//             ).to.equal(
//               await getUser( 1 ).getAddress()
//             );
//           }
//         );
//         // setApprovalForAll
//         it(
//           `Test: setApprovalForAll`,
//           async ()=>{
//             /* user0 mint tokens */
//             const qty = 4;
//             await nft.connect( getUser( 0 ) ).mint( qty, {
//               value : await nft.callStatic.mintPrice( qty ),
//             } );

//             const tokenId = await nft.callStatic.tokenOfOwnerByIndex(
//               await getUser( 0 ).getAddress(),
//               0
//             );

//             /* user0 approve user2 */
//             await nft.connect( getUser( 0 ) ).setApprovalForAll(
//               await getUser( 2 ).getAddress(),
//               true
//             );
            
//             /* check approval */
//             expect(
//               await nft.callStatic.isApprovedForAll(
//                 await getUser( 0 ).getAddress(),
//                 await getUser( 2 ).getAddress()
//               )
//             ).to.equal(
//               true
//             );

//             /* user2 transfer */
//             await nft.connect( getUser( 2 ) )["safeTransferFrom(address,address,uint256)"](
//               await getUser( 0 ).getAddress(),
//               await getUser( 2 ).getAddress(),
//               tokenId
//             );
            
//             /* Owner */
//             expect(
//               await nft.callStatic.ownerOf( tokenId )
//             ).to.equal(
//               await getUser( 2 ).getAddress()
//             );
//           }
//         );
        
//         // supportsInterface
//         it(
//           `Test: supportsInterface`,
//           async ()=>{
//             await nft.callStatic.supportsInterface( "0x2a55205a" );
//           }
//         );
    
//         // burn
//         it(
//           `Test: burn`,
//           async ()=>{
//             const qty = 1;

//             await nft.connect( getUser( 0 ) ).mint( qty, {
//               value : await nft.callStatic.mintPrice( qty ),
//             } );

//             const totalSupply = await nft.callStatic.totalSupply();

//             const tokenId = await nft.callStatic.tokenOfOwnerByIndex(
//               await getUser( 0 ).getAddress(),
//               0
//             );

//             await nft.connect( getUser( 0 ) ).burn( tokenId );
            
//             expect(
//               await nft.callStatic.totalSupply()
//             ).to.equal(
//               totalSupply.sub( 1 )
//             );
            
//             let owner = null;
//             try {
//               owner = await nft.callStatic.ownerOf( tokenId );
//             } catch ( error ) {
//               // console.log( error );
//             }

//             expect(
//               owner
//             ).to.be.null;
//           }
//         );
//       }
//     );
  
//     /*
//     -------------------------------------
//     TokenURI
//     -------------------------------------
//     */
//     describe(
//       `TokenURI`,
//       function(){
//         let metadata = null;
//         const tokenId = 0;

//         it(
//           `Should `,
//           async ()=>{
//             const tokenURI = await nft.callStatic.tokenURI( tokenId );
//             const json = Buffer.from(
//               tokenURI.match( /(data:\w+\/\w+;\w+),(.+)/i )?.[2],
//               "base64"
//             ).toString();
      
//             metadata = JSON.parse( json );
//           }
//         );

//         it(
//           `Metadata should not be null`,
//           async ()=>{
//             expect(
//               metadata
//             ).is.not.be.null;
//           }
//         );
      
//         it(
//           `Should have .name`,
//           async ()=>{
//             expect(
//               metadata.name
//             ).to.equal(
//               [
//                 "Token #",
//                 tokenId.toString(),
//               ].join( "" )
//             );
//           }
//         );

//         it(
//           `Should have .desc`,
//           async ()=>{
//             expect(
//               metadata.description
//             ).to.equal(
//               `This is my collection description.`
//             );
//           }
//         );

//         it(
//           `Should have .image`,
//           async ()=>{
//             expect(
//               metadata.image
//             ).to.equal(
//               [
//                 await nft.callStatic.baseImageURI(),
//                 tokenId.toString(),
//               ].join( "" )
//             );
//           }
//         );
//       }
//     );

//     describe(
//       "Finances",
//       function(){
//         it(
//           `Should accept funds using fallback (with data)`,
//           async ()=>{
//             let balance0 = await ethers.provider.getBalance( nft.address );

//             const sendAmt = parseEther( "1" );
//             await nft.connect( getUser( 6 ) ).fallback( {
//               data  : "0xFFFFFF",
//               value : sendAmt,
//             } );

//             balance0 = balance0.add( sendAmt );

//             expect(
//               await ( await ethers.provider.getBalance( nft.address ) ).toString()
//             ).to.equal(
//               balance0.toString()
//             );
//           }
//         );

//         it(
//           `Should accept funds using fallback (no data)`,
//           async ()=>{
//             let balance0 = await ethers.provider.getBalance( nft.address );

//             const sendAmt = parseEther( "1" );
//             await nft.connect( getUser( 6 ) ).fallback( {
//               value : sendAmt,
//             } );

//             balance0 = balance0.add( sendAmt );

//             expect(
//               await ( await ethers.provider.getBalance( nft.address ) ).toString()
//             ).to.equal(
//               balance0.toString()
//             );
//           }
//         );

//         it(
//           `Admin can widthraw`,
//           async ()=>{
//             let contractBal = await ethers.provider.getBalance( nft.address );
//             const adminAddress = await getAdmin().getAddress();

//             let adminBal = await ethers.provider.getBalance( adminAddress );

//             const requestAmt = contractBal.div( 2 );
//             const txn = await nft.connect( getAdmin() ).withdrawTo(
//               adminAddress,
//               requestAmt
//             );
//             const receipt = await txn.wait( 1 );

//             /* Contract balance decrease */
//             contractBal = contractBal.sub( requestAmt );
//             expect(
//               ( await ethers.provider.getBalance( nft.address ) ).toString()
//             ).to.equal(
//               contractBal.toString()
//             );
      
//             /* User balance to increase */
//             adminBal = adminBal
//             .add( requestAmt )
//             .sub( receipt.gasUsed.mul( receipt.effectiveGasPrice ) );

//             expect(
//               (
//                 await ethers.provider.getBalance( adminAddress )
//               ).sub( adminBal ).toString()
//             ).to.equal(
//               BigNumber.from( 0 ).toString()
//             );
//           }
//         );

//         it(
//           `User cannot widthraw`,
//           async ()=>{
//             const contractBal = await ethers.provider.getBalance( nft.address );
//             const userAddress = await getUser().getAddress();

//             const requestAmt = contractBal.div( 2 );
//             // contractBal = contractBal.sub( requestAmt );

//             try{
//               await nft.connect( getUser( 0 ) ).withdrawTo(
//                 userAddress,
//                 requestAmt
//               );
//             } catch( err ){
//               //
//             }
//             expect(
//               ( await ethers.provider.getBalance( nft.address ) ).toString()
//             ).to.equal(
//               contractBal.toString()
//             );
//           }
//         );
//       }
//     );
//   }
// );