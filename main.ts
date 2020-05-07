import * as puppeteer from "puppeteer";

const email: string = process.env.EMAIL;
const password: string = process.env.PASSWORD;
const url: string = process.env.ACHIEVE_LOGIN_URL;
const port = 8675;

module.exports = async (browser) => {
  if (url === "") {
    return browser;
  }
  const page = await browser.newPage();
  await page.goto(url);
  await page.waitForSelector('input[type="email"]', {visible: true});

  const emailInput = await page.$('input[type="email"]');
  await emailInput.type(email);
  const passwordInput = await page.$('input[type="password"]');
  await passwordInput.type(password);
  await Promise.all([
    page.$eval("#kc-form-login", (form) => form.submit()),
    page.waitForNavigation(),
  ]);

  await page.close();
};
