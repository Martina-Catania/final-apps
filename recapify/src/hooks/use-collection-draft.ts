import { useCallback, useState } from "react";

type FieldErrors<Field extends string> = Partial<Record<Field, string>>;

type UseCollectionDraftOptions<Item extends { key: string }> = {
  initialItems: Item[];
  initialNextIndex: number;
  createItem: (index: number) => Item;
};

type UseCollectionDraftResult<Item extends { key: string }, Field extends string> = {
  items: Item[];
  setItems: (value: Item[] | ((current: Item[]) => Item[])) => void;
  errors: Record<string, FieldErrors<Field>>;
  setErrors: (
    value:
      | Record<string, FieldErrors<Field>>
      | ((current: Record<string, FieldErrors<Field>>) => Record<string, FieldErrors<Field>>)
  ) => void;
  nextIndex: number;
  setNextIndex: (value: number | ((current: number) => number)) => void;
  addItem: () => void;
  removeItem: (key: string) => void;
  updateField: (key: string, field: Field, value: string) => void;
};

export function useCollectionDraft<
  Item extends { key: string },
  Field extends string,
>({
  initialItems,
  initialNextIndex,
  createItem,
}: UseCollectionDraftOptions<Item>): UseCollectionDraftResult<Item, Field> {
  const [items, setItems] = useState<Item[]>(initialItems);
  const [errors, setErrors] = useState<Record<string, FieldErrors<Field>>>({});
  const [nextIndex, setNextIndex] = useState(initialNextIndex);

  const addItem = useCallback(() => {
    setItems((current) => [...current, createItem(nextIndex)]);
    setNextIndex((current) => current + 1);
  }, [createItem, nextIndex]);

  const removeItem = useCallback((key: string) => {
    setItems((current) => current.filter((item) => item.key !== key));

    setErrors((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
  }, []);

  const updateField = useCallback((key: string, field: Field, value: string) => {
    setItems((current) =>
      current.map((item) => (item.key === key ? { ...item, [field]: value } : item)),
    );

    setErrors((current) => {
      const nextForItem = current[key];

      if (!nextForItem || !nextForItem[field]) {
        return current;
      }

      return {
        ...current,
        [key]: {
          ...nextForItem,
          [field]: undefined,
        },
      };
    });
  }, []);

  return {
    items,
    setItems,
    errors,
    setErrors,
    nextIndex,
    setNextIndex,
    addItem,
    removeItem,
    updateField,
  };
}
