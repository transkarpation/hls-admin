export type UploadStatus = "pending" | "uploading" | "completed" | "failed" | "cancelled";

export interface UploadEntry {
  id: string;
  file: File;
  resource: string;
  status: UploadStatus;
  progress: number;
  error?: string;
  result?: Record<string, unknown>;
}

type Listener = (uploads: UploadEntry[]) => void;

const uploads = new Map<string, UploadEntry>();
const abortControllers = new Map<string, AbortController>();
const listeners = new Set<Listener>();

let idCounter = 0;

function notify() {
  const snapshot = Array.from(uploads.values());
  listeners.forEach((fn) => fn(snapshot));
}

export function onUploadsChange(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getUploads(): UploadEntry[] {
  return Array.from(uploads.values());
}

export function upload(
  file: File,
  resource: string,
  fields: Record<string, string> = {}
): string {
  const id = `upload-${++idCounter}-${Date.now()}`;
  const entry: UploadEntry = {
    id,
    file,
    resource,
    status: "pending",
    progress: 0,
  };
  uploads.set(id, entry);
  notify();

  const controller = new AbortController();
  abortControllers.set(id, controller);

  performUpload(id, file, resource, fields, controller.signal);

  return id;
}

async function performUpload(
  id: string,
  file: File,
  resource: string,
  fields: Record<string, string>,
  signal: AbortSignal
) {
  const entry = uploads.get(id)!;
  entry.status = "uploading";
  notify();

  try {
    const formData = new FormData();
    for (const [key, value] of Object.entries(fields)) {
      formData.append(key, value);
    }
    formData.append("file", file);

    const xhr = new XMLHttpRequest();
    const result = await new Promise<Record<string, unknown>>((resolve, reject) => {
      signal.addEventListener("abort", () => {
        xhr.abort();
        reject(new DOMException("Upload cancelled", "AbortError"));
      });

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          entry.progress = Math.round((e.loaded / e.total) * 100);
          notify();
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(JSON.parse(xhr.responseText));
        } else {
          try {
            const err = JSON.parse(xhr.responseText);
            reject(new Error(err.error || `Upload failed (${xhr.status})`));
          } catch {
            reject(new Error(`Upload failed (${xhr.status})`));
          }
        }
      });

      xhr.addEventListener("error", () => reject(new Error("Network error")));

      xhr.open("POST", `/api/${resource}`);
      xhr.send(formData);
    });

    entry.status = "completed";
    entry.progress = 100;
    entry.result = result;
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      entry.status = "cancelled";
    } else {
      entry.status = "failed";
      entry.error = err instanceof Error ? err.message : "Unknown error";
    }
  } finally {
    abortControllers.delete(id);
    notify();
  }
}

export function cancelUpload(id: string) {
  const controller = abortControllers.get(id);
  if (controller) {
    controller.abort();
  }
}

export function removeUpload(id: string) {
  cancelUpload(id);
  uploads.delete(id);
  notify();
}

export function clearCompleted() {
  for (const [id, entry] of uploads) {
    if (entry.status === "completed" || entry.status === "cancelled" || entry.status === "failed") {
      uploads.delete(id);
    }
  }
  notify();
}
