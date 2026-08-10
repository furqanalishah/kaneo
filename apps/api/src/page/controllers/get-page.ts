import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import { pageTable, pageTaskLinkTable, taskTable } from "../../database/schema";

async function getPage(id: string) {
  const [page] = await db
    .select()
    .from(pageTable)
    .where(eq(pageTable.id, id))
    .limit(1);

  if (!page) {
    throw new HTTPException(404, { message: "Page not found" });
  }

  const linkedTasks = await db
    .select({
      id: taskTable.id,
      number: taskTable.number,
      title: taskTable.title,
      type: taskTable.type,
      status: taskTable.status,
      priority: taskTable.priority,
      projectId: taskTable.projectId,
    })
    .from(pageTaskLinkTable)
    .innerJoin(taskTable, eq(pageTaskLinkTable.taskId, taskTable.id))
    .where(eq(pageTaskLinkTable.pageId, id));

  return { ...page, linkedTasks };
}

export default getPage;
