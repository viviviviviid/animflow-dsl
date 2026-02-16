const puppeteer = require('puppeteer');

async function detailedErrorCheck() {
  console.log('🔍 Detailed Error Analysis for Excalidraw Integration\n');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Track all network requests
  const failedRequests = [];
  page.on('requestfailed', request => {
    failedRequests.push({
      url: request.url(),
      failure: request.failure()
    });
  });
  
  // Track responses with errors
  page.on('response', response => {
    if (response.status() >= 400) {
      console.log(`  ❌ ${response.status()} - ${response.url()}`);
    }
  });
  
  // Collect console messages
  const consoleMessages = [];
  page.on('console', msg => {
    consoleMessages.push({
      type: msg.type(),
      text: msg.text(),
      location: msg.location()
    });
  });
  
  try {
    console.log('Loading page and monitoring network...\n');
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Wait for initial render
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('\n📊 SVG Mode Analysis:');
    const svgCanvas = await page.$('svg');
    if (svgCanvas) {
      console.log('  ✓ SVG canvas found');
    } else {
      console.log('  ⚠ SVG canvas not found');
    }
    
    // Click Excalidraw button
    console.log('\n🎨 Switching to Excalidraw mode...');
    const buttons = await page.$$('button');
    for (const button of buttons) {
      const text = await page.evaluate(el => el.textContent, button);
      if (text.includes('Excalidraw')) {
        await button.click();
        console.log('  ✓ Excalidraw button clicked');
        break;
      }
    }
    
    // Wait for Excalidraw to load
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('\n📊 Excalidraw Mode Analysis:');
    
    // Check for Excalidraw canvas
    const excalidrawCanvas = await page.$('.excalidraw');
    if (excalidrawCanvas) {
      console.log('  ✓ Excalidraw canvas element found');
    } else {
      console.log('  ⚠ Excalidraw canvas element not found (checking alternatives...)');
      
      // Check for canvas elements
      const canvases = await page.$$('canvas');
      console.log(`  ℹ Found ${canvases.length} canvas elements`);
      
      // Check for any Excalidraw-related classes
      const bodyHTML = await page.evaluate(() => document.body.innerHTML);
      if (bodyHTML.toLowerCase().includes('excalidraw')) {
        console.log('  ✓ Excalidraw-related content found in DOM');
      }
    }
    
    // Check if diagram is visible
    const viewerPanel = await page.$('.flex.flex-col.h-full');
    if (viewerPanel) {
      const hasContent = await page.evaluate(el => {
        return el.querySelector('canvas') !== null || 
               el.querySelector('svg') !== null ||
               el.innerHTML.includes('Loading') ||
               el.innerHTML.includes('로딩');
      }, viewerPanel);
      console.log(`  ${hasContent ? '✓' : '⚠'} Viewer panel has content: ${hasContent}`);
    }
    
    console.log('\n📋 Console Messages Summary:');
    const errorMsgs = consoleMessages.filter(m => m.type === 'error');
    const warnMsgs = consoleMessages.filter(m => m.type === 'warning');
    const logMsgs = consoleMessages.filter(m => m.type === 'log');
    
    console.log(`  Errors: ${errorMsgs.length}`);
    console.log(`  Warnings: ${warnMsgs.length}`);
    console.log(`  Logs: ${logMsgs.length}`);
    
    if (errorMsgs.length > 0) {
      console.log('\n  Error Details:');
      errorMsgs.forEach((msg, i) => {
        console.log(`    ${i + 1}. ${msg.text}`);
        if (msg.location) {
          console.log(`       Location: ${msg.location.url}:${msg.location.lineNumber}`);
        }
      });
    }
    
    if (logMsgs.length > 0 && logMsgs.some(m => m.text.includes('Mermaid') || m.text.includes('Excalidraw'))) {
      console.log('\n  Relevant Logs:');
      logMsgs
        .filter(m => m.text.includes('Mermaid') || m.text.includes('Excalidraw') || m.text.includes('생성'))
        .forEach(msg => {
          console.log(`    - ${msg.text}`);
        });
    }
    
    console.log('\n🌐 Failed Network Requests:');
    if (failedRequests.length > 0) {
      failedRequests.forEach(req => {
        console.log(`  ❌ ${req.url}`);
        console.log(`     Error: ${req.failure?.errorText || 'Unknown'}`);
      });
    } else {
      console.log('  ✓ No failed requests');
    }
    
    // Final screenshot
    await page.screenshot({ path: 'test-excalidraw-detailed.png', fullPage: true });
    console.log('\n📸 Detailed screenshot saved as test-excalidraw-detailed.png');
    
  } catch (error) {
    console.error('\n❌ Analysis failed:', error.message);
  } finally {
    await browser.close();
  }
}

detailedErrorCheck().catch(console.error);
