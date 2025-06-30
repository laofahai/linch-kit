'use client'

// Wrapper for react-hook-form to fix ESM import issues
import { 
  useForm as useFormOrig,
  Controller as ControllerOrig,
  FormProvider as FormProviderOrig,
  useFormContext as useFormContextOrig
} from 'react-hook-form'

export const useForm = useFormOrig
export const Controller = ControllerOrig
export const FormProvider = FormProviderOrig
export const useFormContext = useFormContextOrig

export type {
  Control,
  ControllerProps,
  FieldPath,
  FieldValues,
  UseFormReturn,
  FieldErrors,
} from 'react-hook-form'