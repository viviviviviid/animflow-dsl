const puppeteer = require('puppeteer');

async function debugExcalidrawElements() {
  console.log('🐛 Debugging Excalidraw Elements\n');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1600, height: 900 }
  });
  
  const page = await browser.newPage();
  
  // Capture all console logs
  const allLogs = [];
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    allLogs.push({ type, text });
    
    // Print important logs immediately
    if (type === 'log' && (text.includes('elements') || text.includes('Mermaid') || text.includes('변환'))) {
      console.log(`[LOG] ${text}`);
    }
    if (type === 'error') {
      console.log(`[ERROR] ${text}`);
    }
  });
  
  try {
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('Clicking Excalidraw button...\n');
    const buttons = await page.$$('button');
    for (const button of buttons) {
      const text = await page.evaluate(el => el.textContent, button);
      if (text.includes('Excalidraw')) {
        await button.click();
        break;
      }
    }
    
    console.log('Waiting for conversion...\n');
    await new Promise(resolve => setTimeout(resolve, 8000));
    
    // Check React component state if possible
    const debugInfo = await page.evaluate(() => {
      // Try to find Excalidraw elements in the DOM
      const results = {
        excalidrawFound: false,
        elementsInDOM: 0,
        canvasInfo: [],
        reactProps: null
      };
      
      // Check for Excalidraw main element
      const excalidrawMain = document.querySelector('.excalidraw');
      if (excalidrawMain) {
        results.excalidrawFound = true;
        results.elementsInDOM = document.querySelectorAll('[data-id]').length;
      }
      
      // Check canvases for actual drawing content
      document.querySelectorAll('canvas').forEach((canvas, i) => {
        if (canvas.width > 100 && canvas.height > 100) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            // Sample a few pixels to check if canvas has content
            const samples = [];
            for (let x = 100; x < canvas.width; x += 200) {
              for (let y = 100; y < canvas.height; y += 200) {
                try {
                  const pixel = ctx.getImageData(x, y, 1, 1).data;
                  const isNotWhite = pixel[0] !== 255 || pixel[1] !== 255 || pixel[2] !== 255;
                  if (isNotWhite) {
                    samples.push({ x, y, r: pixel[0], g: pixel[1], b: pixel[2] });
                  }
                } catch (e) {
                  // Can't access pixel data (CORS or other issue)
                }
              }
            }
            
            results.canvasInfo.push({
              index: i,
              size: `${canvas.width}x${canvas.height}`,
              hasContent: samples.length > 0,
              samplePixels: samples.length
            });
          }
        }
      });
      
      return results;
    });
    
    console.log('Debug Info:');
    console.log(`  Excalidraw element found: ${debugInfo.excalidrawFound}`);
    console.log(`  Elements with data-id: ${debugInfo.elementsInDOM}`);
    console.log(`  Canvases with potential content:`);
    debugInfo.canvasInfo.forEach(c => {
      console.log(`    Canvas ${c.index}: ${c.size} - ${c.hasContent ? `✓ HAS CONTENT (${c.samplePixels} non-white pixels)` : '✗ Empty or white'}`);
    });
    
    console.log('\n📋 All Console Logs:');
    allLogs.forEach(log => {
      if (!log.text.includes('DevTools') && !log.text.includes('favicon')) {
        console.log(`  [${log.type}] ${log.text.substring(0, 200)}`);
      }
    });
    
    // Take a screenshot with focus on the right panel
    await page.screenshot({ path: 'debug-excalidraw.png', fullPage: false });
    console.log('\n📸 Screenshot saved: debug-excalidraw.png');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
}

debugExcalidrawElements().catch(console.error);
