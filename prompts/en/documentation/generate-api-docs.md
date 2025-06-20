# Generate API Documentation Prompt

## 🎯 Task Overview
You are tasked with generating comprehensive API documentation for Linch Kit packages. This involves extracting information from TypeScript source code, creating structured documentation, and ensuring consistency across all package APIs.

## 📋 API Documentation Standards

### Documentation Structure
Each API reference should include:
- **Overview**: Package purpose and main concepts
- **Installation**: Package installation and setup
- **Quick Start**: Basic usage example
- **API Reference**: Detailed function/class documentation
- **Types**: TypeScript type definitions
- **Examples**: Practical usage scenarios
- **Migration**: Version upgrade guides

### Required Information per API
- **Function/Method Name**: Clear, descriptive identifier
- **Description**: What it does and when to use it
- **Parameters**: Type, description, required/optional, defaults
- **Return Value**: Type and description
- **Throws**: Possible exceptions and error conditions
- **Examples**: Working code demonstrations
- **Since**: Version when introduced
- **Deprecated**: If applicable, with migration path

## 🔧 Source Code Analysis

### TypeScript Extraction Process
1. **Parse Source Files**: Extract exports, types, interfaces
2. **Extract JSDoc Comments**: Documentation from code comments
3. **Analyze Type Signatures**: Parameter and return types
4. **Identify Dependencies**: Inter-package relationships
5. **Generate Examples**: Create usage demonstrations

### Code Documentation Standards
```typescript
/**
 * Define a schema with validation rules and type safety
 * 
 * @param definition - Schema definition object
 * @param options - Optional configuration settings
 * @returns A validated schema instance with type inference
 * 
 * @example
 * ```typescript
 * const userSchema = defineSchema({
 *   name: z.string().min(1),
 *   email: z.string().email(),
 *   age: z.number().min(0).optional()
 * })
 * ```
 * 
 * @since 2.0.0
 * @category Schema
 */
export function defineSchema<T extends ZodRawShape>(
  definition: T,
  options?: SchemaOptions
): Schema<T> {
  // Implementation
}
```

## 📚 Package-Specific Guidelines

### @linch-kit/schema
Focus areas:
- Schema definition functions
- Validation decorators
- Type inference capabilities
- Database integration
- Field configuration options

### @linch-kit/auth-core
Focus areas:
- Authentication methods
- User management
- Session handling
- Permission systems
- Multi-tenant support

### @linch-kit/crud
Focus areas:
- CRUD operations
- Query builders
- Filtering and sorting
- Pagination
- Relationship handling

### @linch-kit/trpc
Focus areas:
- Router configuration
- Procedure definitions
- Middleware setup
- Type safety features
- Client integration

## 📝 Documentation Generation Process

### Step 1: Source Analysis
```bash
# Extract API information from source code
npx typedoc --json api-temp.json src/index.ts
# Parse JSDoc comments and type information
# Generate structured data for documentation
```

### Step 2: Content Generation
Create documentation sections:

#### Package Overview
```markdown
# @linch-kit/schema

Type-safe schema definition and validation for Linch Kit applications.

## Features
- 🔒 Type-safe schema definitions
- ✅ Runtime validation
- 🗄️ Database integration
- 🎨 UI component generation
- 🌐 Internationalization support

## Installation
```bash
npm install @linch-kit/schema
```

#### API Reference Template
```markdown
## defineSchema

Define a schema with validation rules and type safety.

### Signature
```typescript
function defineSchema<T extends ZodRawShape>(
  definition: T,
  options?: SchemaOptions
): Schema<T>
```

### Parameters
- `definition` (required): Schema definition object using Zod validators
- `options` (optional): Configuration options for the schema

### Returns
A `Schema<T>` instance with inferred types and validation methods.

### Example
```typescript
import { defineSchema } from '@linch-kit/schema'
import { z } from 'zod'

const userSchema = defineSchema({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format'),
  age: z.number().min(0).optional()
})

// Type-safe usage
const user = userSchema.parse({
  name: 'John Doe',
  email: 'john@example.com',
  age: 30
})
```
```

### Step 3: Cross-Reference Generation
- Link related functions and types
- Create navigation between packages
- Generate dependency graphs
- Build search indices

### Step 4: Example Generation
Create comprehensive examples:

#### Basic Usage Examples
```typescript
// Simple schema definition
const basicSchema = defineSchema({
  title: z.string(),
  published: z.boolean().default(false)
})
```

#### Advanced Usage Examples
```typescript
// Complex schema with relationships
const advancedSchema = defineSchema({
  user: z.object({
    id: z.string().uuid(),
    profile: z.object({
      name: z.string(),
      avatar: z.string().url().optional()
    })
  }),
  posts: z.array(z.object({
    title: z.string(),
    content: z.string(),
    tags: z.array(z.string())
  }))
}, {
  database: {
    table: 'users',
    relationships: {
      posts: { type: 'hasMany', foreignKey: 'userId' }
    }
  }
})
```

## 🌐 Internationalization

### Multi-language API Docs
Generate documentation in multiple languages:

#### English Documentation
- Technical precision
- Global best practices
- International examples
- Comprehensive coverage

#### Chinese Documentation
- Localized examples
- Cultural context
- Simplified explanations
- China-specific considerations

### Translation Workflow
1. Generate English documentation first
2. Extract translatable content
3. Translate descriptions and examples
4. Maintain technical accuracy
5. Sync updates across languages

## 🔍 Quality Assurance

### Automated Validation
- **Type Checking**: Ensure all examples compile
- **Link Validation**: Verify all cross-references work
- **Example Testing**: Run all code examples
- **Consistency Checking**: Validate naming conventions
- **Completeness**: Ensure all exports are documented

### Manual Review Process
- **Technical Accuracy**: Expert review of content
- **Clarity**: User experience testing
- **Completeness**: Coverage assessment
- **Examples**: Practical relevance check
- **Navigation**: User journey validation

## 📊 Documentation Metrics

### Coverage Metrics
- **API Coverage**: Percentage of exported functions documented
- **Example Coverage**: Functions with working examples
- **Type Coverage**: Documented type definitions
- **Cross-Reference Coverage**: Linked related functions

### Quality Metrics
- **User Satisfaction**: Community feedback scores
- **Usage Analytics**: Most accessed documentation
- **Support Reduction**: Fewer questions on documented topics
- **Contribution Rate**: Community documentation contributions

## 🛠️ Tools and Automation

### Documentation Generation Tools
- **TypeDoc**: TypeScript API extraction
- **JSDoc**: Comment parsing and formatting
- **Nextra**: Documentation site generation
- **Custom Scripts**: Package-specific processing

### Automation Pipeline
```yaml
# Documentation Generation Workflow
name: Generate API Docs
on:
  push:
    paths: ['packages/*/src/**']
jobs:
  generate-docs:
    steps:
      - Extract API information
      - Generate documentation
      - Update cross-references
      - Validate examples
      - Deploy to documentation site
```

## 📋 Maintenance Workflow

### Regular Updates
- **Version Releases**: Update API docs with new versions
- **Feature Additions**: Document new functionality
- **Deprecations**: Mark outdated APIs and provide migration paths
- **Bug Fixes**: Correct documentation errors
- **Example Updates**: Keep examples current and relevant

### Community Integration
- **Feedback Collection**: Gather user input on documentation quality
- **Contribution Guidelines**: Enable community documentation contributions
- **Review Process**: Maintain quality standards for contributions
- **Recognition**: Acknowledge community contributors

## 🎯 Success Criteria

Effective API documentation should:
- **Enable Self-Service**: Users can implement features without support
- **Reduce Learning Curve**: Clear examples and explanations
- **Maintain Currency**: Always reflect latest package versions
- **Support Discovery**: Easy navigation and search
- **Encourage Adoption**: Compelling examples and clear benefits

## 🚨 Common Pitfalls to Avoid

- **Outdated Examples**: Code that doesn't work with current versions
- **Missing Context**: Examples without sufficient setup information
- **Inconsistent Naming**: Different conventions across packages
- **Poor Cross-Linking**: Isolated documentation without connections
- **Technical Jargon**: Explanations that assume too much knowledge
- **Incomplete Coverage**: Missing important functions or edge cases
