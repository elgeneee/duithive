import { cn } from "@/lib/utils";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { type HTMLAttributes } from "react";

type TItem = {
  id: string;
  name: string;
  icon: JSX.Element;
};

type Props = {
  item: TItem;
} & HTMLAttributes<HTMLDivElement>;

export const SortableItem = ({ item }: Props) => {
  const sortable = useSortable({ id: item.id });
  const {
    attributes,
    listeners,
    isDragging,
    setNodeRef,
    transform,
    transition,
  } = sortable;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex w-full items-center justify-between rounded-md border border-athens-gray-200/60 bg-white p-4 shadow-md",
        isDragging ? "opacity-40" : "opacity-100"
      )}
    >
      <div className="flex items-center space-x-3">
        <div className="bg-violet rounded-sm bg-violet-600/30 p-1">
          {item.icon}
        </div>
        <span>{item.name}</span>
      </div>
      <button
        className={cn(isDragging ? "cursor-grabbing" : "cursor-grab")}
        {...attributes}
        {...listeners}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#B0BAC9"
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="lucide lucide-grip-vertical"
        >
          <circle cx="9" cy="12" r="1" />
          <circle cx="9" cy="5" r="1" />
          <circle cx="9" cy="19" r="1" />
          <circle cx="15" cy="12" r="1" />
          <circle cx="15" cy="5" r="1" />
          <circle cx="15" cy="19" r="1" />
        </svg>
      </button>
    </div>
  );
};
