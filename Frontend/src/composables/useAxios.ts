
import axios from "axios";
// import { setupCache } from "axios-cache-adapter";

// const cache = setupCache( {
//   maxAge : 15 * 60 * 1000,
// } );

const _axios = axios.create( {
  // adapter : cache.adapter,
} );

export default _axios;
export function useAxios(){
  return {
    axios : _axios,
  };
}