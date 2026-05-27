"use client";

import { useEffect } from "react";
import {
  List,
  Datagrid,
  TextField,
  DateField,
  EmailField,
  FunctionField,
  BulkDeleteButton,
  useRefresh,
} from "react-admin";
import { Chip } from "@mui/material";
import { toast } from "react-toastify";
import { onWSEvent } from "@/lib/wsEventBus";

function UserListUpdater() {
  const refresh = useRefresh();

  useEffect(() => {
    return onWSEvent((msg) => {
      if (msg.type === "user.created") {
        const user = msg.user as { name: string; email: string };
        const sender = msg.sender as { name: string; email: string };
        toast.info(
          `${sender.name} created user ${user.name} (${user.email})`,
          { autoClose: 5000 }
        );
        refresh();
      }
      if (msg.type === "user.deleted") {
        const user = msg.user as { name: string; email: string };
        const sender = msg.sender as { name: string; email: string };
        toast.warn(
          `${sender.name} deleted user ${user.name} (${user.email})`,
          { autoClose: 5000 }
        );
        refresh();
      }
    });
  }, [refresh]);

  return null;
}

export function UserList() {
  return (
    <List>
      <UserListUpdater />
      <Datagrid rowClick="edit" bulkActionButtons={<BulkDeleteButton mutationMode="pessimistic" />}>
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
