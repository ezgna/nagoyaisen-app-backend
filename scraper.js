const puppeteer = require('puppeteer');

async function login(username, password) {
  let loginSuccess = false;
  let page = null;
  try {
    const browser = await puppeteer.launch({headless: false});
    page = await browser.newPage();
    await page.goto('https://portal.nkz.ac.jp/portal/login.do', { waitUntil: 'networkidle0' });

    const loginSuccessPromise = page.waitForResponse(response => 
      response.url().includes('/portal/login.do') && response.status() === 302
    );

    const loginErrorPromise = page.waitForResponse(response => 
      response.url().endsWith('/portal/img/design01/under_l_red.png') && response.status() === 200
    ).then(() => {
      throw new Error("Login failed");
    });

    await page.type('#userId', username);
    await page.type('#password', password);
    console.log("Clicking login button...");
    await page.click('#loginButton');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    await Promise.race([loginSuccessPromise, loginErrorPromise]);

    console.log("Login successful");
    loginSuccess = true;
    return { isLoggedIn: true, page };

  } catch (error) {
    // loginSuccessPromiseがrejectされた場合、ここでエラー処理を行う
    console.error("Login failed:", error);
    return { isLoggedIn: false };
  } finally {
    if (!loginSuccess && page) {
      await page.close();
    }
  }
}

async function scrapeContent(page) {
  let allDetails = [];

  for (let i = 0; i <= 9; i++) {
    // 各リンクのIDを生成
    const linkId = `#link_${i}`;
    console.log(`Checking existence of ${linkId}`);

    const linkExists = await page.$(linkId) !== null;
    if (!linkExists) {
      console.log(`No element found for selector: ${linkId}, skipping...`);
      continue; // 要素が存在しない場合は、次のイテレーションに進む
    }

    await page.click(linkId);
    console.log(`Open the content page for ${linkId}`);

    // 特定のセレクタが表示されるまで待機
    await page.waitForSelector('#oaprfloatclose', { visible: true });
    console.log(`Content page for ${linkId} fully loaded`);

    // ここでページの詳細を収集
    const rawDetails = await page.evaluate(() => {

      let data = {
        sender: "",
        title: "",
        content: "",
        attachment: "",
        datetime: ""
      };
      
      // .labelクラスを持つ全ての要素を取得
      const labels = document.querySelectorAll('.label');
      
      labels.forEach(label => {
        // labelの次の兄弟要素（.line_y_label）を飛ばし、その次の兄弟要素（目的の.item）を取得
        const nextItem = label.nextElementSibling ? label.nextElementSibling.nextElementSibling : null;
        
        if (nextItem && nextItem.classList.contains('item')) {
          // ラベルのテキスト内容に応じてdataオブジェクトに情報を保存
          switch (label.textContent.trim()) {
            case "送信者":
              data.sender = nextItem.innerHTML.trim();
              break;
            case "タイトル":
              data.title = nextItem.innerHTML.trim();
              break;
            case "本文":
              data.content = nextItem.innerHTML.trim();
              break;
            case "添付ファイル":
              data.attachment = nextItem.innerHTML.trim();
              break;
            case "掲示期間":
              data.datetime = nextItem.innerHTML.trim();
              break;
          }
        }
      });

      return data;
    });

    const details = {
      sender: rawDetails.sender,
      title: cleanHtmlAndWhitespace(rawDetails.title),
      content: cleanHtmlAndWhitespace(rawDetails.content),
      attachment: cleanHtmlAndWhitespace(rawDetails.attachment),
      datetime: cleanDateTime(rawDetails.datetime)
    }

    allDetails.push(details);
    console.log("Details pushed to the array");
    await page.evaluate(() => {
      document.querySelector('#oaprfloatclose').click();
    });
    await page.waitForSelector('#logout', { visible: true });
    console.log("Page loaded.");
  }

  console.log("All contents are scraped");
  return allDetails;

}

function cleanHtmlAndWhitespace(text) {
  // HTMLタグを取り除く
  const noHtml = text.replace(/<[^>]*>/g, '');
  // HTMLエンティティの&nbsp;を空白に置き換える
  let cleanText = noHtml.replace(/&nbsp;/g, ' ');
  // 連続する空白を一つの空白に置き換え、文字列の先頭と末尾の空白を取り除く
  cleanText = cleanText.replace(/\s+/g, ' ').trim();
  return cleanText;
}

function cleanDateTime(datetime) {
  // \nで文字列を分割し、最初の部分を取得
  const cleanedDatetime = datetime.split('\n')[0].trim();
  return cleanedDatetime;
}

module.exports = { login, scrapeContent };

// scrapeLogin("nis21074", "#B19980810");



