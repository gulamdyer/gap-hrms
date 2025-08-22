# Database Schema Maintenance Protocol

## 🎯 Purpose
This document outlines the process for maintaining database schema changes and keeping documentation updated.

## 📋 When Database Changes Occur

### Immediate Actions Required:

1. **Update Migration Script** (`database-migration.js`)
   - Add/modify table creation methods
   - Update default data insertion
   - Maintain proper dependency order

2. **Update Documentation** (`DATABASE_MIGRATION_GUIDE.md`)
   - Add new tables to table structure section
   - Update default data counts and descriptions
   - Add change log entry with date and details

3. **Update Backup Script** (`backup-database.js`)
   - Add new tables to backup/restore process
   - Update table list in DatabaseBackup class

## 🗃️ Types of Changes to Track

### Table Changes
- **New Tables**: Add to migration script, update guide
- **Column Changes**: Update CREATE statements, document impact
- **Constraint Changes**: Update foreign keys, checks, unique constraints
- **Index Changes**: Document performance optimizations

### Data Changes  
- **New Default Data**: Update insertion methods and guide
- **Modified Default Data**: Update existing records, document changes
- **Data Type Changes**: Update field specifications, note migration impact

### Schema Changes
- **Views**: Document any database views created
- **Procedures/Functions**: Document database logic
- **Triggers**: Document any automated database actions

## 📝 Documentation Update Checklist

When making database changes:

- [ ] Update `database-migration.js` with new schema
- [ ] Update table structure section in guide
- [ ] Update default data section with counts
- [ ] Add change log entry with:
  - Date
  - Change type (NEW TABLE, MODIFY COLUMN, etc.)
  - Table name
  - Description of change
  - Impact assessment
  - Migration notes
- [ ] Update version number
- [ ] Test migration script on clean database
- [ ] Update backup script if needed

## 🔄 Workflow Example

```
Developer makes database change
         ↓
Update database-migration.js
         ↓
Update DATABASE_MIGRATION_GUIDE.md
         ↓
Test migration on clean database
         ↓
Commit all changes together
```

## 📊 Current Schema Stats

- **Core Tables**: 5 (Users, Employees, Advances, Loans, Leaves)
- **Settings Tables**: 7 (Designations, Roles, Positions, Locations, Cost Centers, Pay Components, Leave Policies)
- **Total Default Records**: ~85 records
- **Current Version**: v1.0

## 🎯 Consistency Rules

1. **Table Names**: Always use `HRMS_` prefix
2. **ID Columns**: Always use `GENERATED ALWAYS AS IDENTITY`
3. **Audit Fields**: Always include `CREATED_BY`, `CREATED_AT`, `UPDATED_AT`
4. **Status Fields**: Use `ACTIVE`/`INACTIVE` with default `ACTIVE`
5. **Foreign Keys**: Always name with `FK_` prefix
6. **Date Format**: Support DD-MM-YYYY in frontend, YYYY-MM-DD in database

This protocol ensures our database schema and documentation remain synchronized and maintainable. 