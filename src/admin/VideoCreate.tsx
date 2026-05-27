"use client";

import { useState, useEffect, useCallback } from "react";
import { Title } from "react-admin";
import {
  Card,
  CardContent,
  Button,
  Box,
  LinearProgress,
  Typography,
  IconButton,
  Stack,
  TextField,
} from "@mui/material";
import { Cancel, Delete, CheckCircle, Error as ErrorIcon } from "@mui/icons-material";
import { toast } from "react-toastify";
import {
  upload,
  cancelUpload,
  removeUpload,
  clearCompleted,
  onUploadsChange,
  getUploads,
  type UploadEntry,
} from "@/lib/uploadManager";

function UploadQueue() {
  const [uploads, setUploads] = useState<UploadEntry[]>(getUploads);

  useEffect(() => onUploadsChange(setUploads), []);

  const videoUploads = uploads.filter((u) => u.resource === "videos");

  if (videoUploads.length === 0) return null;

  return (
    <Card sx={{ mt: 2 }}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="subtitle1">Uploads</Typography>
          <Button size="small" onClick={clearCompleted}>Clear finished</Button>
        </Stack>
        {videoUploads.map((entry) => (
          <Box key={entry.id} sx={{ mb: 1.5 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              {entry.status === "completed" && <CheckCircle color="success" fontSize="small" />}
              {entry.status === "failed" && <ErrorIcon color="error" fontSize="small" />}
              <Typography variant="body2" sx={{ flexGrow: 1 }}>
                {entry.file.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {entry.status === "uploading" ? `${entry.progress}%` : entry.status}
              </Typography>
              {entry.status === "uploading" && (
                <IconButton size="small" onClick={() => cancelUpload(entry.id)}>
                  <Cancel fontSize="small" />
                </IconButton>
              )}
              {(entry.status === "completed" || entry.status === "failed" || entry.status === "cancelled") && (
                <IconButton size="small" onClick={() => removeUpload(entry.id)}>
                  <Delete fontSize="small" />
                </IconButton>
              )}
            </Stack>
            {entry.status === "uploading" && (
              <LinearProgress variant="determinate" value={entry.progress} sx={{ mt: 0.5 }} />
            )}
            {entry.error && (
              <Typography variant="caption" color="error">{entry.error}</Typography>
            )}
          </Box>
        ))}
      </CardContent>
    </Card>
  );
}

export function VideoCreate() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = useCallback(() => {
    if (!file || !title) return;

    const fields: Record<string, string> = { title };
    if (description) fields.description = description;

    upload(file, "videos", fields);
    toast.info(`Upload started: ${file.name}`);

    setTitle("");
    setDescription("");
    setFile(null);
  }, [file, title, description]);

  return (
    <Box sx={{ maxWidth: 600 }}>
      <Title title="Upload Video" />
      <Card>
        <CardContent>
          <Stack spacing={2}>
            <TextField
              label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              fullWidth
            />
            <TextField
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              multiline
              rows={3}
              fullWidth
            />
            <Button variant="outlined" component="label">
              {file ? file.name : "Choose video file"}
              <input
                type="file"
                hidden
                accept="video/*"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={!file || !title}
            >
              Upload
            </Button>
          </Stack>
        </CardContent>
      </Card>
      <UploadQueue />
    </Box>
  );
}
