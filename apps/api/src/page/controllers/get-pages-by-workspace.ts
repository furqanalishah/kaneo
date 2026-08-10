import { asc, eq } from "drizzle-orm";
import db from "../../database";
import { pageTable } from "../../database/schema";

/**
 * Returns the workspace's pages as a flat list ordered for tree assembly.
 * The client nests them by `parentId`; a wiki is small enough that a recursive
 * query buys nothing, and a flat payload keeps reordering cheap.
 *
 * `content` is omitted — listings only need titles, and page bodies are large.
 */
async function getPagesByWorkspace(workspaceId: string) {
  return db
    .select({
      id: pageTable.id,
      workspaceId: pageTable.workspaceId,
      parentId: pageTable.parentId,
      title: pageTable.title,
      icon: pageTable.icon,
      position: pageTable.position,
      createdBy: pageTable.createdBy,
      createdAt: pageTable.createdAt,
      updatedAt: pageTable.updatedAt,
    })
    .from(pageTable)
    .where(eq(pageTable.workspaceId, workspaceId))
    .orderBy(asc(pageTable.position), asc(pageTable.createdAt));
}

export default getPagesByWorkspace;
