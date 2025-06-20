# Update Existing Documentation Page Prompt

## 🎯 Task Overview
You are tasked with updating an existing documentation page for the Linch Kit project. This involves reviewing current content, identifying areas for improvement, and making targeted updates while maintaining consistency and quality.

## 📋 Pre-Update Analysis

### Content Audit Checklist
- [ ] Review page analytics (if available) for user behavior insights
- [ ] Check for outdated information or deprecated features
- [ ] Identify missing information based on user feedback
- [ ] Verify all code examples still work with current versions
- [ ] Check for broken internal and external links
- [ ] Review translation consistency between languages
- [ ] Assess content organization and flow

### Common Update Triggers
- **Package Version Updates**: New features, API changes, deprecations
- **User Feedback**: Common questions, confusion points, missing info
- **Bug Reports**: Incorrect examples, outdated instructions
- **Feature Additions**: New functionality to document
- **Performance Issues**: Slow loading, large file sizes
- **SEO Improvements**: Better keywords, meta descriptions
- **Accessibility**: Screen reader compatibility, contrast issues

## 🔄 Update Process

### Step 1: Backup and Branch
```bash
# Create backup of current content
git checkout -b docs/update-[page-name]
cp docs/path/to/page.md docs/path/to/page.md.backup
```

### Step 2: Content Review
- Read through entire page from user perspective
- Test all code examples in clean environment
- Verify all links and references
- Check for consistency with related pages
- Review against current style guide

### Step 3: Identify Update Areas
Document what needs to be changed:
- [ ] **Factual Corrections**: Wrong information, outdated APIs
- [ ] **Content Additions**: Missing sections, new examples
- [ ] **Content Removals**: Deprecated features, redundant info
- [ ] **Reorganization**: Better structure, improved flow
- [ ] **Style Updates**: Formatting, consistency, readability
- [ ] **Translation Updates**: Sync between language versions

### Step 4: Make Updates
Follow established patterns and maintain consistency:

#### Code Example Updates
```typescript
// Before (outdated)
import { createSchema } from '@linch-kit/schema'

// After (current)
import { defineSchema } from '@linch-kit/schema'
```

#### Content Structure Updates
- Maintain existing heading hierarchy
- Preserve internal link structure
- Update cross-references as needed
- Keep navigation consistency

### Step 5: Quality Assurance
- [ ] Test all updated code examples
- [ ] Verify all links work
- [ ] Check responsive design
- [ ] Validate against accessibility standards
- [ ] Review translation consistency
- [ ] Spell check and grammar review

## 📝 Update Categories

### Version-Related Updates
When package versions change:
- Update installation commands
- Modify import statements
- Update API usage examples
- Add migration guides if breaking changes
- Update version references in text

### Content Enhancement Updates
Improving existing content:
- Add missing examples
- Clarify confusing sections
- Expand on brief explanations
- Add troubleshooting sections
- Include best practices

### Structural Updates
Reorganizing for better user experience:
- Reorder sections for logical flow
- Split long pages into multiple pages
- Combine related short pages
- Update navigation structure
- Improve cross-linking

### Style and Formatting Updates
Maintaining consistency:
- Apply current style guide
- Update code block formatting
- Standardize terminology
- Improve readability
- Enhance visual hierarchy

## 🌐 Translation Synchronization

### When Updating English Content
1. **Document Changes**: Keep detailed log of what was modified
2. **Mark for Translation**: Flag sections needing Chinese updates
3. **Maintain Parallel Structure**: Ensure both versions have same sections
4. **Update Translation Keys**: Modify any dynamic content keys
5. **Review Cultural Relevance**: Ensure examples work in Chinese context

### Translation Update Process
```markdown
<!-- Translation Status Tracking -->
<!-- EN: Updated 2025-06-20 -->
<!-- ZH: Needs update - sections 2, 4, 6 -->
<!-- Last sync: 2025-06-15 -->
```

## 🔍 Specific Update Scenarios

### API Changes
```typescript
// Document both old and new approaches during transition
// Old approach (deprecated in v2.0)
const schema = createSchema({
  // ...
})

// New approach (v2.0+)
const schema = defineSchema({
  // ...
})
```

### Adding New Features
- Create new sections for new functionality
- Update existing examples to show new capabilities
- Add to table of contents
- Cross-reference from related pages
- Update overview/introduction sections

### Removing Deprecated Features
- Add deprecation warnings before removal
- Provide migration paths
- Update all examples
- Remove from navigation if completely obsolete
- Archive old content for reference

### Performance Improvements
- Optimize images and media
- Reduce page load time
- Improve code example efficiency
- Streamline content organization
- Remove redundant information

## 📊 Update Validation

### Technical Validation
- [ ] All code examples execute successfully
- [ ] Links resolve correctly
- [ ] Images load properly
- [ ] Page renders correctly on all devices
- [ ] Search functionality includes new content
- [ ] SEO metadata is current

### Content Validation
- [ ] Information is accurate and current
- [ ] Examples are realistic and helpful
- [ ] Flow is logical and easy to follow
- [ ] Terminology is consistent
- [ ] Cross-references are accurate
- [ ] Translations are synchronized

### User Experience Validation
- [ ] Page loads quickly
- [ ] Content is scannable
- [ ] Examples are copy-pasteable
- [ ] Navigation is intuitive
- [ ] Mobile experience is good
- [ ] Accessibility standards met

## 📋 Post-Update Tasks

### Documentation
- [ ] Update changelog if significant changes
- [ ] Document any breaking changes
- [ ] Update related pages that reference this content
- [ ] Notify team of major updates
- [ ] Update internal documentation

### Monitoring
- [ ] Monitor user feedback after update
- [ ] Track page analytics for improvements
- [ ] Watch for new issues or questions
- [ ] Schedule next review date
- [ ] Update maintenance calendar

## 🎯 Success Criteria

An effective page update should:
- **Solve User Problems**: Address common questions or confusion
- **Maintain Quality**: Keep or improve existing content quality
- **Stay Current**: Reflect latest package versions and best practices
- **Improve Metrics**: Better engagement, lower bounce rate, fewer support questions
- **Enhance Accessibility**: Work well for all users and devices

## 🚨 Common Pitfalls to Avoid

- **Breaking Existing Links**: Always check internal references
- **Version Mismatches**: Ensure all examples use consistent versions
- **Translation Drift**: Keep language versions synchronized
- **Over-Editing**: Don't change working content unnecessarily
- **Missing Context**: Maintain enough background information
- **Inconsistent Style**: Follow established patterns and conventions
