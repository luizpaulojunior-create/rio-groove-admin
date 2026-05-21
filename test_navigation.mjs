import puppeteer from 'puppeteer';
import { spawn } from 'child_process';
import http from 'http';

async function waitPort(port, timeout = 30000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
        try {
            await new Promise((resolve, reject) => {
                const req = http.get(`http://localhost:${port}`, (res) => {
                    resolve(true);
                });
                req.on('error', reject);
            });
            return true;
        } catch (e) {
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }
    return false;
}

async function runTest() {
    console.log("Starting dev server...");
    const devServer = spawn('npm.cmd', ['run', 'dev'], { stdio: 'pipe', shell: true });
    
    devServer.stdout.on('data', data => console.log(`[Vite] ${data.toString().trim()}`));
    devServer.stderr.on('data', data => console.log(`[Vite Error] ${data.toString().trim()}`));

    console.log("Waiting for Vite to be ready on port 5173...");
    const ready = await waitPort(5173);
    if (!ready) {
        console.error("Vite server did not start in time.");
        devServer.kill();
        process.exit(1);
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000)); // Extra time to ensure it's fully up

    console.log("Launching Puppeteer...");
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    
    page.on('console', msg => {
        console.log(`[Browser Console] ${msg.type()}: ${msg.text()}`);
    });

    console.log("Navigating to /admin/products...");
    await page.goto('http://localhost:5173/admin/products', { waitUntil: 'networkidle0' });
    
    console.log(`Current URL: ${page.url()}`);
    
    // If it redirected to login, let's login
    if (page.url().includes('/login')) {
        console.log("Logging in...");
        await page.type('input[type="email"]', 'admin@riogroove.com.br');
        await page.type('input[type="password"]', 'riogroove2024'); // guessing password or I can just bypass auth
        await page.click('button[type="submit"]');
        await page.waitForNavigation({ waitUntil: 'networkidle0' });
        console.log(`URL after login: ${page.url()}`);
        await page.goto('http://localhost:5173/admin/products', { waitUntil: 'networkidle0' });
    }

    console.log("Waiting for products to load...");
    try {
        await page.waitForSelector('a[href^="/admin/products/"]', { timeout: 10000 });
        
        const firstProductHref = await page.$eval('a[href^="/admin/products/"]', el => el.getAttribute('href'));
        console.log(`First product href to click: ${firstProductHref}`);

        console.log("Clicking on first product link...");
        await page.click('a[href^="/admin/products/"]');

        await new Promise(resolve => setTimeout(resolve, 3000)); // wait for react router rendering

        const currentUrl = page.url();
        console.log(`Current URL after click: ${currentUrl}`);

        const bodyText = await page.evaluate(() => document.body.innerText);
        const hasDetailText = bodyText.includes("PRODUCT DETAIL PAGE (TEST)");
        console.log(`Has detail text visibly: ${hasDetailText}`);
        
        if (!hasDetailText) {
            console.log("Detail text not found. Current DOM:");
            const mainContent = await page.evaluate(() => {
                const main = document.querySelector('main') || document.body;
                return main.innerHTML;
            });
            console.log(mainContent.substring(0, 500) + "...");
        }

    } catch (e) {
        console.error("Test failed during execution:", e);
    } finally {
        await browser.close();
        devServer.kill();
        process.exit(0);
    }
}

runTest().catch(e => {
    console.error(e);
    process.exit(1);
});
