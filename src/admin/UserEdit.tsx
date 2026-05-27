"use client";

import {
  Edit,
  SimpleForm,
  TextInput,
  SelectInput,
  PasswordInput,
  required,
  email,
  useRedirect,
} from "react-admin";
import { toast } from "react-toastify";

export function UserEdit() {
  const redirect = useRedirect();

  const onSuccess = () => {
    toast.success("User updated successfully");
    redirect("list", "users");
  };

  return (
    <Edit mutationOptions={{ onSuccess }} mutationMode="pessimistic">
      <SimpleForm>
        <TextInput source="name" validate={required()} />
        <TextInput source="email" validate={[required(), email()]} />
        <PasswordInput source="password" helperText="Leave blank to keep current password" />
        <SelectInput
          source="role"
          choices={[
            { id: "user", name: "User" },
            { id: "admin", name: "Admin" },
          ]}
          validate={required()}
        />
      </SimpleForm>
    </Edit>
  );
}
