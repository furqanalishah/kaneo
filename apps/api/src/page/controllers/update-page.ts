import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import { pageTable } from "../../database/schema";
import { assertValidParent } from "./assert-valid-parent";

/**
 * Partial update. Only the keys present in `patch` are written, so a client
 * saving the editor body cannot blank the title, and a re-parent cannot blank
 * the content.
 */
async function updatePage(
  id: string,
  patch: {
    title?: string;
    content?: string;
    icon?: string | null;
    parentId?: string | null;
    position?: number;
  },
) {
  const [existing] = await db
    .select({ id: pageTable.id, workspaceId: pageTable.workspaceId })
    .from(pageTable)
    .where(eq(pageTable.id, id))
    .limit(1);

  if (!existing) {
    throw new HTTPException(404, { message: "Page not found" });
  }

  if (patch.parentId) {
    await assertValidParent(patch.parentId, existing.workspaceId, id);
  }

  const values: Record<string, unknown> = {};
  if (patch.title !== undefined) values.title = patch.title;
  if (patch.content !== undefined) values.content = patch.content;
  if (patch.icon !== undefined) values.icon = patch.icon;
  if (patch.parentId !== undefined) values.parentId = patch.parentId;
  if (patch.position !== undefined) values.position = patch.position;

  if (Object.keys(values).length === 0) {
    const [unchanged] = await db
      .select()
      .from(pageTable)
      .where(eq(pageTable.id, id))
      .limit(1);
    return unchanged;
  }

  const [page] = await db
    .update(pageTable)
    .set(values)
    .where(eq(pageTable.id, id))
    .returning();

  if (!page) {
    throw new HTTPException(500, { message: "Failed to update page" });
  }

  return page;
}

export default updatePage;
