"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { X, Trash2 } from "lucide-react";

interface BulkActionsToolbarProps {
  selectedIds: Set<string>;
  onDelete: () => void;
  onClearSelection: () => void;
  isLoading?: boolean;
  /** Label for items being deleted (e.g., "job", "candidate") */
  itemLabel?: string;
}

export function BulkActionsToolbar({
  selectedIds,
  onDelete,
  onClearSelection,
  isLoading = false,
  itemLabel = "item",
}: BulkActionsToolbarProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const selectedCount = selectedIds.size;
  const pluralLabel = selectedCount === 1 ? itemLabel : `${itemLabel}s`;

  const handleDelete = () => {
    onDelete();
    setDeleteDialogOpen(false);
  };

  // Hide when nothing selected
  if (selectedCount === 0) {
    return null;
  }

  return (
    <>
      {/* Floating toolbar - fixed bottom center with entrance animation */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-200">
        <div className="flex items-center gap-2 bg-background border rounded-lg shadow-lg px-4 py-3">
          {/* Selected count with clear button */}
          <div className="flex items-center gap-2 pr-3 border-r">
            <span className="text-sm font-medium">
              {selectedCount} selected
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={onClearSelection}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* 
            Add your custom action buttons here.
            Example:
            
            <Button variant="outline" size="sm" onClick={onExport} disabled={isLoading}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          */}

          {/* Delete button - destructive action with confirmation */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDeleteDialogOpen(true)}
            disabled={isLoading}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {pluralLabel}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedCount} {pluralLabel}?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete {selectedCount} {pluralLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
