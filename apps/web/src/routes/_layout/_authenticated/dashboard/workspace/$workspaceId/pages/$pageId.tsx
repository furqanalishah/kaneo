import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Link2Off, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import WorkspaceLayout from "@/components/common/workspace-layout";
import PageTree from "@/components/page/page-tree";
import PageTitle from "@/components/page-title";
import TaskDescriptionEditor from "@/components/task/task-description-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useCreatePage,
  useDeletePage,
  useUnlinkTask,
  useUpdatePage,
} from "@/hooks/mutations/page/use-page-mutations";
import { usePage, useWorkspacePages } from "@/hooks/queries/page/use-pages";
import { toast } from "@/lib/toast";

export const Route = createFileRoute(
  "/_layout/_authenticated/dashboard/workspace/$workspaceId/pages/$pageId",
)({
  component: RouteComponent,
});

const AUTOSAVE_MS = 800;

function RouteComponent() {
  const { workspaceId, pageId } = Route.useParams();
  const navigate = useNavigate();

  const { data: pages = [] } = useWorkspacePages(workspaceId);
  const { data: page, isLoading } = usePage(pageId);
  const { mutateAsync: updatePage } = useUpdatePage(workspaceId);
  const { mutateAsync: createPage } = useCreatePage(workspaceId);
  const { mutateAsync: deletePage } = useDeletePage(workspaceId);
  const { mutateAsync: unlinkTask } = useUnlinkTask(pageId);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // What the server last gave us, and which page it belongs to.
  const loaded = useRef<{
    pageId: string;
    title: string;
    content: string;
  } | null>(null);
  // Set by a real keystroke or paste; cleared whenever the page changes.
  const touched = useRef(false);
  // The editor reads `value` when it mounts and does not reliably re-hydrate
  // afterwards, so it must not mount until the fetched content is in state.
  const [hydratedFor, setHydratedFor] = useState<string | null>(null);

  // Hydrate once per page. Re-running on every `page` change would overwrite
  // whatever the user is typing each time a save invalidates the query.
  useEffect(() => {
    if (!page || page.id !== pageId) return;
    if (loaded.current?.pageId === pageId) return;
    touched.current = false;
    loaded.current = {
      pageId,
      title: page.title,
      content: page.content ?? "",
    };
    setTitle(page.title);
    setContent(page.content ?? "");
    setHydratedFor(pageId);
  }, [page, pageId]);

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  const queueSave = (patch: { title?: string; content?: string }) => {
    const base = loaded.current;

    // The editor emits an onChange as it hydrates, carrying an empty document
    // before the fetched content reaches it. Comparing values cannot filter
    // that out — the empty echo genuinely differs from the stored page — so
    // saving is gated on the user having actually typed here. No interaction,
    // no write, and a page can never be blanked by merely opening it.
    if (!touched.current) return;
    if (!base || base.pageId !== pageId) return;
    if (patch.content !== undefined && patch.content === base.content) return;
    if (patch.title !== undefined && patch.title === base.title) return;

    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      updatePage({ id: pageId, ...patch })
        .then(() => {
          const current = loaded.current;
          if (!current || current.pageId !== pageId) return;
          if (patch.title !== undefined) current.title = patch.title;
          if (patch.content !== undefined) current.content = patch.content;
        })
        .catch((error: unknown) => {
          toast.error(
            error instanceof Error ? error.message : "Failed to save page",
          );
        });
    }, AUTOSAVE_MS);
  };

  const handleCreateChild = async (parentId: string) => {
    try {
      const created = await createPage({
        workspaceId,
        title: "Untitled",
        parentId,
      });
      navigate({
        to: "/dashboard/workspace/$workspaceId/pages/$pageId",
        params: { workspaceId, pageId: created.id },
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create page",
      );
    }
  };

  const handleDelete = async () => {
    try {
      await deletePage(pageId);
      toast.success("Page deleted. Any nested pages were kept.");
      navigate({
        to: "/dashboard/workspace/$workspaceId",
        params: { workspaceId },
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete page",
      );
    }
  };

  return (
    <>
      <PageTitle title={page?.title ?? "Pages"} />
      <WorkspaceLayout title={page?.title ?? "Pages"}>
        {/* Sits inside Layout.Content (flex-1 min-h-0), so the app shell owns
            the outer chrome and only this row scrolls. Rendering an own
            full-height shell here put a second scroll container beside the
            app's, leaving a scrollbar stranded mid-window on wide screens. */}
        <div className="flex h-full min-h-0">
          <aside className="w-64 shrink-0 overflow-y-auto border-r border-border p-2">
            <div className="mb-2 flex items-center justify-between px-1">
              <span className="text-xs font-semibold uppercase text-muted-foreground">
                Pages
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  createPage({ workspaceId, title: "Untitled" })
                    .then((created) =>
                      navigate({
                        to: "/dashboard/workspace/$workspaceId/pages/$pageId",
                        params: { workspaceId, pageId: created.id },
                      }),
                    )
                    .catch(() => toast.error("Failed to create page"))
                }
              >
                New
              </Button>
            </div>
            <PageTree
              pages={pages}
              workspaceId={workspaceId}
              activePageId={pageId}
              onCreateChild={handleCreateChild}
            />
          </aside>

          <main className="min-w-0 flex-1 overflow-y-auto p-6">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : !page ? (
              <p className="text-sm text-muted-foreground">Page not found.</p>
            ) : (
              <div className="mx-auto max-w-3xl space-y-4">
                <div className="flex items-start gap-2">
                  <Input
                    value={title}
                    onKeyDown={() => {
                      touched.current = true;
                    }}
                    onPaste={() => {
                      touched.current = true;
                    }}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      queueSave({ title: e.target.value });
                    }}
                    placeholder="Untitled"
                    className="border-0 px-0 text-3xl font-bold shadow-none focus-visible:ring-0"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Delete page"
                    onClick={handleDelete}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* biome-ignore lint/a11y/noStaticElementInteractions: capture-phase
                  marker for real input; the editor owns its own focus handling */}
                <div
                  className="kaneo-page-content"
                  onKeyDownCapture={() => {
                    touched.current = true;
                  }}
                  onPasteCapture={() => {
                    touched.current = true;
                  }}
                >
                  {hydratedFor === pageId ? (
                    <TaskDescriptionEditor
                      key={pageId}
                      value={content}
                      onChange={(value) => {
                        // The editor emits an empty document while hydrating.
                        // Accepting it would overwrite the fetched content in
                        // state, blanking the editor it was meant to fill, so
                        // nothing is accepted until the user actually types.
                        if (!touched.current) return;
                        setContent(value);
                        queueSave({ content: value });
                      }}
                      placeholder="Start writing…"
                    />
                  ) : (
                    <p className="py-8 text-sm text-muted-foreground">
                      Loading content…
                    </p>
                  )}
                </div>

                <section className="border-t border-border pt-4">
                  <h2 className="mb-2 text-sm font-semibold">Linked tasks</h2>
                  {page.linkedTasks.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No tasks linked to this page yet.
                    </p>
                  ) : (
                    <ul className="space-y-1">
                      {page.linkedTasks.map((task) => (
                        <li
                          key={task.id}
                          className="group flex items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-accent/50"
                        >
                          <span className="font-mono text-xs text-muted-foreground">
                            #{task.number}
                          </span>
                          <span className="rounded border border-border px-1.5 py-0.5 text-[10px] uppercase text-muted-foreground">
                            {task.type}
                          </span>
                          <span className="min-w-0 flex-1 truncate">
                            {task.title}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Unlink task"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100"
                            onClick={() =>
                              unlinkTask(task.id).catch(() =>
                                toast.error("Failed to unlink task"),
                              )
                            }
                          >
                            <Link2Off className="h-3.5 w-3.5" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </div>
            )}
          </main>
        </div>
      </WorkspaceLayout>
    </>
  );
}
