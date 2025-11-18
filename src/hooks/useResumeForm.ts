import { useState, useCallback } from "react";

type ArrayElement<T> = T extends readonly (infer E)[] ? E : never;
type ItemWithId = { id: string };

export function useResumeForm<T extends Record<string, unknown>>(
  initialData: T,
) {
  const [data, setData] = useState<T>(initialData);

  const updateField = useCallback((field: keyof T, value: T[keyof T]) => {
    setData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const updateNestedField = useCallback(
    <K extends keyof T>(
      arrayField: K,
      id: string,
      field: string,
      value: unknown,
    ) => {
      setData((prev) => ({
        ...prev,
        [arrayField]: (prev[arrayField] as ItemWithId[]).map((item) =>
          item.id === id ? { ...item, [field]: value } : item,
        ),
      }));
    },
    [],
  );

  const addItem = useCallback(
    <K extends keyof T>(arrayField: K, newItem: ArrayElement<T[K]>) => {
      setData((prev) => ({
        ...prev,
        [arrayField]: [...(prev[arrayField] as ArrayElement<T[K]>[]), newItem],
      }));
    },
    [],
  );

  const removeItem = useCallback(
    <K extends keyof T>(arrayField: K, id: string) => {
      setData((prev) => ({
        ...prev,
        [arrayField]: (prev[arrayField] as ItemWithId[]).filter(
          (item) => item.id !== id,
        ),
      }));
    },
    [],
  );

  const moveItem = useCallback(
    <K extends keyof T>(
      arrayField: K,
      id: string,
      direction: "up" | "down",
    ) => {
      setData((prev) => {
        const array = [...(prev[arrayField] as ItemWithId[])];
        const index = array.findIndex((item) => item.id === id);

        if (
          (direction === "up" && index === 0) ||
          (direction === "down" && index === array.length - 1)
        ) {
          return prev;
        }

        const newIndex = direction === "up" ? index - 1 : index + 1;
        [array[index], array[newIndex]] = [array[newIndex], array[index]];

        // Ensure any `order` fields are updated to match new positions
        const normalized = array.map((item, idx) => ({
          ...(item as Record<string, unknown>),
          order: idx,
        }));

        return {
          ...prev,
          [arrayField]: normalized,
        };
      });
    },
    [],
  );

  const reset = useCallback(() => {
    setData(initialData);
  }, [initialData]);

  return {
    data,
    updateField,
    updateNestedField,
    addItem,
    removeItem,
    moveItem,
    reset,
  };
}
