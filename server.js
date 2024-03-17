const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const scrapeLogin = require('./scraper'); // scraper.jsから関数をインポート

const app = express();
const port = 3001;

app.use(bodyParser.json());
app.use(cors());

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const content = await scrapeLogin(username, password); // スクレイピング関数を呼び出し
    res.json({ message: 'ログイン成功', content });
  } catch (error) {
    console.error('ログインに失敗しました', error);
    res.status(500).json({ message: 'ログインに失敗しました' });
  }
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});



// const express = require('express'); // Expressライブラリをインポート
// const app = express(); // アプリケーションインスタンスを作成
// const port = 3001; // サーバーのポート番号を指定


// app.use(bodyParser.json());

// app.post('/api/login', async (req, res) => {
//   const { username, password } = req.body;
//   try {
//     const browser = await
//   }
// })

// // ルートパスに対するGETリクエストを処理
// app.get('/', (req, res) => {
//   res.send('Hello World!'); // レスポンスとして文字列を返す
// });

// // 指定したポートでサーバーを起動
// app.listen(port, () => {
//   console.log(`Server listening at http://localhost:${port}`);
// });
