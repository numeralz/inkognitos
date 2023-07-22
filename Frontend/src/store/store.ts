import { reactive } from "vue";
export abstract class Store<T extends object> {
  protected state: T;

  constructor() {
    const data = this.data();

    this.setup( data );
    this.state = reactive( data ) as T;
  }

  protected abstract data(): T

  protected setup( data: T ): void {
    //
  }
  
  public getState() {
    return {
      ...toRefs( this.state ),
    };
  }
}

