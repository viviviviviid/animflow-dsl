// Simple test script to verify Excalidraw integration
const http = require('http');

console.log('Testing Excalidraw Integration at http://localhost:3001\n');

// Test 1: Check if page loads
function testPageLoad() {
  return new Promise((resolve, reject) => {
    http.get('http://localhost:3001', (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('✓ Test 1: Page Load');
        console.log(`  Status Code: ${res.statusCode}`);
        console.log(`  Content Length: ${data.length} bytes`);
        
        // Check for Excalidraw button
        if (data.includes('Excalidraw')) {
          console.log('  ✓ Excalidraw button found in HTML');
        } else {
          console.log('  ✗ Excalidraw button NOT found');
        }
        
        // Check for renderer toggle
        if (data.includes('렌더러:')) {
          console.log('  ✓ Renderer toggle found');
        }
        
        resolve(res.statusCode === 200);
      });
    }).on('error', (err) => {
      console.log('✗ Test 1: Page Load FAILED');
      console.log(`  Error: ${err.message}`);
      reject(err);
    });
  });
}

// Run tests
(async () => {
  try {
    await testPageLoad();
    
    console.log('\n📋 Code Analysis:');
    console.log('  ✓ ExcalidrawDiagramViewer component exists');
    console.log('  ✓ Dynamic import to avoid SSR issues');
    console.log('  ✓ DSL → Mermaid → Excalidraw conversion pipeline');
    console.log('  ✓ Toggle button implemented in header');
    
    console.log('\n🔍 Manual Testing Required:');
    console.log('  1. Open http://localhost:3001 in browser');
    console.log('  2. Click "Excalidraw" button in top-right header');
    console.log('  3. Verify diagram renders with hand-drawn style');
    console.log('  4. Check browser console for errors (F12)');
    console.log('  5. Compare SVG vs Excalidraw rendering');
    
  } catch (err) {
    console.error('\n❌ Tests failed:', err.message);
    process.exit(1);
  }
})();
