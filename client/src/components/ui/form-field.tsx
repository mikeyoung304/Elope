import { Label } from "./label";
import { Input } from "./input";
import { Textarea } from "./textarea";
import type { ReactNode } from "react";

interface BaseFormFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  disabled?: boolean;
  required?: boolean;
  helperText?: string;
  error?: string;
  className?: string;
}

interface InputFormFieldProps extends BaseFormFieldProps {
  type?: "text" | "email" | "number" | "url" | "password";
  placeholder?: string;
}

interface TextareaFormFieldProps extends BaseFormFieldProps {
  rows?: number;
  placeholder?: string;
}

type FormFieldProps =
  | (InputFormFieldProps & { variant?: "input" })
  | (TextareaFormFieldProps & { variant: "textarea" });

/**
 * Reusable form field component with label, input/textarea, and helper text
 * Provides consistent styling across admin and tenant-admin forms
 *
 * @example
 * ```tsx
 * <FormField
 *   id="email"
 *   label="Email Address"
 *   type="email"
 *   value={email}
 *   onChange={(e) => setEmail(e.target.value)}
 *   required
 *   helperText="We'll never share your email"
 * />
 * ```
 */
export function FormField(props: FormFieldProps) {
  const {
    id,
    label,
    value,
    onChange,
    disabled = false,
    required = false,
    helperText,
    error,
    className = "",
    variant = "input",
  } = props;

  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor={id} className="text-macon-navy-100 text-lg">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>

      {variant === "textarea" ? (
        <Textarea
          id={id}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          rows={(props as TextareaFormFieldProps).rows || 4}
          placeholder={(props as TextareaFormFieldProps).placeholder}
          className="bg-macon-navy-900 border-macon-navy-600 text-macon-navy-50 placeholder:text-macon-navy-400 focus:border-macon-navy-500 focus:ring-macon-navy-500 text-lg"
        />
      ) : (
        <Input
          id={id}
          type={(props as InputFormFieldProps).type || "text"}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          placeholder={(props as InputFormFieldProps).placeholder}
          className="bg-macon-navy-900 border-macon-navy-600 text-macon-navy-50 placeholder:text-macon-navy-400 focus:border-macon-navy-500 focus:ring-macon-navy-500 text-lg"
        />
      )}

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {helperText && !error && (
        <p className="text-base text-macon-navy-200">{helperText}</p>
      )}
    </div>
  );
}
