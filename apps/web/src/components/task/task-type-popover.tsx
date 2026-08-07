import { Check } from "lucide-react";
import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  TASK_TYPES,
  type TaskType,
  taskTypeColors,
  taskTypeIcons,
  taskTypeLabels,
  toTaskType,
} from "@/constants/task-types";
import { useUpdateTask } from "@/hooks/mutations/task/use-update-task";
import { useWorkspacePermission } from "@/hooks/use-workspace-permission";
import { cn } from "@/lib/cn";
import { toast } from "@/lib/toast";
import type Task from "@/types/task";

type TaskTypePopoverProps = {
  task: Task;
  children: React.ReactNode;
};

export default function TaskTypePopover({
  task,
  children,
}: TaskTypePopoverProps) {
  const [open, setOpen] = useState(false);
  const { mutateAsync: updateTask } = useUpdateTask();
  const { canManageTasks } = useWorkspacePermission();
  const canEdit = canManageTasks();

  const currentType = toTaskType(task.type);

  const handleSelect = async (type: TaskType) => {
    setOpen(false);
    if (type === currentType) return;

    try {
      await updateTask({ ...task, type });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update task type",
      );
    }
  };

  if (!canEdit) {
    return <>{children}</>;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-48 p-1" align="start">
        <div className="space-y-1">
          {TASK_TYPES.map((value) => {
            const Icon = taskTypeIcons[value];
            return (
              <button
                key={value}
                type="button"
                className="w-full flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-accent/50 text-left transition-colors h-8 rounded"
                onClick={() => handleSelect(value)}
              >
                <Icon className={cn("h-4 w-4", taskTypeColors[value])} />
                <span className="text-sm">{taskTypeLabels[value]}</span>
                {currentType === value && <Check className="ml-auto h-4 w-4" />}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
