"use client"

import * as React from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { ArrowUp, ArrowDown, ArrowUpDown, GripVertical } from "lucide-react"
import { TableHead, TableCell } from "@/components/ui/table"
import { cn } from "@/lib/utils"

interface DraggableColumnHeaderProps<Key extends string> {
  columnKey: Key
  label: string
  sortable?: boolean
  align?: "left" | "right"
  draggable?: boolean
  className?: string
  sortColumn: Key | null
  sortDirection: "asc" | "desc" | null
  onSort: (column: Key) => void
}

export function DraggableColumnHeader<Key extends string>({
  columnKey,
  label,
  sortable = false,
  align = "left",
  draggable = true,
  className,
  sortColumn,
  sortDirection,
  onSort,
}: DraggableColumnHeaderProps<Key>) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: columnKey, disabled: !draggable })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const handleClick = () => {
    if (sortable) onSort(columnKey)
  }

  const alignClass = align === "right" ? "text-right" : ""
  const flexClass = align === "right" ? "justify-end" : ""

  const sortIcon =
    sortColumn === columnKey ? (
      sortDirection === "asc" ? (
        <ArrowUp className="h-4 w-4" />
      ) : sortDirection === "desc" ? (
        <ArrowDown className="h-4 w-4" />
      ) : (
        <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
      )
    ) : sortable ? (
      <ArrowUpDown className="h-4 w-4 text-muted-foreground opacity-50" />
    ) : null

  return (
    <TableHead
      ref={setNodeRef}
      style={style}
      className={cn(
        alignClass,
        className,
        sortable && "cursor-pointer select-none hover:bg-muted/50"
      )}
      onClick={handleClick}
    >
      <div className={cn("flex items-center gap-2", flexClass)}>
        {draggable && (
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab touch-none active:cursor-grabbing"
            suppressHydrationWarning
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
        {label}
        {sortIcon}
      </div>
    </TableHead>
  )
}

interface DraggableTableCellProps<Key extends string> {
  columnKey: Key
  className?: string
  children: React.ReactNode
}

export function DraggableTableCell<Key extends string>({
  columnKey,
  className,
  children,
}: DraggableTableCellProps<Key>) {
  const { setNodeRef, transform, transition, isDragging } = useSortable({
    id: columnKey,
    disabled: true,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <TableCell ref={setNodeRef} style={style} className={className}>
      {children}
    </TableCell>
  )
}
