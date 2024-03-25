const express = require('express');
const cors = require('cors');
const { login, scrapeContent } = require('./scraper');
const db = require('./firebaseAdminInit');
const http = require('http');
const WebSocket = require('ws');
const { Browser } = require('puppeteer');

const app = express();
const port = 3001;

app.use(express.json());
app.use(cors());

// HTTPサーバーを作成
const server = http.createServer(app);

// WebSocketサーバーをHTTPサーバーに紐付け
const wss = new WebSocket.Server({ server });

wss.on('connection', ws => {
  console.log('WebSocket connection established(server)');
});

// スクレイピング完了時にWebSocketを通じて通知を送る関数
const notifyScrapingComplete = () => {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send('scrapingComplete');
    }
  });
};

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const { isLoggedIn, page, browser } = await login(username, password);
    if (!isLoggedIn) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    res.json({ message: 'login success' });

    try {
      const content = await scrapeContent(page, browser);
      const docRef = db.collection('scrapedData').doc('latest');
      await docRef.set({ content });
      // スクレイピング完了時にフロントエンドに通知
      notifyScrapingComplete();
    } catch (scrapeError) {
      console.error('failed to scrape', scrapeError);
    }

  } catch (error) {
    console.error('An error occurred', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.get('/api/data', async (req, res) => {
  try {
    const docRef = db.collection('scrapedData').doc('latest');
    const doc = await docRef.get();
    if (!doc.exists) {
      return res.status(404).json({ message: 'No data found' });
    }
    res.json(doc.data());
  } catch (error) {
    console.error('Error fetching data', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// HTTPサーバーを起動し、WebSocketサーバーも同時に起動
server.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});