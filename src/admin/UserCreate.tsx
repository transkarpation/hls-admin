"use client";

import {
  Create,
  SimpleForm,
  TextInput,
  SelectInput,
  PasswordInput,
  required,
  email,
} from "react-admin";

export function UserCreate() {
  return (
    <Create>
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
