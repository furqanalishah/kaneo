import { and, eq, isNull, max } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import { pageTable } from "../../database/schema";
import { assertValidParent } from "./assert-valid-parent";

async function createPage({
  workspaceId,
  title,
  content,
  icon,
  parentId,
  createdBy,
}: {
  workspaceId: string;
  title: string;
  content?: string;
  icon?: string;
  parentId?: string | null;
  createdBy?: string;
}) {
  if (parentId) {
    await assertValidParent(parentId, workspaceId);
  }

  const [maxPosition] = await db
    .select({ value: max(pageTable.position) })
    .from(pageTable)
    .where(
      and(
        eq(pageTable.workspaceId, workspaceId),
        parentId
          ? eq(pageTable.parentId, parentId)
          : isNull(pageTable.parentId),
      ),
    );

  const [page] = await db
    .insert(pageTable)
    .values({
      workspaceId,
      title,
      content: content ?? "",
      icon: icon ?? null,
      parentId: parentId ?? null,
      position: (maxPosition?.value ?? 0) + 1,
      createdBy: createdBy ?? null,
    })
    .returning();

  if (!page) {
    throw new HTTPException(500, { message: "Failed to create page" });
  }

  return page;
}

export default createPage;
