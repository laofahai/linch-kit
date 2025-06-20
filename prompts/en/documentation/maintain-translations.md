# Maintain Documentation Translations Prompt

## 🎯 Task Overview
You are responsible for maintaining high-quality translations between English and Chinese documentation for the Linch Kit project. This involves ensuring consistency, accuracy, and cultural appropriateness across all documentation.

## 🌐 Translation Philosophy

### Core Principles
- **Accuracy First**: Technical precision over literal translation
- **Cultural Adaptation**: Make content relevant for Chinese developers
- **Consistency**: Use standardized terminology across all pages
- **Clarity**: Prioritize understanding over word-for-word translation
- **Maintainability**: Structure content for easy ongoing updates

### Target Audiences
- **English**: Global developer community, international enterprises
- **Chinese**: Chinese developers, domestic companies, educational institutions

## 📋 Translation Workflow

### Initial Translation Process
1. **Source Review**: Thoroughly understand English content
2. **Terminology Check**: Verify technical terms in glossary
3. **Cultural Adaptation**: Adjust examples for Chinese context
4. **Technical Validation**: Ensure code examples work
5. **Quality Review**: Check for accuracy and flow
6. **Synchronization**: Align structure with English version

### Ongoing Maintenance Process
1. **Change Detection**: Monitor English content updates
2. **Impact Assessment**: Determine translation requirements
3. **Priority Assignment**: Critical vs. minor updates
4. **Translation Update**: Apply changes to Chinese version
5. **Cross-Reference**: Ensure consistency across pages
6. **Quality Assurance**: Review and validate changes

## 📚 Translation Standards

### Technical Terminology
Maintain consistency for key terms:

| English | Chinese | Notes |
|---------|---------|-------|
| Schema | 模式 | Data structure definition |
| Validation | 验证 | Input checking process |
| Type Safety | 类型安全 | TypeScript concept |
| Framework | 框架 | Software framework |
| Full-stack | 全栈 | Complete development stack |
| AI-first | AI优先 | AI-centric approach |
| Middleware | 中间件 | Request processing layer |
| Authentication | 身份验证 | User identity verification |
| Authorization | 权限控制 | Access control |
| CRUD | 增删改查 | Create, Read, Update, Delete |

### Code Comments Translation
```typescript
// English version
/**
 * Define a user schema with validation rules
 * @param config Schema configuration object
 * @returns Validated schema instance
 */

// Chinese version
/**
 * 定义带有验证规则的用户模式
 * @param config 模式配置对象
 * @returns 验证后的模式实例
 */
```

### Cultural Adaptations

#### Examples and Scenarios
- **English**: Use international examples (e.g., "John Doe", global companies)
- **Chinese**: Use Chinese names, local companies, familiar scenarios

#### Development Practices
- **English**: Focus on global best practices
- **Chinese**: Include China-specific considerations (deployment, regulations)

#### Communication Style
- **English**: Direct, concise, action-oriented
- **Chinese**: Respectful, detailed, context-providing

## 🔄 Synchronization Management

### Version Tracking
Use frontmatter to track translation status:

```yaml
---
title: "页面标题"
description: "页面描述"
lastUpdated: "2025-06-20"
translationStatus:
  source: "en"
  lastSync: "2025-06-20"
  version: "1.2.0"
  reviewer: "translator-name"
---
```

### Change Detection System
Monitor for updates requiring translation:

```markdown
<!-- Translation Sync Status -->
<!-- EN Updated: 2025-06-20 - Added new API examples -->
<!-- ZH Status: Needs update - sections 3, 5 -->
<!-- Priority: High (API changes) -->
<!-- Estimated effort: 2 hours -->
```

### Parallel Structure Maintenance
Ensure both versions have:
- Same heading hierarchy
- Equivalent code examples
- Parallel navigation structure
- Consistent cross-references
- Similar content depth

## 📝 Translation Quality Guidelines

### Language Quality
- **Grammar**: Proper Chinese grammar and sentence structure
- **Terminology**: Consistent technical vocabulary
- **Readability**: Natural flow and comprehension
- **Tone**: Professional yet approachable
- **Clarity**: Clear explanations without ambiguity

### Technical Accuracy
- **Code Examples**: All code must work identically
- **API References**: Exact parameter names and types
- **Installation Steps**: Accurate commands and procedures
- **Error Messages**: Correct error handling examples
- **Version Numbers**: Consistent across languages

### Cultural Appropriateness
- **Examples**: Use familiar Chinese contexts
- **References**: Include relevant Chinese resources
- **Practices**: Acknowledge Chinese development patterns
- **Regulations**: Consider local compliance requirements
- **Tools**: Mention China-accessible alternatives when relevant

## 🛠️ Translation Tools and Resources

### Terminology Management
- Maintain centralized glossary
- Use translation memory tools
- Create style guide for consistency
- Regular terminology reviews
- Community feedback integration

### Quality Assurance Tools
- Automated consistency checking
- Cross-reference validation
- Link verification
- Code example testing
- Spell checking and grammar tools

### Collaboration Workflow
```
English Update → Change Detection → Translation Assignment → 
Review Process → Quality Check → Publication → Feedback Loop
```

## 📊 Quality Metrics

### Translation Quality Indicators
- **Accuracy**: Technical correctness (target: 100%)
- **Consistency**: Terminology usage (target: 95%+)
- **Completeness**: Content coverage (target: 100%)
- **Timeliness**: Update lag time (target: <7 days)
- **User Satisfaction**: Community feedback (target: 4.5/5)

### Monitoring Methods
- Regular quality audits
- User feedback collection
- Community contribution tracking
- Error reporting system
- Performance analytics

## 🚨 Common Translation Challenges

### Technical Challenges
- **API Naming**: Balancing English terms vs. Chinese translation
- **Code Comments**: Maintaining readability in both languages
- **Error Messages**: Consistent error handling across languages
- **Version Compatibility**: Ensuring examples work in both contexts

### Cultural Challenges
- **Development Practices**: Different tooling preferences
- **Learning Styles**: Varied documentation consumption patterns
- **Communication Norms**: Formal vs. informal tone preferences
- **Local Resources**: China-specific tools and services

### Maintenance Challenges
- **Update Frequency**: Keeping pace with English changes
- **Resource Allocation**: Balancing quality vs. speed
- **Reviewer Availability**: Ensuring consistent quality review
- **Community Coordination**: Managing contributor feedback

## 🎯 Success Criteria

Effective translation maintenance should achieve:
- **Zero Technical Errors**: All code examples work correctly
- **High User Satisfaction**: Positive community feedback
- **Consistent Quality**: Uniform standards across all pages
- **Timely Updates**: Quick synchronization with English changes
- **Cultural Relevance**: Appropriate for Chinese developer audience

## 📋 Maintenance Checklist

### Weekly Tasks
- [ ] Review English content changes
- [ ] Update high-priority translations
- [ ] Check community feedback
- [ ] Validate critical code examples
- [ ] Update terminology glossary

### Monthly Tasks
- [ ] Comprehensive quality audit
- [ ] Community feedback analysis
- [ ] Translation metrics review
- [ ] Style guide updates
- [ ] Contributor recognition

### Quarterly Tasks
- [ ] Complete translation review
- [ ] Process improvement assessment
- [ ] Tool and workflow optimization
- [ ] Community survey
- [ ] Strategic planning update
