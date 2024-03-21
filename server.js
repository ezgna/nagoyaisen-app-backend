const express = require('express');
const cors = require('cors');
const { login, scrapeContent } = require('./scraper');
const db = require('./firebaseAdminInit');

const app = express();
const port = 3001;

app.use(express.json());
app.use(cors());

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const { isLoggedIn, page } = await login(username, password);
    if (isLoggedIn) {
      try {
        const content = await scrapeContent(page);
        const docRef = db.collection('scrapedData').doc('latest');
        await docRef.set({ content });
        // スクレイピングの結果をデータベースに保存後に成功レスポンスを送信
        res.json({ message: 'login success' });
      } catch (scrapeError) {
        console.error('failed to scrape', scrapeError);
        res.status(500).json({ message: 'Internal Server Error' });
      }
    } else {
      res.status(401).json({ message: 'Unauthorized' });
    }
  } catch (loginError) {
    console.error('login failed', loginError);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
