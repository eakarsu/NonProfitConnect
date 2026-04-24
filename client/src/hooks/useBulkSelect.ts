import { useState, useCallback } from "react";

export function useBulkSelect<T extends number | string>() {
  const [selectedIds, setSelectedIds] = useState<Set<T>>(new Set());

  const toggle = useCallback((id: T) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback((ids: T[]) => {
    setSelectedIds(new Set(ids));
  }, []);

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const isSelected = useCallback((id: T) => selectedIds.has(id), [selectedIds]);

  const isAllSelected = useCallback(
    (ids: T[]) => ids.length > 0 && ids.every((id) => selectedIds.has(id)),
    [selectedIds]
  );

  return {
    selectedIds: Array.from(selectedIds),
    selectedCount: selectedIds.size,
    toggle,
    selectAll,
    deselectAll,
    isSelected,
    isAllSelected,
  };
}
