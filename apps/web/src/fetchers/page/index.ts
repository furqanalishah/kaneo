import { client } from "@kaneo/libs";

async function unwrap<T>(response: {
  ok: boolean;
  text: () => Promise<string>;
  json: () => Promise<T>;
}): Promise<T> {
  if (!response.ok) {
    throw new Error(await response.text());
  }
  return response.json();
}

export async function getWorkspacePages(workspaceId: string) {
  return unwrap(
    await client.page.workspace[":workspaceId"].$get({
      param: { workspaceId },
    }),
  );
}

export async function getPage(id: string) {
  return unwrap(await client.page[":id"].$get({ param: { id } }));
}

export async function createPage(input: {
  workspaceId: string;
  title: string;
  content?: string;
  icon?: string;
  parentId?: string | null;
}) {
  return unwrap(await client.page.$post({ json: input }));
}

export async function updatePage(
  id: string,
  patch: {
    title?: string;
    content?: string;
    icon?: string | null;
    parentId?: string | null;
    position?: number;
  },
) {
  return unwrap(await client.page[":id"].$put({ param: { id }, json: patch }));
}

export async function deletePage(id: string) {
  return unwrap(await client.page[":id"].$delete({ param: { id } }));
}

export async function linkTaskToPage(pageId: string, taskId: string) {
  return unwrap(
    await client.page[":id"].task.$post({
      param: { id: pageId },
      json: { taskId },
    }),
  );
}

export async function unlinkTaskFromPage(pageId: string, taskId: string) {
  return unwrap(
    await client.page[":id"].task[":taskId"].$delete({
      param: { id: pageId, taskId },
    }),
  );
}
