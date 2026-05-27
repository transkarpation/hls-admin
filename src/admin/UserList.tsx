"use client";

import {
  List,
  Datagrid,
  TextField,
  DateField,
  EmailField,
  FunctionField,
} from "react-admin";
import { Chip } from "@mui/material";

export function UserList() {
  return (
    <List>
      <Datagrid rowClick="edit">
        <TextField source="name" />
        <EmailField source="email" />
        <TextField source="role" />
        <FunctionField
          label="Status"
          render={(record: { online: boolean }) => (
            <Chip
              label={record.online ? "Online" : "Offline"}
              color={record.online ? "success" : "default"}
              size="small"
              variant="outlined"
            />
          )}
        />
        <DateField source="createdAt" label="Created" />
      </Datagrid>
    </List>
  );
}
