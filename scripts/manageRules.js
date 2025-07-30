#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rulesDir = path.join(__dirname, '..', '.cursor', 'rules');
const mainRulesFile = path.join(rulesDir, 'uhrmsrules.mdc');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function showMenu() {
  console.log('\n🔧 Cursor Rules Management System');
  console.log('=====================================');
  console.log('1. View current rules');
  console.log('2. Add new rule');
  console.log('3. Add new rule category');
  console.log('4. Verify rules configuration');
  console.log('5. Exit');
  console.log('=====================================');
  
  const choice = await question('Choose an option (1-5): ');
  return choice.trim();
}

async function viewRules() {
  console.log('\n📋 Current Rules Structure:\n');
  
  if (fs.existsSync(mainRulesFile)) {
    const content = fs.readFileSync(mainRulesFile, 'utf8');
    console.log(content);
  } else {
    console.log('❌ Rules file not found!');
  }
}

async function addNewRule() {
  console.log('\n➕ Add New Rule');
  console.log('================');
  
  // Show current categories
  const content = fs.readFileSync(mainRulesFile, 'utf8');
  const categories = content.match(/### [^\n]+/g) || [];
  
  console.log('\nCurrent categories:');
  categories.forEach((cat, index) => {
    console.log(`${index + 1}. ${cat.replace('### ', '')}`);
  });
  
  const categoryChoice = await question('\nChoose category number or enter new category name: ');
  
  const newRule = await question('Enter your new rule: ');
  
  if (newRule.trim()) {
    // Add the rule to the appropriate category
    let updatedContent = content;
    
    if (categoryChoice.match(/^\d+$/)) {
      // Existing category
      const categoryIndex = parseInt(categoryChoice) - 1;
      if (categoryIndex >= 0 && categoryIndex < categories.length) {
        const category = categories[categoryIndex];
        const categoryName = category.replace('### ', '');
        
        // Find the category in the content and add the rule
        const categoryRegex = new RegExp(`(### ${categoryName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^#]+)`, 's');
        const match = content.match(categoryRegex);
        
        if (match) {
          const replacement = match[1] + `- ${newRule}\n`;
          updatedContent = content.replace(categoryRegex, replacement);
        }
      }
    } else {
      // New category
      const newCategory = `\n### ${categoryChoice}\n- ${newRule}\n`;
      updatedContent = content + newCategory;
    }
    
    // Write back to file
    fs.writeFileSync(mainRulesFile, updatedContent);
    console.log('✅ Rule added successfully!');
  }
}

async function addNewCategory() {
  console.log('\n📂 Add New Rule Category');
  console.log('========================');
  
  const categoryName = await question('Enter new category name: ');
  const firstRule = await question('Enter first rule for this category: ');
  
  if (categoryName.trim() && firstRule.trim()) {
    const content = fs.readFileSync(mainRulesFile, 'utf8');
    const newCategory = `\n## ${categoryName.toUpperCase()}\n\n### ${categoryName}\n- ${firstRule}\n`;
    
    const updatedContent = content + newCategory;
    fs.writeFileSync(mainRulesFile, updatedContent);
    
    console.log('✅ New category added successfully!');
  }
}

async function main() {
  try {
    while (true) {
      const choice = await showMenu();
      
      switch (choice) {
        case '1':
          await viewRules();
          break;
        case '2':
          await addNewRule();
          break;
        case '3':
          await addNewCategory();
          break;
        case '4':
          console.log('\n🔍 Running verification...');
          const { execSync } = await import('child_process');
          execSync('node scripts/verifyRules.js', { stdio: 'inherit' });
          break;
        case '5':
          console.log('\n👋 Goodbye!');
          rl.close();
          return;
        default:
          console.log('\n❌ Invalid choice. Please try again.');
      }
      
      await question('\nPress Enter to continue...');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    rl.close();
  }
}

main(); 