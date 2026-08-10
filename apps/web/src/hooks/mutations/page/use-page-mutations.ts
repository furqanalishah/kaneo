import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createPage,
  deletePage,
  linkTaskToPage,
  unlinkTaskFromPage,
  updatePage,
} from "@/fetchers/page";

export function useCreatePage(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pages", workspaceId] });
    },
  });
}

export function useUpdatePage(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...patch
    }: {
      id: string;
      title?: string;
      content?: string;
      icon?: string | null;
      parentId?: string | null;
      position?: number;
    }) => updatePage(id, patch),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["page", variables.id] });
      // Title and nesting show in the tree, so the list has to refresh too.
      queryClient.invalidateQueries({ queryKey: ["pages", workspaceId] });
    },
  });
}

export function useDeletePage(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deletePage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pages", workspaceId] });
    },
  });
}

export function useLinkTask(pageId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (taskId: string) => linkTaskToPage(pageId, taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["page", pageId] });
    },
  });
}

export function useUnlinkTask(pageId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (taskId: string) => unlinkTaskFromPage(pageId, taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["page", pageId] });
    },
  });
}
