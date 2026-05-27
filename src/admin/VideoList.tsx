"use client";

import {
  List,
  Datagrid,
  TextField,
  DateField,
  FunctionField,
} from "react-admin";

function formatFileSize(bytes: number | null) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function VideoList() {
  return (
    <List>
      <Datagrid rowClick={false}>
        <TextField source="title" />
        <TextField source="filename" label="File" />
        <FunctionField
          label="Size"
          render={(record: { fileSize: number | null }) =>
            formatFileSize(record.fileSize)
          }
        />
        <TextField source="mimeType" label="Type" />
        <DateField source="createdAt" label="Uploaded" />
      </Datagrid>
    </List>
  );
}
