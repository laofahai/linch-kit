'use client'

// Wrapper for react-hook-form to fix ESM import issues
import * as ReactHookForm from 'react-hook-form'

export const useForm = ReactHookForm.useForm
export const Controller = ReactHookForm.Controller
export const FormProvider = ReactHookForm.FormProvider
export const useFormContext = ReactHookForm.useFormContext

export type {
  Control,
  ControllerProps,
  FieldPath,
  FieldValues,
  UseFormReturn,
  FieldErrors,
} from 'react-hook-form'