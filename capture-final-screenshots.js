const puppeteer = require('puppeteer');

async function captureExcalidrawDiagram() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1920, height: 1080 }
  });
  
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Click Excalidraw
    const buttons = await page.$$('button');
    for (const button of buttons) {
      const text = await page.evaluate(el => el.textContent, button);
      if (text.includes('Excalidraw')) {
        await button.click();
        break;
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Try to use the "Fit to content" or zoom to fit features if available
    // Alternatively, try pressing keyboard shortcuts
    await page.keyboard.press('Control+0'); // Reset zoom
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Take screenshots
    await page.screenshot({ path: 'excalidraw-final.png', fullPage: false });
    console.log('✅ Excalidraw screenshot saved: excalidraw-final.png');
    
    // Also capture SVG for side-by-side comparison
    const svgButtons = await page.$$('button');
    for (const button of svgButtons) {
      const text = await page.evaluate(el => el.textContent, button);
      if (text.trim() === 'SVG') {
        await button.click();
        await new Promise(resolve => setTimeout(resolve, 2000));
        await page.screenshot({ path: 'svg-final.png', fullPage: false });
        console.log('✅ SVG screenshot saved: svg-final.png');
        break;
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
}

captureExcalidrawDiagram().catch(console.error);
