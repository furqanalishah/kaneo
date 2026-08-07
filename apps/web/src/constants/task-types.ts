import {
  Bookmark,
  Bug,
  CheckSquare,
  type LucideIcon,
  Layers,
  ListTree,
} from "lucide-react";

export const TASK_TYPES = [
  "epic",
  "story",
  "task",
  "sub-task",
  "bug",
] as const;

export type TaskType = (typeof TASK_TYPES)[number];

export const DEFAULT_TASK_TYPE: TaskType = "task";

export const taskTypeLabels: Record<TaskType, string> = {
  epic: "Epic",
  story: "Story",
  task: "Task",
  "sub-task": "Sub-task",
  bug: "Bug",
};

export const taskTypeIcons: Record<TaskType, LucideIcon> = {
  epic: Layers,
  story: Bookmark,
  task: CheckSquare,
  "sub-task": ListTree,
  bug: Bug,
};

export const taskTypeColors: Record<TaskType, string> = {
  epic: "text-purple-500 dark:text-purple-400",
  story: "text-blue-500 dark:text-blue-400",
  task: "text-zinc-500 dark:text-zinc-400",
  "sub-task": "text-teal-500 dark:text-teal-400",
  bug: "text-destructive-foreground",
};

export function isTaskType(value: unknown): value is TaskType {
  return (
    typeof value === "string" && (TASK_TYPES as readonly string[]).includes(value)
  );
}

export function toTaskType(value: unknown): TaskType {
  return isTaskType(value) ? value : DEFAULT_TASK_TYPE;
}
