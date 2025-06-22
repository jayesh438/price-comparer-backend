const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.post('/compare-prices', async (req, res) => {
  const { productName } = req.body;
  const browser = await puppeteer.launch({ headless: true });
  const results = [];

  try {
    const amazon = await browser.newPage();
    await amazon.goto(`https://www.amazon.in/s?k=${encodeURIComponent(productName)}`, { waitUntil: 'domcontentloaded' });
    const amazonData = await amazon.evaluate(() => {
      const title = document.querySelector('span.a-text-normal')?.innerText;
      const price = document.querySelector('.a-price-whole')?.innerText;
      const link = document.querySelector('a.a-link-normal')?.href;
      return { site: 'Amazon', title, price, link: 'https://amazon.in' + link };
    });
    results.push(amazonData);

    const flipkart = await browser.newPage();
    await flipkart.goto(`https://www.flipkart.com/search?q=${encodeURIComponent(productName)}`, { waitUntil: 'domcontentloaded' });
    const flipkartData = await flipkart.evaluate(() => {
      const title = document.querySelector('div._4rR01T')?.innerText || document.querySelector('.s1Q9rs')?.innerText;
      const price = document.querySelector('div._30jeq3')?.innerText;
      const link = document.querySelector('a._1fQZEK, a.s1Q9rs')?.href;
      return { site: 'Flipkart', title, price, link: link?.startsWith('http') ? link : 'https://flipkart.com' + link };
    });
    results.push(flipkartData);

    const meesho = await browser.newPage();
    await meesho.goto(`https://www.meesho.com/search?q=${encodeURIComponent(productName)}`, { waitUntil: 'domcontentloaded' });
    const meeshoData = await meesho.evaluate(() => {
      const title = document.querySelector('p.promotion-title')?.innerText || document.querySelector('p')?.innerText;
      const price = document.querySelector('h5')?.innerText;
      const link = document.querySelector('a')?.href;
      return { site: 'Meesho', title, price, link };
    });
    results.push(meeshoData);

    res.json({ results });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching prices');
  } finally {
    await browser.close();
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});