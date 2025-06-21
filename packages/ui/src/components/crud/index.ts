/**
 * CRUD Components
 * 
 * Advanced components for Create, Read, Update, Delete operations
 * Built on top of shadcn/ui components with enhanced functionality
 */

// DataTable component with sorting, filtering, pagination, and actions
export { DataTable } from "./data-table"
export type {
    DataTableAction,
    DataTableConfig, DataTableProps
} from "./data-table"

// FormBuilder component for dynamic form generation
export { FormBuilder, useFormFields } from "./form-builder"
export type {
    FormBuilderProps,
    FormFieldConfig,
    FormFieldType,
    FormLayoutConfig
} from "./form-builder"

// SearchableSelect component with async search support
export { SearchableSelect } from "./searchable-select"
export type {
    SearchableSelectProps,
    SelectOption
} from "./searchable-select"

// Schema-driven components
export { SchemaDataTable, SchemaDataTableWithActions } from "./schema-data-table"
export type {
    SchemaDataTableProps,
    SchemaDataTableWithActionsProps
} from "./schema-data-table"

export { SchemaFormBuilder, SchemaFormField } from "./schema-form-builder"
export type {
    SchemaFormBuilderProps
} from "./schema-form-builder"

