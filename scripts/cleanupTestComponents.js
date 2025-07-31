const fs = require('fs');
const path = require('path');

// List of test components to remove
const testComponents = [
  'src/components/RoutePersistenceTest.tsx'
];

// Remove test components
testComponents.forEach(componentPath => {
  const fullPath = path.join(process.cwd(), componentPath);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
    console.log(`✅ Removed test component: ${componentPath}`);
  } else {
    console.log(`⚠️  Test component not found: ${componentPath}`);
  }
});

console.log('🧹 Test components cleanup completed'); 