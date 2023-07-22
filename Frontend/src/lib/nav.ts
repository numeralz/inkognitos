import userStore, { getPassContract } from "$/store/session";
import { BigNumberish } from "ethers";

const {
  user,
  mintFormOpen,
  studioPassOpen,
  selectedAddress,
} = userStore.getState();

interface NavItem {
  icon?: string;
  label: string;
  path?: string;
  onClick?: ( e: MouseEvent ) => Promise<void>;
  when?: ( user: any ) => boolean;
}


export function etherscanURL( type: string, info: {
  contract: BigNumberish, tokenId: BigNumberish
} ) {
  switch ( type ) {
  case "token":
    return `https://etherscan.io/token/${ info.contract }?a=${ info.tokenId }`;
  case "account":
    return `https://etherscan.io/address/${ info.tokenId }`;
  default:
    return "";
  }
}

const hasPass = ref( true );

async function checkPass(){
  if( !selectedAddress.value ){
    return false;
  }

  hasPass.value = !( await ( await getPassContract() )?.callStatic?.balanceOf(
    selectedAddress.value
  ) )?.isZero() || false;

  return hasPass.value;
}

async function getPass(){
  if( await checkPass() ){
    return;
  }

  ( await getPassContract() )?.mint( {
    value : ( await getPassContract() )?.mintPrice(),
  } );
}

export function usePass(){
  return {
    getPass,
    checkPass,
    hasPass,
  };
}
export function navMain(): NavItem[] {
  checkPass();

  return [
    {
      icon  : "fa fa-images",
      label : "Gallery",
      path  : "/tokens",
    },
    {
      icon  : "fa fa-brush",
      label : "Draw",
      path  : "/artboard",
    },
    ...(
      !hasPass.value ? [
        {
          icon  : "fa fa-eye-dropper",
          label : "Ink",
          async onClick( e: MouseEvent ) {
            mintFormOpen.value = true;
          },
        },
        {
          icon  : "fa fa-id-card",
          label : "Studio Pass",
          async onClick( e: MouseEvent ) {
            studioPassOpen.value = true;
          },
        },
      ] : []
    ),
  ];
}
export function navGeneral(): NavItem[] {
  return [
    // {
    //   icon  : "fa fa-certificate",
    //   label : "Inkdrop",
    //   path  : "/airdrop",
    // },
    {
      icon  : "fa fa-question",
      label : "About",
      path  : "/about",
    },
    // {
    //   icon  : "fa fa-map",
    //   label : "Milestones",
    //   path  : "/info",
    // },
    {
      icon  : "fa fa-newspaper",
      label : "News",
      path  : "/news",
    },
    {
      icon  : "fa fa-message",
      label : "Community",
      path  : "/community",
    },
  ];
}
export function navUser() : any[] {
  if ( !user.value?.address ) {
    return [
      // {
      //   icon  : "fa fa-user",
      //   label : "Sign In",
      //   type  : "auth",
      //   async onClick( e: MouseEvent ) {
      //     await userStore.start( true );
      //   },
      // },
    ];
  }

  return [
    {
      icon  : "fa fa-user",
      label : "Profile",
      path  : `/users/${ user.value?.address }`,
    },
    {
      icon  : "fa fa-address-card",
      label : "Account",
      path  : "/account",
    },
    // {
    //   icon  : "fa fa-images",
    //   label : "Library",
    //   path  : "/account/library",
    // },
    // {
    //   icon  : "fa fa-sign-out",
    //   label : "Sign Out",
    //   async onClick( e: MouseEvent ) {
    //     await userStore.signOut();
    //   },
    // },
  ];
}

