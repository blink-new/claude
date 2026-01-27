"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";

interface SelectableItem {
  id: string;
  name: string;
  // Add other fields as needed
}

interface SelectableTableProps<T extends SelectableItem> {
  items: T[];
  isLoading?: boolean;
  selectedIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
  onRowClick?: (id: string) => void;
  /** Render function for additional columns */
  renderRow?: (item: T) => React.ReactNode;
  /** Column headers (excluding checkbox) */
  columns?: { key: string; label: string; className?: string }[];
}

export function SelectableTable<T extends SelectableItem>({
  items,
  isLoading,
  selectedIds,
  onSelectionChange,
  onRowClick,
  renderRow,
  columns = [{ key: "name", label: "Name" }],
}: SelectableTableProps<T>) {
  // Selection logic
  const allSelected = items.length > 0 && items.every((item) => selectedIds.has(item.id));
  const someSelected = items.some((item) => selectedIds.has(item.id)) && !allSelected;

  const handleSelectAll = () => {
    if (allSelected) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(items.map((item) => item.id)));
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSet = new Set(selectedIds);
    if (checked) {
      newSet.add(id);
    } else {
      newSet.delete(id);
    }
    onSelectionChange(newSet);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
            <Skeleton className="h-4 w-4" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Empty state
  if (items.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed rounded-lg">
        <p className="text-muted-foreground">No items found</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            {/* Checkbox column - always first */}
            <TableHead className="w-12">
              <Checkbox
                checked={allSelected ? true : someSelected ? "indeterminate" : false}
                onCheckedChange={handleSelectAll}
                aria-label="Select all"
              />
            </TableHead>
            {/* Dynamic columns */}
            {columns.map((col) => (
              <TableHead key={col.key} className={col.className}>
                {col.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow
              key={item.id}
              className={onRowClick ? "cursor-pointer" : undefined}
              onClick={() => onRowClick?.(item.id)}
            >
              {/* Row checkbox - stop propagation to prevent row click */}
              <TableCell onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={selectedIds.has(item.id)}
                  onCheckedChange={(checked) => handleSelectOne(item.id, !!checked)}
                  aria-label={`Select ${item.name}`}
                />
              </TableCell>
              {/* Custom row render or default name column */}
              {renderRow ? (
                renderRow(item)
              ) : (
                <TableCell>
                  <span className="font-medium">{item.name}</span>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
