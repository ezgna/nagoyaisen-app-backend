const puppeteer = require('puppeteer');

async function login(username, password) {
  let browser = null;
  let loginSuccess = false;
  try {
    browser = await puppeteer.launch({headless: true});
    const page = await browser.newPage();
    await page.goto('https://portal.nkz.ac.jp/portal/login.do', { waitUntil: 'networkidle0' });

    const loginSuccessPromise = page.waitForResponse(response => 
      response.url().includes('/portal/login.do') && response.status() === 302
    );

    const loginErrorPromise = page.waitForResponse(response => 
      response.url().endsWith('/portal/img/design01/under_l_red.png') && response.status() === 200
    ).then(() => {
      throw "Your password or username is invalid";
    });

    await page.type('#userId', username);
    await page.type('#password', password);
    console.log("Clicking login button...");
    await page.click('#loginButton');

    await Promise.race([loginSuccessPromise, loginErrorPromise]);

    console.log("Login successful");
    loginSuccess = true;
    return { isLoggedIn: true, page, browser };

  } catch (error) {
    console.error("Login failed:", error);
    return { isLoggedIn: false };
  } finally {
    if (browser && !loginSuccess) {
      await browser.close();
    }
  }
}

async function scrapeContent(page, browser) {
  let allDetails = [];

  for (let i = 0; i <= 9; i++) {
    const linkId = `#link_${i}`;

    await page.waitForSelector(linkId, { visible: true });
    // await page.click(linkId);
    await page.evaluate((linkId) => {
      document.querySelector(linkId).click();
    }, linkId);
    console.log(`Open the content page for ${linkId}`);
    await page.waitForSelector('#oaprfloatclose', { visible: true });

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
          const labelMappings = {
            "送信者": "sender",
            "タイトル": "title",
            "本文": "content",
            "添付ファイル": "attachment",
            "掲示期間": "datetime"
          };
        
          const labelKey = label.textContent.trim();
          if (labelMappings.hasOwnProperty(labelKey)) {
            data[labelMappings[labelKey]] = nextItem.innerHTML.trim();
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
    await page.evaluate(() => {
      document.querySelector('#oaprfloatclose').click();
    });
    await page.waitForSelector('#logout', { visible: true });
  }

  console.log("All contents are scraped");
  await browser.close();
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



