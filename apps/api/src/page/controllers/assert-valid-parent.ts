import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import { pageTable } from "../../database/schema";

/** Depth guard: a corrupted parent chain must not spin forever. */
const MAX_DEPTH = 100;

/**
 * Rejects a parent that would break the tree.
 *
 * Without this a page could be made its own ancestor, which no SQL constraint
 * prevents — the rows stay valid while the subtree detaches from every root and
 * any recursive walk loops. Checked on create and on re-parent.
 */
export async function assertValidParent(
  parentId: string,
  workspaceId: string,
  pageId?: string,
): Promise<void> {
  if (pageId && parentId === pageId) {
    throw new HTTPException(400, {
      message: "A page cannot be its own parent",
    });
  }

  const [parent] = await db
    .select({ id: pageTable.id, workspaceId: pageTable.workspaceId })
    .from(pageTable)
    .where(eq(pageTable.id, parentId))
    .limit(1);

  if (!parent) {
    throw new HTTPException(404, { message: "Parent page not found" });
  }

  if (parent.workspaceId !== workspaceId) {
    throw new HTTPException(400, {
      message: "Parent page belongs to a different workspace",
    });
  }

  if (!pageId) return;

  // Walk up from the proposed parent; meeting this page means the move would
  // close a cycle.
  let cursor: string | null = parentId;
  for (let depth = 0; cursor && depth < MAX_DEPTH; depth++) {
    if (cursor === pageId) {
      throw new HTTPException(400, {
        message: "A page cannot be moved beneath one of its own descendants",
      });
    }
    const [row]: { parentId: string | null }[] = await db
      .select({ parentId: pageTable.parentId })
      .from(pageTable)
      .where(eq(pageTable.id, cursor))
      .limit(1);
    cursor = row?.parentId ?? null;
  }
}
