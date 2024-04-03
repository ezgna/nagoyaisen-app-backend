import express from 'express';
import cors from 'cors';
import { login, scrapeContent } from './scraper.js';
import { firestore } from '../firebase/firebaseAdminInit.js';
import { httpsPort, privateKeyPath, certificatePath } from '../config.js';
import fs from 'fs';
import https from 'https';

const app = express();
app.use(express.json());
app.use(cors());
const privateKey = fs.readFileSync(privateKeyPath, 'utf8');
const certificate = fs.readFileSync(certificatePath, 'utf8');
const credentials = { key: privateKey, cert: certificate };
const httpsServer = https.createServer(credentials, app);

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const { isLoggedIn, page, browser } = await login(username, password);
    if (!isLoggedIn) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
      const contents = await scrapeContent(page, browser);
      const docRef = firestore.collection('scrapedData').doc('latest');
      await docRef.set({ contents });
      res.json({ message: 'login success' });

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
    const scrapedDataRef = firestore.collection('scrapedData').doc('latest');
    const scrapedDataDoc = await scrapedDataRef.get();
    if (!scrapedDataDoc.exists) {
      return res.status(404).json({ message: 'No scraped data found' });
    }
    const scrapedData = scrapedDataDoc.data();
    res.json(scrapedData);

  } catch (error) {
    console.error('Error fetching data', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

httpsServer.listen(httpsPort, () => {
  console.log(`HTTPS Server listening at https://localhost:${httpsPort}`);
});
