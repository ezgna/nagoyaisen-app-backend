const express = require('express'); // Expressライブラリをインポート
const app = express(); // アプリケーションインスタンスを作成
const port = 3001; // サーバーのポート番号を指定

// ルートパスに対するGETリクエストを処理
app.get('/', (req, res) => {
  res.send('Hello World!'); // レスポンスとして文字列を返す
});

// 指定したポートでサーバーを起動
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
