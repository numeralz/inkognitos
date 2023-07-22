/* eslint-disable complexity */
import { InkognitosNFT, InkognitosNFT__factory, InkognitosInk, InkognitosInk__factory, INKStudioPass__factory, InkognitosRoyaltySplitter, InkognitosRoyaltySplitter__factory, Airdrop__factory, Airdrop, INKStudioPass } from "$/../typechain";
import { openErrorModal, parseErrorMessage } from "$/lib/utils";
import { isClient } from "@vueuse/core";
import { BigNumber, BigNumberish, Contract, ContractFactory, ethers, providers, utils } from "ethers";
import { TinyEmitter } from "tiny-emitter";
import { Store } from "./store";



// function clearCookies() {
//   const cookies = document.cookie.split( "; " );

//   for ( let c = 0; c < cookies.length; c++ ) {
//     const d = window?.location.hostname.split( "." );

//     while ( d.length > 0 ) {
//       const cookieBase = `${encodeURIComponent(
//         cookies[c].split( ";" )[0].split( "=" )[0]
//       )}=; expires=Thu, 01-Jan-1970 00:00:01 GMT; domain=${d.join( "." )} ;path=`;

//       const p = location.pathname.split( "/" );

//       document.cookie = `${cookieBase}/`;

//       while ( p.length > 0 ) {
//         document.cookie = cookieBase + p.join( "/" );
//         p.pop();
//       }

//       d.shift();
//     }
//   }
// }

async function handleAccountsChanged( addresses: string[] ) {
  // addresses[ 0 ] && ( userStore.getState().selectedAddress.value = addresses[ 0 ] );
  
  if( selectedAddress.value && !sameAddress( selectedAddress.value, addresses?.[0] ) ){
    selectedAddress.value = addresses[0];

    // console.log( "address change ", addresses );
    // selectedAddress.value = "";
    // hasSession.value = false;
    // user.value = null;

    // return;
  }


  if( !sameAddress( selectedAddress.value, user.value?.address ) ){
    // user.value = null;
    // hasSession.value = false;
    // userStore.start();
  }
}

async function handleChainChanged( next, prev ) {
  console.log( "Chain changed!", next );
  userStore.getState().hasSession.value = false;
  await userStore.useCorrectChain();
  // await userStore.start();
}


export async function getReactions(){
  if( Object.keys( REACTIONS.value ).length ){
    return;
  }

  try{
    const {
      data,
    } = await axios.request( {
      method : "get",
      url    : `/api/reactions`,
    } );

    REACTIONS.value = data;
  } catch( error:any ){
    console.error( error );
  }
}



let sessionStarted = false;

export type User = Partial<{
  _id: string,
  name?: string;
  social?: {
    [ service: string ]: string;
  },
  inviteCodes: string,
  address?: string,
  picture?: string,
  isAdmin?: boolean,
}>

interface Session extends Object {
  hasSession: boolean;
  selectedAddress: string;
  provider: providers.Web3Provider | null,
  mintFormOpen: boolean;
  studioPassOpen: boolean;
  isMobile: boolean,
  user: Partial<User> | null,
  inkColors: Record<string, InkToken>,
  balance?: BigNumber,
  wrongChain: boolean,
  serverChain: AddEthereumChainParameter | null,
}

export type Comment = Partial<{
  _id: string,
  message: string,
  targetRef?: {
    type: string,
    id: any
  },
  userAddress: string;
  userSignature: string,
  [ key: string ]: any,
}>
export type FactoryItem = Partial<{
  _id: string,
  hash: string;
  user: User,
  userAddress: string;
  ownerAddress: string;
  svg: string;
  parentId?: string;
  parent? : FactoryItem;
  permit: {
    author: string,
    imageHash: string,
    timestamp: string,
    inkIds: string[],
    inkQtys: string[],
  },
  reactionCounts?: {
    [key: string]: number
  },
  reactions: Reaction[],
  alreadyReacted: {
    name: string,
    createdAt: string,
  },
  permitSignature: string,
  image?: string;
  tokenId?: string;
  isPublic: boolean;
  publishTransactionHash: string,
  inkTokensUsed: Record<string, number>,
  timeSaved: Date;
  etherscanUrl: string,
  comments: Comment[],
  [ key: string ]: any,
}>
export function sameAddress( a?:BigNumberish|undefined, b?:BigNumberish|undefined ): boolean{
  return BigNumber.from( a || 0 ).eq( b || 0 );
}

class UserStore extends Store<Session> {
  public emitter: TinyEmitter;

  constructor() {
    super();
    this.emitter = new TinyEmitter();
  }

  protected data(): Session {
    return {
      selectedAddress : "",
      mintFormOpen    : false,
      studioPassOpen  : false,
      isMobile        : false,
      provider        : null,
      user            : null,
      hasSession      : false,
      inkColors       : {},
      wrongChain      : false,
      serverChain     : null,

    };
  }

  balance = asyncComputed( async () => await this.getBalance() );


  public async start( force = false ) {
    console.log( "Start...", force );
    
    if( !force && sessionStarted ) {
      return;
    }

    sessionStarted = true;

    try{
      await this.getSession();
    }catch( err ){
      this.state.hasSession = false;
      console.log( err );
    }
  

    if ( this.state?.isMobile  ) {
      this.state.selectedAddress = this.state.user?.address || "";
      this.state.hasSession = true;

      return;
    }


    try{
      await this.connectWallet();
    }catch( err ){
      console.log( err );
    }
    
    try{
      await this.useCorrectChain();
    }catch( err ){
      console.log( err );
    }
    
    if( this.state.selectedAddress && sameAddress( this.state.user?.address, this.state.selectedAddress ) ){
      window?.localStorage.setItem( "autoConnect", this.state.user?.address || "" );
      this.state.hasSession = true;
    }else{
      this.state.hasSession = true;
    }

    if( !window?.localStorage.getItem( "autoConnect" ) && !force ){
      return;
    }

    if( !sameAddress( this.state.user?.address, selectedAddress.value ) ){
      window?.localStorage.setItem( "autoConnect", "" );
      await this.requestSession();
    }

    /* Ignore if autoconnect is off */
    console.log( {
      selectedAddress : this.state.selectedAddress,
      hasSession      : this.state.hasSession,
      isMobile        : this.state.isMobile,
      user            : this.state.user,
    } );
  }

  public async signOut() {
    console.log( "Sign Out ..." );
    window?.localStorage.setItem( "autoConnect", "" );

    try {
      const {
        data,
      } = await axios.request( {
        method : "DELETE",
        url    : `/api/me/session`,
      } );

      this.state.selectedAddress = "";
      this.state.hasSession = false;
      this.state.isMobile = false;
      // this.state.user = null;
    } catch ( err ) {
      //
    }
  }

  public async getSession() {
    console.log( "Get Session..." );

    // if ( !this.state.user ) {
    //   this.state.user = {};
    // }

    // Do we have a server session?
    try {
      const {
        data,
      } = await axios.request( {
        method : "GET",
        url    : `/api/me`,
        params : {
          t : Date.now(),
        },
        timeout : 5000,
      } );

      this.state.user = data.user;
      this.state.isMobile = data.isMobile;
      // console.log( this.state );
    } catch ( error ) {
      console.log( error );
    }

    return this.state.hasSession;
  }

  /* Requires wallet to be connected */
  async requestSession() {
    console.log( "Request session..." );

    // Begin handshake
    const {
      data: handshake,
    } = await axios.request( {
      method : "POST",
      url    : `/api/me/session`,
    } );

    // Sign message..
    console.log( "Sign Message" );
    
    const {
      address, signature, message,
    } = await this.signData( [
      [
        "title", "string", "Sign in with Ethereum Wallet",
      ],
      [
        "time", "uint256", new Date().getTime(),
      ],
      [
        "nonce", "string", handshake.nonce,
      ],
    ] );

    this.state.selectedAddress = address;
    // console.log( message );

    try{
      // Get session
      const {
        data: mySession,
      } = await axios.request( {
        method : "POST",
        url    : `/api/me/session`,
        data   : {
          address,
          signature,
          message,
        },
      } );
    }catch( err ){
      console.log( err );
    }

    await new Promise( res => setTimeout( res, 10 ) );
    await this.getSession();
  }

  public async loadInkColors( force = false ) {
    if( force || !Object.values( this.state.inkColors ).length ){
      const {
        data,
      } = await axios.request( {
        method : "get",
        url    : `/api/colors`,
      } );

      console.log( data.items );
      this.state.inkColors = data.items?.reduce( ( acc, item ) => {
        acc[ ( item.tokenId ).toString() ] = {
          ...item,
          unitPrice : BigNumber.from( item.unitPrice ),
          maxSupply : BigNumber.from( item.maxSupply ),
        };

        return acc;
      }, {} as Record<string, InkToken> );
      // await this.loadInkBalances();
    }


    return this.state.inkColors;
  }

  public async loadInkBalances() {
    console.log( "loadInkBalances" );

    const $Ink = await getInkContract();

    if ( !$Ink ) {
      console.log( "No Ink Contract" );

      return;
    }

    if( !Object.values( this.state.inkColors ).length ){
      await this.loadInkColors();
    }

    const [
      ids,
      colors,
      prices,
      maxSupplies,
      totalSupplies,
    ] = await $Ink.callStatic.batchTokenInfo();

    console.log( {
      colors,
      prices,
      maxSupplies,
      totalSupplies,
    } );
    
    for( let i = 0; i < ids.length; i++ ) {
      const tokenId = ( ids[i] ).toString();
      const item = this.state.inkColors[tokenId];

      if( !item ) {
        continue;
      }

      try{
        item.myBalance = await $Ink.callStatic.balanceOf( this.state.selectedAddress, tokenId );
        item.totalSupply = await $Ink.callStatic.totalSupply( tokenId );
      }catch( err: any ){
        console.log( err );
      }
    }
    
    console.log( "loadInkBalances done" );
  }

  public async getServerChain() {
    try {
      const {
        data: chainInfo,
      } = await axios.request( {
        method  : "get",
        url     : `/api/chains/current`,
        timeout : 5000,
      } );

      this.state.serverChain = chainInfo;
      console.log( "Chain Info", chainInfo );

      return chainInfo;
    } catch ( err ) {
      console.log( err );

      return null;
    }
  }

  public async useCorrectChain() {
    if( !isClient ){
      return;
    }
    
    const ethereum = <any>window?.ethereum;
    const serverChain = this.state.serverChain = toRaw( await this.getServerChain() );

    if( !serverChain ){
      console.log( "Could not fetch chain info from server." );

      return;
    }

    if ( !ethereum ) {
      throw new Error( "No ethereum" );
    }

    console.log( await getChainId(), this.state.serverChain?.chainId );
    this.state.wrongChain = !BigNumber.from( await getChainId() ).eq(
      this.state.serverChain?.chainId || ""
    );

    if ( !this.state.wrongChain ) {
      console.log( "Chain is correct" );

      return;
    }

    try {
      console.log( "Add chain..." );
      await ethereum?.request( {
        method : "wallet_addEthereumChain",
        params : [
          {
            chainId           : serverChain.chainId,
            chainName         : serverChain.chainName,
            rpcUrls           : serverChain.rpcUrls,
            nativeCurrency    : serverChain.nativeCurrency,
            blockExplorerUrls : serverChain.blockExplorerUrls,
          },
        ],
      } );
    } catch ( err ) {
      console.log( err );
    }
    
    console.log( "Switch chain..." );

    const res = await ethereum?.request?.( {
      method : "wallet_switchEthereumChain",
      params : [
        {
          chainId : serverChain.chainId,
        },
      ],
    } );

    console.log( res );
  }


  public async connectWallet() {
    console.log( "Connect wallet" );

    const signer = await getSigner();

    this.state.selectedAddress = await signer?.getAddress();
  }



  async getBalance() {
    return await ( await getProvider() ).getBalance( this.state.selectedAddress );
  }

  async signMessage(
    message: string,
    useHash = false
  ): Promise<{
      address: string;
      message: string;
      signature: string;
    }> {
    const provider = await getProvider();
    const signer = provider.getSigner();
    const address = await signer.getAddress();
    const messageHash = utils.keccak256( utils.toUtf8Bytes( message ) );

    const signature = useHash
      ? await signer.signMessage( messageHash )
      : await signer.signMessage( message );

    return {
      address,
      message,
      signature,
    };
  }

  async signData(
    data: NameTypeValue[]
  ): Promise<{
      address: string;
      message: string;
      signature: string;
    }> {
    const provider = await getProvider();
    const signer = provider.getSigner();
    const address = await signer.getAddress();

    console.log( `Sign Data with ${ address }` );
    

    const message = data.reduce( ( o, [
      name, type, value,
    ] ) => {
      o[ name ] =
        type === "hash" ?
          utils.keccak256( utils.toUtf8Bytes( value ) )
          : value;

      return o;
    }, {} as any );

    const fields = data.reduce( ( o, [
      name, type, value,
    ] ) => {
      o.push( {
        name,
        type : type === "hash" ? "uint256" : type,
      } );

      return o;
    }, [] as any );

    // const chainId = BigNumber.from( await getChainId() );
    const chainId = `0x${ ( await getChainId() ).toString( 16 ) }`;

    console.log( {
      chainId,
    } );

    const signature = await signer._signTypedData(
      {
        name    : "Message",
        version : "1",
        chainId,
      },
      {
        Message : fields,
      },
      message
    );

    return {
      address,
      message,
      signature,
    };
  }
}
let PROVIDER: providers.Web3Provider | null = null;

const handleErorr = async ( err: { code: number, message: string } ) => {
  // console.info( err );
  await openErrorModal( "Error", err.message );
  // window?.localStorage.setItem( "autoConnect", "" );
};

// export async function getProvider( force = false ) {
//   if ( !PROVIDER || force ) {
//     const ethereum = window?.ethereum as any;
    
//     // if ( !ethereum ) {
//     //   throw new Error( "No wallet found. Please install Metamask." );
//     // }

//     if( !ethereum?._metamask?.isUnlocked?.() ){
//       openErrorModal( "Could not connect to wallet", "Please unlock your wallet" );

//       throw new Error( "Wallet" );
//     }

//     try{
//       await ethereum?.request?.( {
//         method : "eth_requestAccounts",
//       } );
//     }catch( err: any ){
//       console.log( err );
//     }


//     PROVIDER = new ethers.providers.Web3Provider( ethereum );
//     ( ethereum )?.removeListener?.( "accountsChanged", handleAccountsChanged );
//     ( ethereum )?.on?.( "accountsChanged", handleAccountsChanged );
//     ( ethereum )?.removeListener?.( "network", handleChainChanged );
//     ( ethereum )?.on?.( "chainChanged", handleChainChanged );
//     ( ethereum )?.removeListener?.( "message", handleErorr );
//     ( ethereum )?.on?.( "message", handleErorr );
//   }

//   return PROVIDER;
// }
export async function getProvider( force = false ) {
  if( !isClient ){
    return;
  }

  const ethereum = window?.ethereum as any;

  if( !ethereum ){
    return;
  }

  if( force || !PROVIDER ){
    ( ethereum )?.removeListener?.( "accountsChanged", handleAccountsChanged );
    ( ethereum )?.removeListener?.( "chainChanged", handleChainChanged );
    ( ethereum )?.removeListener?.( "message", handleErorr );
    PROVIDER = new ethers.providers.Web3Provider( ethereum, "any" );

    try {
      console.log( ethereum._metamask );

      if ( ethereum._metamask?.isUnlocked() === false ) {
        console.log( "Wallet is locked." );

        throw new Error( "Wallet is locked" );
      }

      const accounts = await ethereum?.request?.( {
        method : "eth_requestAccounts",
      } );

      await handleAccountsChanged( accounts );
    } catch ( err: any ) {
      await openErrorModal(
        "Could not connect to wallet",
        "Please install and enable Metamask extension, and unlock your wallet."
      );
    }

    ethereum.on( "accountsChanged", handleAccountsChanged );
    ethereum.on( "chainChanged", handleChainChanged );
    ethereum.on( "message", handleErorr );
    // ethereum.on( "error", handleErorr );
  }

  return PROVIDER;
}
export async function getChainId() {
  return ( await ( await getProvider() )?.getNetwork() )?.chainId;
}
export async function getSigner( force = false ){
  return ( await getProvider( force ) )?.getSigner();
}
export interface Reaction{emoji: string, name: string, color?: string, _loading?: boolean}
export const REACTIONS = ref<{ [name:string]:Reaction }>( {} );
export const CONTRACTS:{
  InkognitosNFT?: InkognitosNFT,
  InkognitosInk?: InkognitosInk,
  [ name: string ]: any,
} = {};
export async function getContract<C extends Contract, CF extends ContractFactory = any>(
  name: string,
  factory: { new( ...args: any ): CF; },
  force = false
): Promise<C|undefined> {
  const signer = await getSigner();

  if( !signer ) {
    return undefined;
  }

  if ( CONTRACTS[ name ] && !force ) {
    return ( CONTRACTS[ name ] );
  }

  const {
    data,
  } = await axios.request( {
    method  : "get",
    url     : `/api/contracts/${ name }`,
    timeout : 3000,
  } );

  const contract = new factory()
  .attach( data.address )
  .connect( signer );

  CONTRACTS[ name ] = contract;

  return ( CONTRACTS[ name ] );
}
export async function getInkContract() {
  return await getContract<InkognitosInk>( "InkognitosInk", InkognitosInk__factory );
}
export async function getFactoryContract() {
  return await getContract<InkognitosNFT>( "InkognitosNFT", InkognitosNFT__factory );
}
export async function getPassContract() {
  return await getContract<INKStudioPass>( "INKStudioPass", INKStudioPass__factory );
}
export async function getRxContract() {
  return await getContract<InkognitosRoyaltySplitter>( "InkognitosRoyaltySplitter", InkognitosRoyaltySplitter__factory );
}
export async function getAirContract() {
  return await getContract<Airdrop>( "Airdrop", Airdrop__factory );
}
export interface InkToken {
  name?: string;
  tokenId: BigNumber;
  myBalance: BigNumber;
  color: string;
  lightness?: number;
  maxSupply?: BigNumber;
  totalSupply?: BigNumber;
  unitPrice?: BigNumber;
}


type NameTypeValue = [ name: string, type: string, value?: any ];
const userStore = new UserStore();

export default userStore;

const {
  selectedAddress,
  hasSession,
  user,
} = userStore.getState();

export interface AddEthereumChainParameter {
  chainId: string;
  blockExplorerUrls?: string[];
  chainName?: string;
  iconUrls?: string[];
  nativeCurrency?: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrls?: string[];
}