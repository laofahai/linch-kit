"use client"

import * as React from "react"
import { useForm, UseFormReturn, FieldValues, Path } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

import { Button } from "../ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form"
import { Input } from "../ui/input"
import { Textarea } from "../ui/textarea"
import { Checkbox } from "../ui/checkbox"
import { Switch } from "../ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select"

/**
 * Field type definitions for FormBuilder
 */
export type FormFieldType = 
  | "text" 
  | "email" 
  | "password" 
  | "number" 
  | "textarea" 
  | "select" 
  | "checkbox" 
  | "switch"
  | "date"

/**
 * Field configuration for FormBuilder
 */
export interface FormFieldConfig {
  /** Field name (must match schema key) */
  name: string
  /** Field type */
  type: FormFieldType
  /** Field label */
  label: string
  /** Field description */
  description?: string
  /** Placeholder text */
  placeholder?: string
  /** Whether field is required */
  required?: boolean
  /** Options for select fields */
  options?: Array<{ label: string; value: string | number }>
  /** Field layout configuration */
  layout?: {
    /** Column span (1-12) */
    colSpan?: number
    /** Row span */
    rowSpan?: number
  }
  /** Custom validation rules */
  validation?: {
    /** Minimum length */
    minLength?: number
    /** Maximum length */
    maxLength?: number
    /** Minimum value (for numbers) */
    min?: number
    /** Maximum value (for numbers) */
    max?: number
    /** Custom pattern */
    pattern?: RegExp
    /** Custom validation function */
    custom?: (value: any) => string | boolean
  }
}

/**
 * Layout configuration for FormBuilder
 */
export interface FormLayoutConfig {
  /** Layout type */
  type?: "vertical" | "horizontal" | "grid"
  /** Grid columns (for grid layout) */
  columns?: number
  /** Field spacing */
  spacing?: "sm" | "md" | "lg"
}

/**
 * Props for FormBuilder component
 */
export interface FormBuilderProps<TFormData extends FieldValues> {
  /** Form fields configuration */
  fields: FormFieldConfig[]
  /** Zod schema for validation */
  schema: z.ZodSchema<TFormData>
  /** Default form values */
  defaultValues?: Partial<TFormData>
  /** Form layout configuration */
  layout?: FormLayoutConfig
  /** Submit handler */
  onSubmit: (data: TFormData) => void | Promise<void>
  /** Submit button text */
  submitText?: string
  /** Loading state */
  loading?: boolean
  /** Form instance (for external control) */
  form?: UseFormReturn<TFormData>
  /** Additional form actions */
  actions?: React.ReactNode
}

/**
 * Dynamic form builder component based on field configuration and Zod schema
 * 
 * @example
 * ```tsx
 * const userSchema = z.object({
 *   name: z.string().min(1, "Name is required"),
 *   email: z.string().email("Invalid email"),
 *   role: z.enum(["admin", "user"]),
 *   active: z.boolean(),
 * })
 * 
 * const fields: FormFieldConfig[] = [
 *   {
 *     name: "name",
 *     type: "text",
 *     label: "Full Name",
 *     placeholder: "Enter your name",
 *     required: true,
 *   },
 *   {
 *     name: "email",
 *     type: "email",
 *     label: "Email Address",
 *     placeholder: "Enter your email",
 *     required: true,
 *   },
 *   {
 *     name: "role",
 *     type: "select",
 *     label: "Role",
 *     options: [
 *       { label: "Admin", value: "admin" },
 *       { label: "User", value: "user" },
 *     ],
 *   },
 *   {
 *     name: "active",
 *     type: "switch",
 *     label: "Active",
 *     description: "Enable user account",
 *   },
 * ]
 * 
 * <FormBuilder
 *   fields={fields}
 *   schema={userSchema}
 *   onSubmit={handleSubmit}
 *   layout={{ type: "grid", columns: 2 }}
 * />
 * ```
 */
export function FormBuilder<TFormData extends FieldValues>({
  fields,
  schema,
  defaultValues,
  layout = {},
  onSubmit,
  submitText = "Submit",
  loading = false,
  form: externalForm,
  actions,
}: FormBuilderProps<TFormData>) {
  const internalForm = useForm<TFormData>({
    resolver: zodResolver(schema),
    defaultValues,
  })

  const form = externalForm || internalForm

  const {
    type: layoutType = "vertical",
    columns = 2,
    spacing = "md",
  } = layout

  const spacingClasses = {
    sm: "space-y-2",
    md: "space-y-4",
    lg: "space-y-6",
  }

  const gridClasses = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
  }

  const renderField = (fieldConfig: FormFieldConfig) => {
    const { name, type, label, description, placeholder, options } = fieldConfig

    return (
      <FormField
        key={name}
        control={form.control}
        name={name as Path<TFormData>}
        render={({ field }) => (
          <FormItem className={fieldConfig.layout?.colSpan ? `col-span-${fieldConfig.layout.colSpan}` : ""}>
            <FormLabel>{label}</FormLabel>
            <FormControl>
              {(() => {
                switch (type) {
                  case "text":
                  case "email":
                  case "password":
                    return (
                      <Input
                        type={type}
                        placeholder={placeholder}
                        {...field}
                      />
                    )
                  
                  case "number":
                    return (
                      <Input
                        type="number"
                        placeholder={placeholder}
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    )
                  
                  case "date":
                    return (
                      <Input
                        type="date"
                        {...field}
                      />
                    )
                  
                  case "textarea":
                    return (
                      <Textarea
                        placeholder={placeholder}
                        {...field}
                      />
                    )
                  
                  case "select":
                    return (
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder={placeholder || `Select ${label.toLowerCase()}`} />
                        </SelectTrigger>
                        <SelectContent>
                          {options?.map((option) => (
                            <SelectItem key={option.value} value={String(option.value)}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )
                  
                  case "checkbox":
                    return (
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          {placeholder || label}
                        </label>
                      </div>
                    )
                  
                  case "switch":
                    return (
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          {placeholder || label}
                        </label>
                      </div>
                    )
                  
                  default:
                    return (
                      <Input
                        placeholder={placeholder}
                        {...field}
                      />
                    )
                }
              })()}
            </FormControl>
            {description && <FormDescription>{description}</FormDescription>}
            <FormMessage />
          </FormItem>
        )}
      />
    )
  }

  const getLayoutClasses = () => {
    switch (layoutType) {
      case "grid":
        return `grid gap-4 ${gridClasses[columns as keyof typeof gridClasses] || gridClasses[2]}`
      case "horizontal":
        return "flex flex-wrap gap-4"
      default:
        return spacingClasses[spacing]
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className={getLayoutClasses()}>
          {fields.map(renderField)}
        </div>
        
        <div className="flex items-center justify-between pt-4">
          <div className="flex space-x-2">
            {actions}
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? "Submitting..." : submitText}
          </Button>
        </div>
      </form>
    </Form>
  )
}

/**
 * Hook to create form fields from Zod schema (utility for advanced usage)
 */
export function useFormFields<T extends z.ZodRawShape>(
  schema: z.ZodObject<T>
): Partial<FormFieldConfig>[] {
  return React.useMemo(() => {
    const shape = schema.shape
    const fields: Partial<FormFieldConfig>[] = []

    Object.entries(shape).forEach(([key, zodType]) => {
      const field: Partial<FormFieldConfig> = {
        name: key,
        label: key.charAt(0).toUpperCase() + key.slice(1),
      }

      // Infer field type from Zod type
      if (zodType instanceof z.ZodString) {
        field.type = "text"
      } else if (zodType instanceof z.ZodNumber) {
        field.type = "number"
      } else if (zodType instanceof z.ZodBoolean) {
        field.type = "switch"
      } else if (zodType instanceof z.ZodEnum) {
        field.type = "select"
        field.options = zodType.options.map((option: string) => ({
          label: option.charAt(0).toUpperCase() + option.slice(1),
          value: option,
        }))
      }

      fields.push(field)
    })

    return fields
  }, [schema])
}
