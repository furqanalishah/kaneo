import { Hono } from "hono";
import { describeRoute, validator } from "hono-openapi";
import * as v from "valibot";
import { requireWorkspacePermission } from "../utils/require-workspace-permission";
import { workspaceAccess } from "../utils/workspace-access-middleware";
import createPage from "./controllers/create-page";
import deletePage from "./controllers/delete-page";
import getPage from "./controllers/get-page";
import getPagesByWorkspace from "./controllers/get-pages-by-workspace";
import { linkTaskToPage, unlinkTaskFromPage } from "./controllers/link-task";
import updatePage from "./controllers/update-page";

const nonEmpty = v.pipe(v.string(), v.minLength(1));

const page = new Hono<{ Variables: { userId: string } }>()
  .get(
    "/workspace/:workspaceId",
    describeRoute({
      operationId: "getWorkspacePages",
      tags: ["Pages"],
      description:
        "List all pages in a workspace as a flat array; nest by parentId",
      responses: { 200: { description: "Pages in the workspace" } },
    }),
    validator("param", v.object({ workspaceId: v.string() })),
    workspaceAccess.fromParam(),
    async (c) => {
      const { workspaceId } = c.req.valid("param");
      return c.json(await getPagesByWorkspace(workspaceId));
    },
  )
  .get(
    "/:id",
    describeRoute({
      operationId: "getPage",
      tags: ["Pages"],
      description: "Get a page with its content and linked tasks",
      responses: { 200: { description: "The page" } },
    }),
    validator("param", v.object({ id: v.string() })),
    workspaceAccess.fromPage(),
    async (c) => {
      const { id } = c.req.valid("param");
      return c.json(await getPage(id));
    },
  )
  .post(
    "/",
    describeRoute({
      operationId: "createPage",
      tags: ["Pages"],
      description: "Create a page, optionally nested under a parent",
      responses: { 200: { description: "The created page" } },
    }),
    validator(
      "json",
      v.object({
        workspaceId: nonEmpty,
        title: nonEmpty,
        content: v.optional(v.string()),
        icon: v.optional(v.string()),
        parentId: v.optional(v.nullable(v.string())),
      }),
    ),
    workspaceAccess.fromBody(),
    requireWorkspacePermission({ task: ["create"] }),
    async (c) => {
      const body = c.req.valid("json");
      const page = await createPage({ ...body, createdBy: c.get("userId") });
      return c.json(page);
    },
  )
  .put(
    "/:id",
    describeRoute({
      operationId: "updatePage",
      tags: ["Pages"],
      description:
        "Partially update a page; only supplied fields are written. Rejects a parent that would create a cycle.",
      responses: { 200: { description: "The updated page" } },
    }),
    validator("param", v.object({ id: v.string() })),
    validator(
      "json",
      v.object({
        title: v.optional(nonEmpty),
        content: v.optional(v.string()),
        icon: v.optional(v.nullable(v.string())),
        parentId: v.optional(v.nullable(v.string())),
        position: v.optional(v.number()),
      }),
    ),
    workspaceAccess.fromPage(),
    requireWorkspacePermission({ task: ["update"] }),
    async (c) => {
      const { id } = c.req.valid("param");
      return c.json(await updatePage(id, c.req.valid("json")));
    },
  )
  .delete(
    "/:id",
    describeRoute({
      operationId: "deletePage",
      tags: ["Pages"],
      description:
        "Delete a page. Child pages are preserved and become root pages.",
      responses: { 200: { description: "The deleted page" } },
    }),
    validator("param", v.object({ id: v.string() })),
    workspaceAccess.fromPage(),
    requireWorkspacePermission({ task: ["delete"] }),
    async (c) => {
      const { id } = c.req.valid("param");
      return c.json(await deletePage(id));
    },
  )
  .post(
    "/:id/task",
    describeRoute({
      operationId: "linkTaskToPage",
      tags: ["Pages"],
      description: "Link a task to a page. Idempotent.",
      responses: { 200: { description: "The link" } },
    }),
    validator("param", v.object({ id: v.string() })),
    validator("json", v.object({ taskId: nonEmpty })),
    workspaceAccess.fromPage(),
    requireWorkspacePermission({ task: ["update"] }),
    async (c) => {
      const { id } = c.req.valid("param");
      const { taskId } = c.req.valid("json");
      return c.json(await linkTaskToPage(id, taskId));
    },
  )
  .delete(
    "/:id/task/:taskId",
    describeRoute({
      operationId: "unlinkTaskFromPage",
      tags: ["Pages"],
      description: "Remove a task link from a page",
      responses: { 200: { description: "The removed link" } },
    }),
    validator("param", v.object({ id: v.string(), taskId: v.string() })),
    workspaceAccess.fromPage(),
    requireWorkspacePermission({ task: ["update"] }),
    async (c) => {
      const { id, taskId } = c.req.valid("param");
      return c.json(await unlinkTaskFromPage(id, taskId));
    },
  );

export default page;
