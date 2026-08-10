import { useQuery } from "@tanstack/react-query";
import { getPage, getWorkspacePages } from "@/fetchers/page";

export function useWorkspacePages(workspaceId: string) {
  return useQuery({
    enabled: Boolean(workspaceId),
    queryKey: ["pages", workspaceId],
    queryFn: () => getWorkspacePages(workspaceId),
  });
}

export function usePage(pageId: string) {
  return useQuery({
    enabled: Boolean(pageId),
    queryKey: ["page", pageId],
    queryFn: () => getPage(pageId),
  });
}
