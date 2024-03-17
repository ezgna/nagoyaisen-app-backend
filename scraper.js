const puppeteer = require('puppeteer');

async function scrapeLogin(username, password) {
  const browser = await puppeteer.launch({headless: true});
  const page = await browser.newPage();
  await page.goto('https://portal.nkz.ac.jp/portal/top.do', { waitUntil: 'networkidle0' });
  await page.type('#userId', username);
  await page.type('#password', password);
  await page.click('#loginButton');
  await page.waitForNavigation({ waitUntil: 'networkidle0' });
  const exampleContent = await page.evaluate(() => {
    const text = document.querySelector('#link_0').textContent;
    return text.replace(/\s+/g, ' ').trim();
  });
  await browser.close();
  return exampleContent;
}

module.exports = scrapeLogin;

// (async () => {
//   const browser = await puppeteer.launch({headless: false}); // ブラウザのヘッドレスモードを無効にして動作を見る
//   const page = await browser.newPage();
//   await page.goto('https://portal.nkz.ac.jp/portal/top.do', { waitUntil: 'networkidle0' });

//   // ログインフォームにユーザー名とパスワードを入力
//   await page.type('#userId', 'nis21074');
//   await page.type('#password', '#B19980810');

//   // ログインボタンをクリック
//   await page.click('#loginButton');

//   // ナビゲーションが完了し、ネットワーク活動が落ち着くのを待つ
//   await page.waitForNavigation({ waitUntil: 'networkidle0' });

//   // ログイン後のページから情報を取得
//   const exampleContent = await page.evaluate(() => {
//     const text = document.querySelector('#link_0').textContent;
//     // すべての空白文字を一つのスペースに置換し、先頭と末尾の空白をtrimする
//     return text.replace(/\s+/g, ' ').trim();
//   });
//   console.log(exampleContent);
  

//   // await browser.close();
// })();
