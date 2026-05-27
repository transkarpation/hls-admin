"use client";

import {
  List,
  Datagrid,
  TextField,
  DateField,
  FunctionField,
} from "react-admin";
import { Chip, Button } from "@mui/material";
import { PlayArrow } from "@mui/icons-material";

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
        <FunctionField
          label="Status"
          render={(record: { status: string }) => {
            const color =
              record.status === "ready" ? "success" :
              record.status === "processing" ? "info" :
              record.status === "failed" ? "error" : "default";
            return <Chip label={record.status} color={color} size="small" variant="outlined" />;
          }}
        />
        <DateField source="createdAt" label="Uploaded" />
        <FunctionField
          label=""
          render={(record: { id: string; status: string }) =>
            record.status === "ready" ? (
              <Button
                size="small"
                startIcon={<PlayArrow />}
                href={`/watch?id=${record.id}`}
                target="_blank"
              >
                Watch
              </Button>
            ) : null
          }
        />
      </Datagrid>
    </List>
  );
}
