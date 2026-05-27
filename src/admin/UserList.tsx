"use client";

import { List, Datagrid, TextField, DateField, EmailField } from "react-admin";

export function UserList() {
  return (
    <List>
      <Datagrid rowClick={false}>
        <TextField source="name" />
        <EmailField source="email" />
        <TextField source="role" />
        <DateField source="createdAt" label="Created" />
      </Datagrid>
    </List>
  );
}
