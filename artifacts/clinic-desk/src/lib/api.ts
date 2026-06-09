import { customFetch } from "@workspace/api-client-react";

export const api = {
  get: async (url: string) => {
    const data = await customFetch<any>(`/api${url}`);
    return { data };
  },
  post: async (url: string, body?: any) => {
    const data = await customFetch<any>(`/api${url}`, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
    return { data };
  },
  put: async (url: string, body?: any) => {
    const data = await customFetch<any>(`/api${url}`, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    });
    return { data };
  },
  patch: async (url: string, body?: any) => {
    const data = await customFetch<any>(`/api${url}`, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    });
    return { data };
  },
  delete: async (url: string) => {
    const data = await customFetch<any>(`/api${url}`, {
      method: "DELETE",
    });
    return { data };
  },
};
