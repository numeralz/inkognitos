import { openErrorModal, safeUrl } from "$/lib/utils";
import userStore, { getFactoryContract } from "$/store/session";
import { BigNumber } from "@ethersproject/bignumber";
import { toReactive } from "@vueuse/shared";
import { set } from "vue-demi";

const  items = ref<TokenNFT[]>( [] );
const  activeItem = ref<TokenNFT>();

const {
  selectedAddress,
} = userStore.getState();

export class TokenNFT {
  static currentPage = 0;
  // static totalPages=0;
  static pageSize = 6 * 4;
  static activeItem = activeItem;
  static items = items;

  public deleted = ref( false );
  public _id!:string;
  public inkTokensUsed: Record<string, number> = {};
  public tokenUri = "";
  public metadata: any = {};
  public image = "";
  public ownerAddress = ref<string>( "" );
  public userAddress = ref<string>( "" );
  public hash = "";
  public royaltyInfo?: {
    address: string;
    amount: BigNumber;
  };

  public i = 0;

  public tokenId = "";
  public burnable = false;
  public reactionCounts: { [ key: string ]: number } = {};

  reactive(){
    return toReactive( this );
  }

  static async fetchPage( p = 0 ){
    const first = p * TokenNFT.pageSize;
    const last = ( p + 1 ) * TokenNFT.pageSize;
    const reqLength = last - first;

    const {
      data: {
        items,
        skip,
        limit,
        count,
      },
    } = await axios.get( `/api/tokens`, {
      params : {
        skip  : first,
        limit : reqLength,
      },
    } ) as {
      data: {
        items: any[];
        skip: number;
        limit: number;
        count: number;
      }
    };

    console.warn( {
      items,
    } );
    items.forEach( async ( item, _i ) => {
      const item_ = await TokenNFT.create( {
        ...item,
        i : _i + skip,
      } );
    } );
  }

  static async  create( d : any ){
    const item = new TokenNFT();

    set( items.value, d.i, d );
    // await item?.tokenMetadata();

    return item;
  }

  static itemsOnPage( p = 0 ){
    return items.value.slice( p * this.pageSize, ( p + 1 ) * this.pageSize );
  }

  /* Dynamic */

  async;

  static openNext( d = 0 ){
    const newIndex = ( activeItem.value?.i || 0 ) + d;
    const page = Math.round( newIndex / TokenNFT.pageSize );

    if( page !== TokenNFT.currentPage ){
      TokenNFT.currentPage = page;
      TokenNFT.fetchPage( page );
    }

    TokenNFT.openItem(
      items.value?.[ newIndex ]
    );
  }

  static async openItem( item: TokenNFT ){
    activeItem.value = item;
    
    try{
      const {
        data,
      } = await axios.request( {
        method : "get",
        url    : `/api/tokens/${ item.tokenId || item._id }`,
      } );
    
      Object.assign( item, data );
      activeItem.value = item;
      // handle result
    } catch( error:any ){
      activeItem.value = item;
      console.error( error );
    }
  }

  isActive(){
    return this === activeItem.value;
  }

  async tokenMetadata(): Promise<any> {
    const factory = await getFactoryContract();
    const tokenId = this.tokenId;
    
    if( typeof window === "undefined" ) {
      return;
    }
    

    try{
      this.ownerAddress.value = await factory.callStatic.ownerOf( this.tokenId );
    }catch( err: any ){
      console.log( err );
    }

    try{
      if( BigNumber.from( selectedAddress.value  ).eq( this.ownerAddress.value ) ){
        const estGas = await factory.callStatic.burn( this.tokenId, {
          gasLimit : "200000",
        } );

        this.burnable = true;
      }
    }catch( err: any ){
      console.log( err );
    }
    
    try{
      this.tokenUri = safeUrl( await factory!.callStatic.tokenURI( tokenId ) );

      const base64String = this.tokenUri.slice( 29 );
      const jsonString = window.atob( base64String );
      const metadata = JSON.parse( jsonString );

      this.metadata = metadata;

      if( !this.image ){
        this.image = safeUrl( metadata.image );
      }
    }catch( err: any ){
      // console.log( err );
    }

    try{
      const [
        address,
        amount,
      ] = await factory.callStatic.royaltyInfo( this.tokenId, 100 );

      this.royaltyInfo = {
        address,
        amount,
      };
    }catch( err: any ){
      // console.log( err );
    }
  }
}