"use client";

import { useState, useCallback } from "react";

interface UseBulkSelectionOptions {
  /** Called when selection changes */
  onSelectionChange?: (ids: Set<string>) => void;
}

interface UseBulkSelectionReturn {
  /** Currently selected IDs */
  selectedIds: Set<string>;
  /** Number of selected items */
  selectedCount: number;
  /** Check if all items are selected */
  isAllSelected: (itemIds: string[]) => boolean;
  /** Check if some (but not all) items are selected */
  isSomeSelected: (itemIds: string[]) => boolean;
  /** Select a single item */
  selectOne: (id: string) => void;
  /** Deselect a single item */
  deselectOne: (id: string) => void;
  /** Toggle selection of a single item */
  toggleOne: (id: string) => void;
  /** Select all items */
  selectAll: (ids: string[]) => void;
  /** Deselect all items */
  clearSelection: () => void;
  /** Toggle select all / deselect all */
  toggleAll: (ids: string[]) => void;
  /** Handle checkbox change for a single item */
  handleSelectOne: (id: string, checked: boolean) => void;
  /** Handle select-all checkbox change */
  handleSelectAll: (ids: string[]) => void;
  /** Set selection directly */
  setSelectedIds: (ids: Set<string>) => void;
}

/**
 * Hook for managing bulk selection state.
 * 
 * @example
 * ```tsx
 * const {
 *   selectedIds,
 *   handleSelectOne,
 *   handleSelectAll,
 *   clearSelection,
 *   isAllSelected,
 *   isSomeSelected,
 * } = useBulkSelection();
 * 
 * const itemIds = items.map(item => item.id);
 * const allSelected = isAllSelected(itemIds);
 * const someSelected = isSomeSelected(itemIds);
 * 
 * // Header checkbox
 * <Checkbox
 *   checked={allSelected ? true : someSelected ? "indeterminate" : false}
 *   onCheckedChange={() => handleSelectAll(itemIds)}
 * />
 * 
 * // Row checkbox
 * <Checkbox
 *   checked={selectedIds.has(item.id)}
 *   onCheckedChange={(checked) => handleSelectOne(item.id, !!checked)}
 * />
 * ```
 */
export function useBulkSelection(
  options: UseBulkSelectionOptions = {}
): UseBulkSelectionReturn {
  const { onSelectionChange } = options;
  const [selectedIds, setSelectedIdsInternal] = useState<Set<string>>(new Set());

  const setSelectedIds = useCallback(
    (ids: Set<string>) => {
      setSelectedIdsInternal(ids);
      onSelectionChange?.(ids);
    },
    [onSelectionChange]
  );

  const selectOne = useCallback(
    (id: string) => {
      setSelectedIds(new Set([...selectedIds, id]));
    },
    [selectedIds, setSelectedIds]
  );

  const deselectOne = useCallback(
    (id: string) => {
      const newSet = new Set(selectedIds);
      newSet.delete(id);
      setSelectedIds(newSet);
    },
    [selectedIds, setSelectedIds]
  );

  const toggleOne = useCallback(
    (id: string) => {
      if (selectedIds.has(id)) {
        deselectOne(id);
      } else {
        selectOne(id);
      }
    },
    [selectedIds, selectOne, deselectOne]
  );

  const selectAll = useCallback(
    (ids: string[]) => {
      setSelectedIds(new Set(ids));
    },
    [setSelectedIds]
  );

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, [setSelectedIds]);

  const isAllSelected = useCallback(
    (itemIds: string[]) => {
      return itemIds.length > 0 && itemIds.every((id) => selectedIds.has(id));
    },
    [selectedIds]
  );

  const isSomeSelected = useCallback(
    (itemIds: string[]) => {
      return itemIds.some((id) => selectedIds.has(id)) && !isAllSelected(itemIds);
    },
    [selectedIds, isAllSelected]
  );

  const toggleAll = useCallback(
    (ids: string[]) => {
      if (isAllSelected(ids)) {
        clearSelection();
      } else {
        selectAll(ids);
      }
    },
    [isAllSelected, clearSelection, selectAll]
  );

  const handleSelectOne = useCallback(
    (id: string, checked: boolean) => {
      if (checked) {
        selectOne(id);
      } else {
        deselectOne(id);
      }
    },
    [selectOne, deselectOne]
  );

  const handleSelectAll = useCallback(
    (ids: string[]) => {
      toggleAll(ids);
    },
    [toggleAll]
  );

  return {
    selectedIds,
    selectedCount: selectedIds.size,
    isAllSelected,
    isSomeSelected,
    selectOne,
    deselectOne,
    toggleOne,
    selectAll,
    clearSelection,
    toggleAll,
    handleSelectOne,
    handleSelectAll,
    setSelectedIds,
  };
}
