import { Field } from "$/lib/utils";
import { User } from "$/store/session";
import { ReactiveVariable } from "vue/macros";
export async function changeDisplayName( nameField: ReactiveVariable<Field>, user: User ) {
  nameField.isInvalid = false;
  nameField.isLoading = true;

  try{
    const {
      data,
    } = await axios.request( {
      method : "POST",
      url    : `/api/me/name`,
      data   : {
        name : nameField.value,
      },
    } );

    nameField.value = user.name = data;
  } catch( error:any ){
    nameField.isInvalid = true;
    console.error( error );
  }

  nameField.isLoading = false;
}

