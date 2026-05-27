"use client";

import {
  Create,
  SimpleForm,
  TextInput,
  SelectInput,
  PasswordInput,
  required,
  email,
  useRedirect,
} from "react-admin";
import { toast } from "react-toastify";

export function UserCreate() {
  const redirect = useRedirect();

  const onSuccess = () => {
    toast.success("User created successfully");
    redirect("list", "users");
  };

  return (
    <Create mutationOptions={{ onSuccess }}>
      <SimpleForm>
        <TextInput source="name" validate={required()} />
        <TextInput source="email" validate={[required(), email()]} />
        <PasswordInput source="password" validate={required()} />
        <SelectInput
          source="role"
          choices={[
            { id: "user", name: "User" },
            { id: "admin", name: "Admin" },
          ]}
          defaultValue="user"
          validate={required()}
        />
      </SimpleForm>
    </Create>
  );
}
