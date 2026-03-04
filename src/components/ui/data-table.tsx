"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

interface Column<T> {
  key: string;
  label: string;
  render?: (item: T) => ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (item: T) => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  onRowClick,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const sortedData = [...data].sort((a, b) => {
    if (!sortKey) return 0;
    const aVal = a[sortKey];
    const bVal = b[sortKey];
    if (aVal == null || bVal == null) return 0;
    const comparison = String(aVal).localeCompare(String(bVal), undefined, {
      numeric: true,
    });
    return sortDirection === "asc" ? comparison : -comparison;
  });

  return (
    <div className="overflow-x-auto rounded-xl border border-ptba-light-gray">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-ptba-navy text-white">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  "px-4 py-3 text-left font-medium whitespace-nowrap",
                  col.sortable && "cursor-pointer select-none hover:bg-ptba-navy-dark"
                )}
                onClick={() => col.sortable && handleSort(col.key)}
              >
                <span className="inline-flex items-center gap-1">
                  {col.label}
                  {col.sortable && sortKey === col.key && (
                    <span className="text-xs">
                      {sortDirection === "asc" ? "\u25B2" : "\u25BC"}
                    </span>
                  )}
                  {col.sortable && sortKey !== col.key && (
                    <span className="text-xs opacity-40">{"\u25B2"}</span>
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((item, rowIndex) => (
            <tr
              key={rowIndex}
              className={cn(
                rowIndex % 2 === 0 ? "bg-white" : "bg-ptba-off-white",
                "hover:bg-ptba-section-bg transition-colors",
                onRowClick && "cursor-pointer"
              )}
              onClick={() => onRowClick?.(item)}
            >
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 text-ptba-charcoal">
                  {col.render
                    ? col.render(item)
                    : (item[col.key] as ReactNode) ?? ""}
                </td>
              ))}
            </tr>
          ))}
          {sortedData.length === 0 && (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-8 text-center text-ptba-gray"
              >
                No data available
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
