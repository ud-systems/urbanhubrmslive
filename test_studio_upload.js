// Test script to debug studio upload issues
// Run this in your browser console to test studio creation

// Test data similar to what might be in your CSV
const testStudioData = {
  id: "TEST001",
  name: "Test Studio",
  view: "Moor Lane",
  floor: "G", // This should be converted to 0
  roomGrade: "Gold Studios"
};

// Test the validation directly
console.log('Testing studio data:', testStudioData);

// You can also test with different floor values
const testCases = [
  { floor: "G", expected: 0 },
  { floor: "g", expected: 0 },
  { floor: "Ground", expected: 0 },
  { floor: "1", expected: 1 },
  { floor: "2", expected: 2 },
  { floor: 1, expected: 1 },
  { floor: 0, expected: 0 }
];

console.log('Floor conversion test cases:');
testCases.forEach(test => {
  console.log(`${test.floor} (${typeof test.floor}) should become ${test.expected}`);
});

// Instructions for debugging:
console.log(`
=== DEBUGGING INSTRUCTIONS ===

1. Try uploading your CSV again
2. Check the browser console for these log messages:
   - "Creating studio with data:"
   - "Normalizing roomgrade value:"
   - "Normalized studio data:"
   - "Validating studio data:"
   - "Studio validation result:" or "Studio validation error:"

3. Look for any error messages that start with:
   - "Studio upload error at row"
   - "Studio validation failed:"
   - "Error normalizing roomgrade value:"

4. If you see validation errors, check:
   - Are all required fields present? (id, name)
   - Are the field names correct? (id, name, view, floor, roomGrade)
   - Are the values in the expected format?

5. Common issues:
   - Missing required fields (id, name)
   - Wrong field names (e.g., "roomgrade" instead of "roomGrade")
   - Invalid data types
   - Empty values for required fields

Please share any error messages you see in the console.
`); 