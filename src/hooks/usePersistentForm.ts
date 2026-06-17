import { useEffect } from "react";
import { UseFormReturn, FieldValues, Path, PathValue } from "react-hook-form";

/**
 * usePersistentForm synchronizes a React Hook Form state with sessionStorage.
 * It hydrates the form on mount and serializes changes incrementally.
 */
export function usePersistentForm<TFieldValues extends FieldValues>(
  formMethods: UseFormReturn<TFieldValues>,
  storageKey: string,
  excludeKeys: (keyof TFieldValues)[] = []
) {
  const { watch, setValue, getValues } = formMethods;

  // Hydrate on mount
  useEffect(() => {
    try {
      const storedData = sessionStorage.getItem(storageKey);
      if (storedData) {
        const parsed = JSON.parse(storedData) as Partial<TFieldValues>;
        Object.entries(parsed).forEach(([key, value]) => {
          if (!excludeKeys.includes(key as keyof TFieldValues) && value !== undefined && value !== null) {
            setValue(key as Path<TFieldValues>, value as PathValue<TFieldValues, Path<TFieldValues>>, {
              shouldDirty: true,
              shouldValidate: true,
            });
          }
        });
      }
    } catch (e) {
      console.warn("Failed to hydrate form state from sessionStorage:", e);
    }
  }, [storageKey, setValue, excludeKeys]);

  // Serialize on change
  useEffect(() => {
    const subscription = watch((value, { name, type }) => {
      try {
        const currentState = getValues();
        const payloadToStore = { ...currentState };
        // Remove excluded keys from storage
        excludeKeys.forEach((key) => {
          delete payloadToStore[key];
        });
        sessionStorage.setItem(storageKey, JSON.stringify(payloadToStore));
      } catch (e) {
        console.warn("Failed to serialize form state to sessionStorage:", e);
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, getValues, storageKey, excludeKeys]);

  const clearStorage = () => {
    sessionStorage.removeItem(storageKey);
  };

  return { clearStorage };
}
