#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Verifying Cursor Rules Configuration...\n');

const rulesDir = path.join(__dirname, '..', '.cursor', 'rules');
const requiredFiles = [
  'uhrmsrules.mdc',
  'project-context.mdc',
  'README.md'
];

let allGood = true;

// Check if rules directory exists
if (!fs.existsSync(rulesDir)) {
  console.error('❌ .cursor/rules directory not found!');
  allGood = false;
} else {
  console.log('✅ .cursor/rules directory exists');
}

// Check each required file
requiredFiles.forEach(file => {
  const filePath = path.join(rulesDir, file);
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    console.log(`✅ ${file} exists (${stats.size} bytes)`);
    
    // Check if main rules file has alwaysApply: true
    if (file === 'uhrmsrules.mdc') {
      const content = fs.readFileSync(filePath, 'utf8');
      if (content.includes('alwaysApply: true')) {
        console.log('✅ Main rules file has alwaysApply: true');
      } else {
        console.error('❌ Main rules file missing alwaysApply: true');
        allGood = false;
      }
    }
  } else {
    console.error(`❌ ${file} not found!`);
    allGood = false;
  }
});

console.log('\n📋 Rules Summary:');
console.log('- Main development rules: uhrmsrules.mdc');
console.log('- Project context: project-context.mdc');
console.log('- Documentation: README.md');

if (allGood) {
  console.log('\n🎉 All rules are properly configured!');
  console.log('Your development standards will be automatically applied to all Cursor interactions.');
} else {
  console.log('\n⚠️  Some issues found. Please check the configuration.');
}

console.log('\n💡 Remember:');
console.log('- Rules are automatically applied to every interaction');
console.log('- No manual intervention required');
console.log('- Rules persist across sessions');
console.log('- Updates take effect immediately'); 