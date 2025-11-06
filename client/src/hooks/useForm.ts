/**
 * Shared hook for form state management
 */

import { useState } from 'react';

export interface UseFormResult<T extends Record<string, any>> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  setErrors: React.Dispatch<React.SetStateAction<Partial<Record<keyof T, string>>>>;
  handleChange: (field: keyof T, value: any) => void;
  setValues: React.Dispatch<React.SetStateAction<T>>;
  reset: () => void;
}

/**
 * Hook for managing form state with validation
 */
export function useForm<T extends Record<string, any>>(
  initialValues: T
): UseFormResult<T> {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});

  const handleChange = (field: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when it changes
    setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const reset = () => {
    setValues(initialValues);
    setErrors({});
  };

  return { values, errors, setErrors, handleChange, setValues, reset };
}
