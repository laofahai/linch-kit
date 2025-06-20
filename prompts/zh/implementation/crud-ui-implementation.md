# @linch-kit/crud-ui Implementation Prompts

## 🎯 Implementation Overview

Create a comprehensive React UI component library for CRUD operations that integrates seamlessly with `@linch-kit/crud` core package.

## 📋 Implementation Checklist

### Phase 1: Package Setup (30 minutes)
- [ ] Create package structure
- [ ] Configure build system (tsup)
- [ ] Setup TypeScript configuration
- [ ] Configure peer dependencies
- [ ] Create basic package.json

### Phase 2: Core Components (4-6 hours)
- [ ] CRUDProvider context component
- [ ] CRUDList table component
- [ ] CRUDForm create/edit component
- [ ] CRUDDetail view component
- [ ] CRUDLayout page layout

### Phase 3: Field Components (2-3 hours)
- [ ] CRUDField wrapper component
- [ ] TextField, SelectField, DateField
- [ ] FileField, NumberField, BooleanField
- [ ] Custom field renderer system

### Phase 4: Integration & Testing (2-3 hours)
- [ ] Schema integration utilities
- [ ] Permission integration
- [ ] React hooks for CRUD operations
- [ ] Component testing setup

## 🚀 Step-by-Step Implementation

### Step 1: Package Initialization

```bash
# Create package directory
mkdir packages/crud-ui
cd packages/crud-ui

# Initialize package.json
```

**Prompt for package.json creation:**
```
Create a package.json for @linch-kit/crud-ui with the following requirements:
- Version: 0.1.0
- Description: "React UI components for CRUD operations in Linch Kit"
- Main exports: dist/index.js, dist/index.mjs, dist/index.d.ts
- Dependencies: react, react-dom, @linch-kit/crud, @linch-kit/schema, @linch-kit/auth-core
- PeerDependencies: react ^18.0.0, react-dom ^18.0.0
- DevDependencies: @types/react, @types/react-dom, typescript, tsup
- Scripts: build, type-check, lint, test
- Keywords: crud, ui, react, components, linch-kit
```

### Step 2: TypeScript Configuration

**Prompt for tsconfig.json:**
```
Create a TypeScript configuration for the crud-ui package that:
- Extends the base config from ../../configs/tsconfig.base.json
- Includes JSX support for React
- Enables strict mode
- Includes proper path mapping for @/* imports
- Excludes node_modules, dist, and test files from compilation
```

### Step 3: Core Context Provider

**Prompt for CRUDProvider implementation:**
```
Create a React context provider component (src/components/core/CRUDProvider.tsx) that:

1. Accepts a CRUDManager instance from @linch-kit/crud
2. Provides CRUD operations, permissions, and theme to child components
3. Manages loading states and error handling
4. Includes TypeScript generics for type safety
5. Provides hooks: useCRUD, useCRUDPermissions, useCRUDTheme

Requirements:
- Full TypeScript support with generics
- Error boundary integration
- Theme provider functionality
- Permission context integration
- Loading state management

Example usage:
```tsx
<CRUDProvider manager={userCRUD} theme={customTheme}>
  <CRUDList />
  <CRUDForm mode="create" />
</CRUDProvider>
```
```

### Step 4: CRUDList Component

**Prompt for CRUDList implementation:**
```
Create a comprehensive CRUDList component (src/components/core/CRUDList.tsx) that:

1. Displays data in a responsive table format
2. Supports column configuration with auto-generation from schema
3. Includes filtering, sorting, and pagination
4. Integrates with permission system for row/column visibility
5. Supports custom cell renderers and actions
6. Handles loading and error states
7. Supports row selection (single/multiple)
8. Mobile-responsive (table -> cards on small screens)

Features to implement:
- Column auto-generation from entity schema
- Permission-based column/action visibility
- Custom cell renderers
- Row actions (edit, delete, custom)
- Bulk actions for selected rows
- Search and filter functionality
- Sorting by columns
- Pagination controls
- Loading skeletons
- Empty state handling
- Responsive design

TypeScript requirements:
- Generic type support for entity type
- Proper prop interfaces
- Column configuration types
- Action configuration types
```

### Step 5: CRUDForm Component

**Prompt for CRUDForm implementation:**
```
Create a dynamic form component (src/components/core/CRUDForm.tsx) that:

1. Supports create and edit modes
2. Auto-generates form fields from entity schema
3. Includes validation using Zod schemas
4. Supports field grouping and custom layouts
5. Integrates with permission system for field visibility
6. Handles form submission and error states
7. Supports custom field components
8. Includes form actions (submit, cancel, reset)

Features to implement:
- Auto field generation from schema metadata
- Field type detection and appropriate input rendering
- Form validation with error display
- Permission-based field visibility/editability
- Field grouping and sections
- Custom field component support
- Form state management
- Submission handling with loading states
- Error handling and display
- Form reset functionality
- Dirty state tracking

Field types to support:
- Text inputs (string, email, url, password)
- Number inputs (integer, decimal)
- Date/time inputs
- Select dropdowns (enum, foreign key)
- Boolean checkboxes
- File uploads
- Rich text editors
- Custom field components

TypeScript requirements:
- Generic entity type support
- Field configuration interfaces
- Validation error types
- Form state types
```

### Step 6: Field Components

**Prompt for field components implementation:**
```
Create a comprehensive field component system in src/components/fields/ that includes:

1. CRUDField wrapper component that:
   - Handles field metadata from schema
   - Manages field state and validation
   - Provides consistent styling and layout
   - Supports permission-based visibility
   - Includes label, help text, and error display

2. Specific field components:
   - TextField: text, email, url, password inputs
   - NumberField: integer and decimal inputs with validation
   - SelectField: dropdown with options from enum or foreign key
   - DateField: date and datetime pickers
   - BooleanField: checkbox and toggle switches
   - FileField: file upload with preview
   - TextAreaField: multi-line text input
   - RichTextField: rich text editor integration

3. Field renderer system that:
   - Automatically selects appropriate field component
   - Supports custom field component registration
   - Handles field configuration from schema
   - Provides consistent API across all fields

Requirements for each field:
- Controlled component pattern
- Validation integration
- Error state handling
- Disabled/readonly states
- Accessibility compliance (ARIA labels, etc.)
- Consistent styling
- TypeScript prop interfaces
- Schema metadata integration

Example field usage:
```tsx
<CRUDField
  field="email"
  value={value}
  onChange={onChange}
  error={error}
  disabled={!hasPermission}
/>
```
```

### Step 7: React Hooks

**Prompt for React hooks implementation:**
```
Create React hooks in src/hooks/ that provide easy access to CRUD functionality:

1. useCRUD<T>(): Hook for accessing CRUD operations
   - Returns: { list, get, create, update, delete, loading, error }
   - Integrates with CRUDProvider context
   - Handles loading states and error management
   - Provides optimistic updates

2. useCRUDList<T>(): Hook for list operations
   - Returns: { data, loading, error, pagination, filters, sorting }
   - Manages list state (pagination, filters, sorting)
   - Provides search functionality
   - Handles data refetching

3. useCRUDForm<T>(): Hook for form operations
   - Returns: { values, errors, touched, handleChange, handleSubmit, reset }
   - Manages form state and validation
   - Integrates with schema validation
   - Handles form submission

4. useCRUDPermissions(): Hook for permission checking
   - Returns: { hasPermission, canRead, canWrite, canDelete }
   - Integrates with auth-core permission system
   - Provides field-level permission checking
   - Handles role-based access

5. useCRUDSchema<T>(): Hook for schema access
   - Returns: { schema, fields, validation, metadata }
   - Provides access to entity schema
   - Generates field configurations
   - Handles schema-based UI generation

Requirements:
- Full TypeScript support with generics
- Error handling and loading states
- Integration with existing CRUD manager
- Memoization for performance
- Proper dependency arrays
- Custom hook composition
```

### Step 8: Integration Utilities

**Prompt for integration utilities:**
```
Create utility functions in src/utils/ that handle integration between components:

1. schema-adapter.ts: Schema integration utilities
   - generateColumnConfig(): Auto-generate table columns from schema
   - generateFieldConfig(): Auto-generate form fields from schema
   - getFieldType(): Determine field component type from schema
   - getFieldValidation(): Extract validation rules from schema
   - getFieldMetadata(): Extract field metadata (label, description, etc.)

2. permission-utils.ts: Permission integration utilities
   - checkFieldPermission(): Check if user can read/write field
   - filterVisibleFields(): Filter fields based on permissions
   - checkOperationPermission(): Check if user can perform operation
   - getAccessibleActions(): Get list of allowed actions for user

3. field-renderer.ts: Field rendering utilities
   - renderField(): Render appropriate field component for schema field
   - registerFieldComponent(): Register custom field components
   - getFieldComponent(): Get field component for field type
   - createFieldProps(): Create props for field component from schema

4. theme-utils.ts: Theme and styling utilities
   - applyTheme(): Apply theme to components
   - generateCSS(): Generate CSS variables from theme
   - mergeThemes(): Merge custom theme with default theme

Requirements:
- Full TypeScript support
- Error handling
- Performance optimization
- Extensibility for custom components
- Integration with existing Linch Kit packages
```

### Step 9: Styling and Theming

**Prompt for styling system:**
```
Create a comprehensive styling system in src/styles/ that includes:

1. CSS custom properties for theming
2. Component-specific styles
3. Responsive design utilities
4. Dark mode support
5. Accessibility compliance

Requirements:
- CSS-in-JS or CSS modules approach
- Theme customization support
- Responsive breakpoints
- Consistent spacing and typography
- Accessibility features (focus states, contrast)
- Performance optimization (minimal CSS bundle)

Create default theme with:
- Color palette (primary, secondary, success, warning, error)
- Typography scale
- Spacing system
- Border radius and shadows
- Component-specific styling
```

### Step 10: Testing Setup

**Prompt for testing implementation:**
```
Set up comprehensive testing for the crud-ui package:

1. Unit tests for components using React Testing Library
2. Integration tests for CRUD workflows
3. Accessibility tests using jest-axe
4. Visual regression tests setup
5. Performance tests for large datasets

Test coverage requirements:
- Component rendering: 100%
- User interactions: 95%
- Permission scenarios: 90%
- Error handling: 85%
- Responsive behavior: 80%

Create test utilities for:
- Mock CRUD managers
- Mock permission systems
- Test data generation
- Component testing helpers
```

## 🎯 Success Criteria

### Functional Requirements
- [ ] All components render without errors
- [ ] CRUD operations work end-to-end
- [ ] Permission system integration works
- [ ] Schema auto-generation works
- [ ] Form validation works correctly
- [ ] Responsive design works on all devices

### Performance Requirements
- [ ] Initial bundle size < 50kb gzipped
- [ ] Table renders 1000 rows in < 100ms
- [ ] Form validation responds in < 50ms
- [ ] No memory leaks in component lifecycle

### Quality Requirements
- [ ] TypeScript strict mode passes
- [ ] All tests pass with >90% coverage
- [ ] Accessibility tests pass
- [ ] ESLint and Prettier pass
- [ ] Storybook stories work

## 📚 Documentation Requirements

Create comprehensive documentation including:
- [ ] API reference for all components
- [ ] Usage examples and tutorials
- [ ] Customization guides
- [ ] Integration guides
- [ ] Troubleshooting guide
- [ ] Migration guide from other CRUD libraries

This implementation plan provides a complete roadmap for building a production-ready CRUD UI component library that integrates seamlessly with the Linch Kit ecosystem.
