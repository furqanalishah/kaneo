import { createFileRoute, useNavigate } from "@tanstack/react-router";
import WorkspaceLayout from "@/components/common/workspace-layout";
import PageTree from "@/components/page/page-tree";
import PageTitle from "@/components/page-title";
import { Button } from "@/components/ui/button";
import { useCreatePage } from "@/hooks/mutations/page/use-page-mutations";
import { useWorkspacePages } from "@/hooks/queries/page/use-pages";
import { toast } from "@/lib/toast";

export const Route = createFileRoute(
  "/_layout/_authenticated/dashboard/workspace/$workspaceId/pages/",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { workspaceId } = Route.useParams();
  const navigate = useNavigate();
  const { data: pages = [], isLoading } = useWorkspacePages(workspaceId);
  const { mutateAsync: createPage } = useCreatePage(workspaceId);

  const create = (parentId?: string) =>
    createPage({ workspaceId, title: "Untitled", parentId })
      .then((created) =>
        navigate({
          to: "/dashboard/workspace/$workspaceId/pages/$pageId",
          params: { workspaceId, pageId: created.id },
        }),
      )
      .catch(() => toast.error("Failed to create page"));

  return (
    <>
      <PageTitle title="Pages" />
      <WorkspaceLayout title="Pages">
        <div className="mx-auto h-full max-w-3xl overflow-y-auto p-6">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold">Pages</h1>
            <Button onClick={() => create()}>New page</Button>
          </div>

          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : pages.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No pages yet. Create one to start documenting this workspace.
            </p>
          ) : (
            <PageTree
              pages={pages}
              workspaceId={workspaceId}
              onCreateChild={(parentId) => create(parentId)}
            />
          )}
        </div>
      </WorkspaceLayout>
    </>
  );
}
