# Cursor Rules for Urban Hub Lead Management System

## Overview
This directory contains Cursor rules that ensure consistent development standards and practices across the Urban Hub Lead Management System.

## Files

### `uhrmsrules.mdc`
**Main development rules** - Contains all the core development principles, UI/UX standards, and quality assurance requirements.

**Key sections:**
- Core Development Principles
- Database & Data Management
- UI/UX Standards
- Quality Assurance

### `project-context.mdc`
**Project-specific context** - Provides essential information about the current system state, technical stack, and development workflow.

**Key sections:**
- Project Overview
- Current System State
- Critical Reminders
- Technical Stack
- Development Workflow

## How Rules Work

1. **Automatic Application**: Rules with `alwaysApply: true` are automatically applied to every interaction
2. **Context Awareness**: The system maintains awareness of your project's specific requirements
3. **Consistent Standards**: All development follows the established patterns and standards
4. **Quality Assurance**: Built-in checks ensure code quality and system integrity

## Rule Categories

### Development Principles
- Problem-solving approach
- Code architecture standards
- Dependency management

### Database & Data
- Live data requirements
- CRUD functionality standards
- No mock data policy

### UI/UX Standards
- Mobile responsiveness (10-12px fonts, 14-18px titles)
- Dialog and form standards
- Navigation patterns
- Layout consistency

### Quality Assurance
- System integrity checks
- Validation requirements
- Testing standards

## Benefits

✅ **Consistent Development**: All code follows the same standards
✅ **Quality Assurance**: Built-in checks prevent common issues
✅ **Mobile-First**: Responsive design is always prioritized
✅ **Live Data**: No mock data, always production-ready
✅ **User Experience**: Consistent UI/UX across all modules
✅ **System Integrity**: Proper CRUD operations and intermodule communication

## Maintenance

- Rules are automatically applied to every Cursor interaction
- No manual intervention required
- Rules persist across sessions and workspace restarts
- Updates to rules take effect immediately 