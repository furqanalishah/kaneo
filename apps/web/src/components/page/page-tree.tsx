import { Link } from "@tanstack/react-router";
import { ChevronDown, ChevronRight, FileText, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

export type PageNode = {
  id: string;
  parentId: string | null;
  title: string;
  icon: string | null;
  position: number;
};

type TreeNode = PageNode & { children: TreeNode[] };

/**
 * Builds the nested tree from the flat API payload.
 *
 * A page whose parent is missing from the list is treated as a root rather than
 * dropped — otherwise a parent the caller cannot see (or a row deleted mid-flight)
 * would make its whole subtree vanish from the sidebar with no way to reach it.
 */
export function buildPageTree(pages: PageNode[]): TreeNode[] {
  const byId = new Map<string, TreeNode>();
  for (const page of pages) {
    byId.set(page.id, { ...page, children: [] });
  }

  const roots: TreeNode[] = [];
  for (const node of byId.values()) {
    const parent = node.parentId ? byId.get(node.parentId) : undefined;
    if (parent && parent.id !== node.id) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const sort = (nodes: TreeNode[]) => {
    nodes.sort(
      (a, b) => a.position - b.position || a.title.localeCompare(b.title),
    );
    for (const node of nodes) sort(node.children);
  };
  sort(roots);

  return roots;
}

function TreeItem({
  node,
  workspaceId,
  activePageId,
  depth,
  onCreateChild,
}: {
  node: TreeNode;
  workspaceId: string;
  activePageId?: string;
  depth: number;
  onCreateChild?: (parentId: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children.length > 0;

  return (
    <div>
      <div
        className={cn(
          "group flex items-center gap-1 rounded-md pr-1 hover:bg-accent/50",
          activePageId === node.id && "bg-accent/60",
        )}
        style={{ paddingLeft: `${depth * 12}px` }}
      >
        {hasChildren ? (
          <button
            type="button"
            aria-label={expanded ? "Collapse" : "Expand"}
            className="p-0.5 text-muted-foreground hover:text-foreground"
            onClick={() => setExpanded((open) => !open)}
          >
            {expanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </button>
        ) : (
          <span className="w-4.5" />
        )}

        <Link
          to="/dashboard/workspace/$workspaceId/pages/$pageId"
          params={{ workspaceId, pageId: node.id }}
          className="flex min-w-0 flex-1 items-center gap-1.5 py-1 text-sm"
        >
          <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate">{node.title}</span>
        </Link>

        {onCreateChild && (
          <Button
            variant="ghost"
            size="icon"
            aria-label="Add nested page"
            className="h-6 w-6 opacity-0 group-hover:opacity-100"
            onClick={() => onCreateChild(node.id)}
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {hasChildren && expanded && (
        <div>
          {node.children.map((child) => (
            <TreeItem
              key={child.id}
              node={child}
              workspaceId={workspaceId}
              activePageId={activePageId}
              depth={depth + 1}
              onCreateChild={onCreateChild}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function PageTree({
  pages,
  workspaceId,
  activePageId,
  onCreateChild,
}: {
  pages: PageNode[];
  workspaceId: string;
  activePageId?: string;
  onCreateChild?: (parentId: string) => void;
}) {
  const tree = useMemo(() => buildPageTree(pages), [pages]);

  if (tree.length === 0) {
    return (
      <p className="px-2 py-1.5 text-sm text-muted-foreground">No pages yet.</p>
    );
  }

  return (
    <div className="space-y-0.5">
      {tree.map((node) => (
        <TreeItem
          key={node.id}
          node={node}
          workspaceId={workspaceId}
          activePageId={activePageId}
          depth={0}
          onCreateChild={onCreateChild}
        />
      ))}
    </div>
  );
}
