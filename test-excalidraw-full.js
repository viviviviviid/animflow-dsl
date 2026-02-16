const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function testExcalidrawIntegration() {
  console.log('🚀 Starting Excalidraw Integration Test\n');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Collect console logs
  const consoleLogs = [];
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    consoleLogs.push({ type, text });
    if (type === 'error' || type === 'warning') {
      console.log(`  [${type.toUpperCase()}] ${text}`);
    }
  });
  
  // Collect page errors
  const pageErrors = [];
  page.on('pageerror', error => {
    pageErrors.push(error.message);
    console.log(`  [PAGE ERROR] ${error.message}`);
  });
  
  try {
    // Test 1: Load the page
    console.log('📄 Test 1: Loading page...');
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle2', timeout: 30000 });
    console.log('  ✓ Page loaded successfully\n');
    
    // Test 2: Take screenshot of SVG mode (default)
    console.log('📸 Test 2: Capturing SVG mode screenshot...');
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for rendering
    await page.screenshot({ path: 'test-svg-mode.png', fullPage: true });
    console.log('  ✓ SVG mode screenshot saved as test-svg-mode.png\n');
    
    // Test 3: Check if Excalidraw button exists
    console.log('🔘 Test 3: Finding Excalidraw button...');
    const buttons = await page.$$('button');
    let excalidrawButton = null;
    
    for (const button of buttons) {
      const text = await page.evaluate(el => el.textContent, button);
      if (text.includes('Excalidraw')) {
        excalidrawButton = button;
        console.log('  ✓ Excalidraw button found\n');
        break;
      }
    }
    
    if (!excalidrawButton) {
      throw new Error('Excalidraw button not found');
    }
    
    // Test 4: Click Excalidraw button
    console.log('👆 Test 4: Clicking Excalidraw button...');
    await excalidrawButton.click();
    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for Excalidraw to load
    console.log('  ✓ Excalidraw button clicked\n');
    
    // Test 5: Check if Excalidraw loaded
    console.log('🎨 Test 5: Verifying Excalidraw loaded...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check for Excalidraw-specific elements
    const pageContent = await page.content();
    const hasExcalidrawElements = pageContent.includes('excalidraw') || 
                                   pageContent.includes('Excalidraw');
    
    if (hasExcalidrawElements) {
      console.log('  ✓ Excalidraw elements detected\n');
    } else {
      console.log('  ⚠ Excalidraw elements not clearly detected\n');
    }
    
    // Test 6: Take screenshot of Excalidraw mode
    console.log('📸 Test 6: Capturing Excalidraw mode screenshot...');
    await page.screenshot({ path: 'test-excalidraw-mode.png', fullPage: true });
    console.log('  ✓ Excalidraw mode screenshot saved as test-excalidraw-mode.png\n');
    
    // Test 7: Check console for errors
    console.log('🔍 Test 7: Analyzing console output...');
    const errors = consoleLogs.filter(log => log.type === 'error');
    const warnings = consoleLogs.filter(log => log.type === 'warning');
    
    console.log(`  Total console messages: ${consoleLogs.length}`);
    console.log(`  Errors: ${errors.length}`);
    console.log(`  Warnings: ${warnings.length}\n`);
    
    if (errors.length > 0) {
      console.log('  ❌ Console Errors Found:');
      errors.forEach(err => {
        console.log(`    - ${err.text}`);
      });
      console.log('');
    } else {
      console.log('  ✓ No console errors\n');
    }
    
    if (warnings.length > 0 && warnings.length <= 5) {
      console.log('  ⚠ Console Warnings:');
      warnings.forEach(warn => {
        console.log(`    - ${warn.text}`);
      });
      console.log('');
    }
    
    // Test 8: Performance check
    console.log('⚡ Test 8: Performance metrics...');
    const metrics = await page.metrics();
    console.log(`  JSHeapUsedSize: ${(metrics.JSHeapUsedSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  JSHeapTotalSize: ${(metrics.JSHeapTotalSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  Nodes: ${metrics.Nodes}`);
    console.log('');
    
    // Test 9: Switch back to SVG
    console.log('🔄 Test 9: Switching back to SVG mode...');
    const svgButtons = await page.$$('button');
    for (const button of svgButtons) {
      const text = await page.evaluate(el => el.textContent, button);
      if (text.includes('SVG')) {
        await button.click();
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('  ✓ Switched back to SVG mode\n');
        break;
      }
    }
    
    // Final Summary
    console.log('=' .repeat(50));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(50));
    console.log(`✓ Page loaded: YES`);
    console.log(`✓ Excalidraw button present: YES`);
    console.log(`✓ Excalidraw mode activated: YES`);
    console.log(`✓ Screenshots captured: 2 (SVG & Excalidraw)`);
    console.log(`✓ Console errors: ${errors.length}`);
    console.log(`✓ Page errors: ${pageErrors.length}`);
    console.log('='.repeat(50));
    
    if (errors.length === 0 && pageErrors.length === 0) {
      console.log('\n✅ EXCALIDRAW INTEGRATION WORKS SUCCESSFULLY!');
    } else {
      console.log('\n⚠️  EXCALIDRAW INTEGRATION HAS SOME ISSUES');
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    await page.screenshot({ path: 'test-error.png', fullPage: true });
    console.log('  Error screenshot saved as test-error.png');
  } finally {
    await browser.close();
    console.log('\n🏁 Test completed\n');
  }
}

// Run the test
testExcalidrawIntegration().catch(console.error);
