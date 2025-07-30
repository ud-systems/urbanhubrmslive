# Rule Management Guide

## Quick Start

### Option 1: Interactive Management (Recommended)
```bash
node scripts/manageRules.js
```

### Option 2: Direct File Editing
Edit `.cursor/rules/uhrmsrules.mdc` directly in your editor.

## Rule Structure

### File Organization
```
.cursor/rules/
├── uhrmsrules.mdc          # Main development rules (alwaysApply: true)
├── project-context.mdc     # Project-specific context
├── README.md              # Documentation
└── RULE_MANAGEMENT_GUIDE.md # This file
```

### Rule Format
```markdown
---
alwaysApply: true
---

# MAIN TITLE

## SECTION

### Category
- Rule 1
- Rule 2
- Rule 3
```

## Adding New Rules

### Method 1: Interactive Script
1. Run `node scripts/manageRules.js`
2. Choose option 2 (Add new rule)
3. Select existing category or create new one
4. Enter your rule

### Method 2: Direct Editing
1. Open `.cursor/rules/uhrmsrules.mdc`
2. Find appropriate section
3. Add rule under relevant category
4. Save file

## Rule Categories

### Current Categories:
- **Core Development Principles**
  - Dependency Management
  - Problem Solving Approach
  - Code Architecture

- **Database & Data Management**
  - Live Data Requirements
  - CRUD Functionality

- **UI/UX Standards**
  - Mobile Responsiveness
  - Typography & Sizing
  - Dialog & Form Standards
  - Navigation & Layout

- **Quality Assurance**
  - System Integrity
  - Validation & Testing

## Best Practices

### Writing Effective Rules
- Be specific and actionable
- Use clear, concise language
- Include examples when helpful
- Group related rules together

### Rule Examples
✅ **Good:**
```
- Always use 10-12px font sizes for body text on mobile
- Ensure all forms have validation before submission
- Back buttons must be positioned on the far right
```

❌ **Avoid:**
```
- Make it look good
- Don't break things
- Be careful with the code
```

## Verification

### Check Rules Status
```bash
node scripts/verifyRules.js
```

### What Gets Verified:
- ✅ Rules directory exists
- ✅ Main rules file has `alwaysApply: true`
- ✅ All required files are present
- ✅ File sizes are reasonable

## Troubleshooting

### Rules Not Applying
1. Check if `alwaysApply: true` is in the frontmatter
2. Verify file is saved in `.cursor/rules/` directory
3. Restart Cursor if needed
4. Run verification script

### Adding Complex Rules
For complex rules with multiple conditions, use this format:
```markdown
### Complex Category
- Primary rule with main requirement
- Secondary rule with additional conditions
- Exception rule for special cases
```

## Rule Types

### Development Rules
- Code standards
- Architecture patterns
- Best practices

### UI/UX Rules
- Design standards
- Responsive behavior
- User experience guidelines

### Database Rules
- Data handling
- CRUD operations
- Live data requirements

### Quality Rules
- Testing requirements
- Validation standards
- System integrity

## Maintenance

### Regular Updates
- Review rules monthly
- Remove outdated rules
- Add new requirements
- Update project context

### Version Control
- Commit rule changes
- Document major updates
- Keep backup of important rules

## Quick Commands

```bash
# View current rules
node scripts/manageRules.js

# Verify configuration
node scripts/verifyRules.js

# Edit rules directly
code .cursor/rules/uhrmsrules.mdc
``` 