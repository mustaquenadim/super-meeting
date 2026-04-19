"use client";

import * as React from "react";
import type { DragEndEvent } from "@dnd-kit/core";

export interface ColumnDefinition {
  label: string;
  sortable?: boolean;
  defaultVisible?: boolean;
  hideable?: boolean;
}

export interface UseDataTableOptions<Key extends string> {
  columns: Record<Key, ColumnDefinition>;
  defaultOrder: Key[];
}

export interface UseDataTableReturn<Key extends string> {
  columnVisibility: Record<Key, boolean>;
  sortColumn: Key | null;
  sortDirection: "asc" | "desc" | null;
  orderedVisibleColumns: Key[];
  handleSort: (column: Key) => void;
  handleDragEnd: (event: DragEndEvent) => void;
  toggleColumnVisibility: (column: Key) => void;
  sortRows: <T>(rows: T[], getSortVal: (row: T, col: Key) => string) => T[];
}

export function useDataTable<Key extends string>({
  columns,
  defaultOrder,
}: UseDataTableOptions<Key>): UseDataTableReturn<Key> {
  const [columnOrder, setColumnOrder] = React.useState<Key[]>(defaultOrder);
  const [columnVisibility, setColumnVisibility] = React.useState<
    Record<Key, boolean>
  >(() => {
    const vis: Record<string, boolean> = {};
    for (const key of defaultOrder) {
      vis[key] = columns[key]?.defaultVisible ?? true;
    }
    return vis as Record<Key, boolean>;
  });
  const [sortColumn, setSortColumn] = React.useState<Key | null>(null);
  const [sortDirection, setSortDirection] = React.useState<
    "asc" | "desc" | null
  >(null);

  const orderedVisibleColumns = React.useMemo(() => {
    return columnOrder.filter((key) => columnVisibility[key]);
  }, [columnOrder, columnVisibility]);

  const handleSort = React.useCallback((column: Key) => {
    setSortColumn((prevCol) => {
      setSortDirection((prevDir) => {
        if (prevCol === column) {
          if (prevDir === "asc") return "desc";
          if (prevDir === "desc") return null;
        }
        return "asc";
      });
      return column;
    });
  }, []);

  const handleDragEnd = React.useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setColumnOrder((prev) => {
      const idx = prev.indexOf(active.id as Key);
      const overIdx = prev.indexOf(over.id as Key);
      if (idx === -1 || overIdx === -1) return prev;
      const next = [...prev];
      const [removed] = next.splice(idx, 1);
      next.splice(overIdx, 0, removed);
      return next;
    });
  }, []);

  const toggleColumnVisibility = React.useCallback((column: Key) => {
    setColumnVisibility((prev) => ({
      ...prev,
      [column]: !prev[column],
    }));
  }, []);

  const sortRows = React.useCallback(
    <T,>(rows: T[], getSortVal: (row: T, col: Key) => string): T[] => {
      if (!sortColumn || !sortDirection) return rows;
      return [...rows].sort((a, b) => {
        const aVal = getSortVal(a, sortColumn);
        const bVal = getSortVal(b, sortColumn);
        const cmp = aVal.localeCompare(bVal);
        return sortDirection === "asc" ? cmp : -cmp;
      });
    },
    [sortColumn, sortDirection]
  );

  return {
    columnVisibility,
    sortColumn,
    sortDirection,
    orderedVisibleColumns,
    handleSort,
    handleDragEnd,
    toggleColumnVisibility,
    sortRows,
  };
}
