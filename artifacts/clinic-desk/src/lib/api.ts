import { customFetch } from "@workspace/api-client-react";

export const api = {
  get: async <T = any>(url: string) => {
    const data = await customFetch<any>(`/api${url}`);
    return { data: data as T };
  },
  post: async <T = any>(url: string, body?: any) => {
    const data = await customFetch<any>(`/api${url}`, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
    return { data: data as T };
  },
  postForm: async <T = any>(url: string, body: FormData) => {
    const data = await customFetch<any>(`/api${url}`, {
      method: "POST",
      body,
    });
    return { data: data as T };
  },
  put: async <T = any>(url: string, body?: any) => {
    const data = await customFetch<any>(`/api${url}`, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    });
    return { data: data as T };
  },
  patch: async <T = any>(url: string, body?: any) => {
    const data = await customFetch<any>(`/api${url}`, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    });
    return { data: data as T };
  },
  delete: async <T = any>(url: string) => {
    const data = await customFetch<any>(`/api${url}`, {
      method: "DELETE",
    });
    return { data: data as T };
  },
};
