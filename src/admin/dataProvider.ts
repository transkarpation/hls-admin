import { DataProvider, fetchUtils } from "react-admin";

const apiUrl = "/api";

const httpClient = fetchUtils.fetchJson;

export const dataProvider: DataProvider = {
  getList: async (resource, params) => {
    const { page, perPage } = params.pagination!;
    const { field, order } = params.sort!;
    const rangeStart = (page - 1) * perPage;
    const rangeEnd = page * perPage - 1;

    const query = new URLSearchParams({
      sort: JSON.stringify([field, order]),
      range: JSON.stringify([rangeStart, rangeEnd]),
      filter: JSON.stringify(params.filter),
    });

    const { json, headers } = await httpClient(
      `${apiUrl}/${resource}?${query}`
    );

    const contentRange = headers.get("Content-Range");
    const total = contentRange
      ? parseInt(contentRange.split("/").pop()!, 10)
      : json.length;

    return { data: json, total };
  },

  getOne: async (resource, params) => {
    const { json } = await httpClient(`${apiUrl}/${resource}/${params.id}`);
    return { data: json };
  },

  getMany: async (resource, params) => {
    const query = new URLSearchParams({
      filter: JSON.stringify({ id: params.ids }),
    });
    const { json } = await httpClient(`${apiUrl}/${resource}?${query}`);
    return { data: json };
  },

  getManyReference: async (resource, params) => {
    const { page, perPage } = params.pagination;
    const { field, order } = params.sort;
    const rangeStart = (page - 1) * perPage;
    const rangeEnd = page * perPage - 1;

    const query = new URLSearchParams({
      sort: JSON.stringify([field, order]),
      range: JSON.stringify([rangeStart, rangeEnd]),
      filter: JSON.stringify({ ...params.filter, [params.target]: params.id }),
    });

    const { json, headers } = await httpClient(
      `${apiUrl}/${resource}?${query}`
    );

    const contentRange = headers.get("Content-Range");
    const total = contentRange
      ? parseInt(contentRange.split("/").pop()!, 10)
      : json.length;

    return { data: json, total };
  },

  update: async (resource, params) => {
    const { json } = await httpClient(`${apiUrl}/${resource}/${params.id}`, {
      method: "PUT",
      body: JSON.stringify(params.data),
    });
    return { data: json };
  },

  updateMany: async () => ({ data: [] }),

  create: async (resource, params) => {
    if (resource === "videos" && params.data.file) {
      const formData = new FormData();
      formData.append("title", params.data.title);
      if (params.data.description)
        formData.append("description", params.data.description);
      formData.append("file", params.data.file.rawFile);

      const response = await fetch(`${apiUrl}/${resource}`, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Upload failed");
      }
      const json = await response.json();
      return { data: json };
    }

    if (resource === "crons" && params.data.script) {
      const formData = new FormData();
      formData.append("name", params.data.name);
      formData.append("expression", params.data.expression);
      if (params.data.command) formData.append("command", params.data.command);
      formData.append("enabled", String(params.data.enabled ?? true));
      formData.append("script", params.data.script.rawFile);

      const response = await fetch(`${apiUrl}/${resource}`, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Create failed");
      }
      const json = await response.json();
      return { data: json };
    }

    const { json } = await httpClient(`${apiUrl}/${resource}`, {
      method: "POST",
      body: JSON.stringify(params.data),
    });

    if (resource === "users") {
      await fetch(`${apiUrl}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "new.user",
          adminsOnly: true,
          data: {
            user: { id: json.id, name: json.name, email: json.email, role: json.role },
          },
        }),
      });
    }

    return { data: json };
  },

  delete: async (resource, params) => {
    const { json } = await httpClient(`${apiUrl}/${resource}/${params.id}`, {
      method: "DELETE",
    });
    return { data: json };
  },

  deleteMany: async (resource, params) => {
    await Promise.all(
      params.ids.map((id) =>
        httpClient(`${apiUrl}/${resource}/${id}`, { method: "DELETE" })
      )
    );
    return { data: params.ids };
  },
};
