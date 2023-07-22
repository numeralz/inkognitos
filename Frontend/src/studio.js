
/* @ts-ignore-next */
import Studio from "./components/Studio.vue";
import { createApp  } from "vue";
export default {
  mount( target, props ){
    const app = createApp( Studio, props );
    return app.mount( target );
  },
};