# Create New Documentation Page Prompt

## 🎯 Task Overview
You are tasked with creating a new documentation page for the Linch Kit project. This page should follow established patterns, maintain consistency with existing documentation, and provide comprehensive coverage of the topic.

## 📋 Requirements Checklist

### Content Structure
- [ ] Clear, descriptive title (H1)
- [ ] Brief introduction paragraph explaining the purpose
- [ ] Table of contents for longer pages (>5 sections)
- [ ] Logical section hierarchy (H2, H3, H4)
- [ ] Practical examples with code snippets
- [ ] Cross-references to related documentation
- [ ] Next steps or related resources section

### Technical Standards
- [ ] Use MDX format (.mdx extension)
- [ ] Include proper frontmatter metadata
- [ ] Follow established file naming conventions (kebab-case)
- [ ] Ensure responsive code blocks with syntax highlighting
- [ ] Add appropriate TypeScript types in examples
- [ ] Include import statements where relevant

### Internationalization
- [ ] Create both English and Chinese versions
- [ ] Use consistent terminology across languages
- [ ] Ensure cultural appropriateness for Chinese audience
- [ ] Maintain parallel structure between language versions
- [ ] Add translation keys for dynamic content

### Code Examples
- [ ] Provide working, tested code examples
- [ ] Include both basic and advanced usage patterns
- [ ] Show error handling where appropriate
- [ ] Use realistic variable names and scenarios
- [ ] Include comments explaining complex logic
- [ ] Ensure examples work with current package versions

### Navigation Integration
- [ ] Add page to appropriate navigation menu
- [ ] Update parent page links if creating child pages
- [ ] Ensure proper breadcrumb navigation
- [ ] Add to search index configuration
- [ ] Update sitemap if necessary

## 📁 File Structure Guidelines

### Documentation Location
```
docs/
├── getting-started/
│   ├── installation.md
│   ├── quick-start.md
│   └── first-project.md
├── core-concepts/
│   ├── schema-definition.md
│   ├── type-safety.md
│   └── validation.md
├── api-reference/
│   ├── schema/
│   ├── auth/
│   ├── crud/
│   └── trpc/
├── examples/
│   ├── basic-crud.md
│   ├── authentication.md
│   └── advanced-patterns.md
└── guides/
    ├── deployment.md
    ├── testing.md
    └── troubleshooting.md
```

### Naming Conventions
- Use kebab-case for file names
- Be descriptive but concise
- Group related pages in subdirectories
- Use consistent prefixes for series (e.g., `01-`, `02-`)

## 🎨 Content Guidelines

### Writing Style
- **Clear and Concise**: Use simple, direct language
- **Action-Oriented**: Start with verbs when describing steps
- **User-Focused**: Write from the user's perspective
- **Consistent Tone**: Professional but approachable
- **Scannable**: Use bullet points, numbered lists, and headers

### Code Style
- Use TypeScript for all examples
- Include proper error handling
- Show both success and error cases
- Use realistic data in examples
- Explain complex concepts with comments

### Visual Elements
- Use callout boxes for important information
- Include diagrams for complex workflows
- Add screenshots for UI-related documentation
- Use consistent formatting for code blocks
- Highlight key terms and concepts

## 📝 Template Structure

```mdx
---
title: "Page Title"
description: "Brief description for SEO and navigation"
category: "category-name"
order: 1
lastUpdated: "2025-06-20"
---

# Page Title

Brief introduction explaining what this page covers and why it's important.

## Overview

High-level explanation of the concept or feature.

## Prerequisites

- List any required knowledge
- Required software or packages
- Links to prerequisite documentation

## Basic Usage

### Step 1: Setup
```typescript
// Clear, working example
import { defineSchema } from '@linch-kit/schema'

const userSchema = defineSchema({
  // Example implementation
})
```

### Step 2: Implementation
Detailed explanation with code examples.

## Advanced Usage

More complex examples and patterns.

## Best Practices

- Bullet point recommendations
- Common pitfalls to avoid
- Performance considerations

## Troubleshooting

Common issues and solutions.

## Related Resources

- [Related Page 1](./related-page-1)
- [Related Page 2](./related-page-2)
- [External Resource](https://example.com)

## Next Steps

What the user should do after reading this page.
```

## 🔍 Quality Assurance

### Before Publishing
- [ ] Spell check and grammar review
- [ ] Test all code examples
- [ ] Verify all links work
- [ ] Check responsive design on mobile
- [ ] Validate against accessibility standards
- [ ] Review with team member if possible

### After Publishing
- [ ] Monitor for user feedback
- [ ] Update based on common questions
- [ ] Keep examples current with package updates
- [ ] Review and refresh content quarterly

## 🌐 Localization Notes

### Chinese Translation Guidelines
- Use simplified Chinese characters
- Adapt examples to Chinese context where appropriate
- Maintain technical accuracy while being culturally relevant
- Use consistent technical terminology
- Consider Chinese developer workflow patterns

### Translation Workflow
1. Create English version first
2. Review and finalize English content
3. Create Chinese translation
4. Technical review of Chinese version
5. Cross-reference both versions for consistency

## 📊 Success Metrics

A successful documentation page should:
- Reduce support questions on the topic
- Enable users to complete tasks independently
- Receive positive feedback from community
- Maintain high search rankings for relevant keywords
- Show good engagement metrics (time on page, low bounce rate)
