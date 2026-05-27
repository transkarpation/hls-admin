"use client";

import {
  Edit,
  SimpleForm,
  TextInput,
  SelectInput,
  PasswordInput,
  required,
  email,
} from "react-admin";

export function UserEdit() {
  return (
    <Edit>
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
