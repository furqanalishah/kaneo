import { and, eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import {
  pageTable,
  pageTaskLinkTable,
  projectTable,
  taskTable,
} from "../../database/schema";

export async function linkTaskToPage(pageId: string, taskId: string) {
  const [page] = await db
    .select({ workspaceId: pageTable.workspaceId })
    .from(pageTable)
    .where(eq(pageTable.id, pageId))
    .limit(1);

  if (!page) {
    throw new HTTPException(404, { message: "Page not found" });
  }

  const [task] = await db
    .select({ workspaceId: projectTable.workspaceId })
    .from(taskTable)
    .innerJoin(projectTable, eq(taskTable.projectId, projectTable.id))
    .where(eq(taskTable.id, taskId))
    .limit(1);

  if (!task) {
    throw new HTTPException(404, { message: "Task not found" });
  }

  // Both sides are workspace-scoped; linking across workspaces would leak task
  // titles to a workspace the reader may not belong to.
  if (task.workspaceId !== page.workspaceId) {
    throw new HTTPException(400, {
      message: "Task and page belong to different workspaces",
    });
  }

  const [existing] = await db
    .select({ id: pageTaskLinkTable.id })
    .from(pageTaskLinkTable)
    .where(
      and(
        eq(pageTaskLinkTable.pageId, pageId),
        eq(pageTaskLinkTable.taskId, taskId),
      ),
    )
    .limit(1);

  if (existing) return existing; // idempotent

  const [link] = await db
    .insert(pageTaskLinkTable)
    .values({ pageId, taskId })
    .returning();

  return link;
}

export async function unlinkTaskFromPage(pageId: string, taskId: string) {
  const [link] = await db
    .delete(pageTaskLinkTable)
    .where(
      and(
        eq(pageTaskLinkTable.pageId, pageId),
        eq(pageTaskLinkTable.taskId, taskId),
      ),
    )
    .returning();

  if (!link) {
    throw new HTTPException(404, { message: "Link not found" });
  }

  return link;
}
