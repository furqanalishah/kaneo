import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import { pageTable } from "../../database/schema";

/**
 * Deletes one page. Children are not removed — the self-referencing foreign key
 * is ON DELETE SET NULL, so they survive as root pages. Losing a whole subtree
 * to a single click would be far worse than a few pages needing re-filing.
 */
async function deletePage(id: string) {
  const [page] = await db
    .delete(pageTable)
    .where(eq(pageTable.id, id))
    .returning();

  if (!page) {
    throw new HTTPException(404, { message: "Page not found" });
  }

  return page;
}

export default deletePage;
