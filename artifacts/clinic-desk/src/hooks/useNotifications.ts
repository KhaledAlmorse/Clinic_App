import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { customFetch } from "@workspace/api-client-react";

export interface Notification {
  id: number;
  userId: number;
  type: string;
  title: string;
  message: string;
  read: boolean;
  entityType: string | null;
  entityId: number | null;
  createdAt: string;
}

export interface ListNotificationsResponse {
  data: Notification[];
  total: number;
}

export interface UnreadCountResponse {
  count: number;
}

export const listNotificationsQueryKey = ["notifications"] as const;
export const unreadCountQueryKey = ["notifications", "unread-count"] as const;

export function useListNotifications() {
  return useQuery<ListNotificationsResponse>({
    queryKey: listNotificationsQueryKey,
    queryFn: () => customFetch<ListNotificationsResponse>("/api/notifications"),
  });
}

export function useUnreadCount() {
  return useQuery<UnreadCountResponse>({
    queryKey: unreadCountQueryKey,
    queryFn: () => customFetch<UnreadCountResponse>("/api/notifications/unread-count"),
    refetchInterval: 15000, // Poll every 15 seconds to check for new notifications
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      customFetch<{ success: boolean }>(`/api/notifications/${id}/read`, {
        method: "PATCH",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: listNotificationsQueryKey });
      queryClient.invalidateQueries({ queryKey: unreadCountQueryKey });
    },
  });
}
