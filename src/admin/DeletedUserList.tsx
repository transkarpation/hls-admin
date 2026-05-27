"use client";

import {
  List,
  Datagrid,
  TextField,
  EmailField,
  DateField,
  useRefresh,
  useNotify,
  useRecordContext,
  useListContext,
  useUnselectAll,
} from "react-admin";
import { Button } from "@mui/material";
import RestoreIcon from "@mui/icons-material/RestoreFromTrash";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";

function RestoreButton() {
  const record = useRecordContext();
  const refresh = useRefresh();
  const notify = useNotify();
  if (!record) return null;

  const handleRestore = async () => {
    await fetch(`/api/deleted-users/${record.id}`, { method: "PUT" });
    notify("User restored", { type: "success" });
    refresh();
  };

  return (
    <Button size="small" startIcon={<RestoreIcon />} onClick={handleRestore}>
      Restore
    </Button>
  );
}

function HardDeleteButton() {
  const record = useRecordContext();
  const refresh = useRefresh();
  const notify = useNotify();
  if (!record) return null;

  const handleDelete = async () => {
    if (!confirm(`Permanently delete ${record.name}?`)) return;
    await fetch(`/api/deleted-users/${record.id}`, { method: "DELETE" });
    notify("User permanently deleted", { type: "warning" });
    refresh();
  };

  return (
    <Button
      size="small"
      color="error"
      startIcon={<DeleteForeverIcon />}
      onClick={handleDelete}
    >
      Delete Forever
    </Button>
  );
}

function BulkDeleteButton() {
  const { selectedIds } = useListContext();
  const refresh = useRefresh();
  const notify = useNotify();
  const unselectAll = useUnselectAll("deleted-users");

  const handleBulkDelete = async () => {
    if (!confirm(`Permanently delete ${selectedIds.length} user(s)?`)) return;
    await Promise.all(
      selectedIds.map((id) =>
        fetch(`/api/deleted-users/${id}`, { method: "DELETE" })
      )
    );
    notify(`${selectedIds.length} user(s) permanently deleted`, { type: "warning" });
    unselectAll();
    refresh();
  };

  return (
    <Button color="error" startIcon={<DeleteForeverIcon />} onClick={handleBulkDelete}>
      Delete Forever ({selectedIds.length})
    </Button>
  );
}

export function DeletedUserList() {
  return (
    <List>
      <Datagrid rowClick={false} bulkActionButtons={<BulkDeleteButton />}>
        <TextField source="name" />
        <EmailField source="email" />
        <TextField source="role" />
        <DateField source="deletedAt" label="Deleted" showTime />
        <RestoreButton />
        <HardDeleteButton />
      </Datagrid>
    </List>
  );
}
