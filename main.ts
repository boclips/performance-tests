import * as puppeteer from 'puppeteer';
import * as lighthouse from 'lighthouse';
import {} from 'lighthouse/types/config';
import {} from 'lighthouse/types/externs';

const email: string = process.env.EMAIL;
const password: string = process.env.PASSWORD;
const url: string = process.env.URL;
const port = 8675;

async function login(browser, origin) {
  const page = await browser.newPage();
  await page.goto(origin);
  await page.waitForSelector('input[type="email"]', {visible: true});

  const emailInput = await page.$('input[type="email"]');
  await emailInput.type(email);
  const passwordInput = await page.$('input[type="password"]');
  await passwordInput.type(password);
  await Promise.all([
    page.$eval('#kc-form-login', form => form.submit()),
    page.waitForNavigation(),
  ]);

  await page.close();
}

async function logout(browser, origin) {
  const page = await browser.newPage();
  await page.goto(`${origin}/logout`);
  await page.close();
}

function isMissing(setting: string) {
  return typeof setting === 'undefined' || setting === '';
}

async function main() {
  if ( isMissing(email)
    || isMissing(password)
    || isMissing(url)
  ) {
    return Promise.reject('Please set EMAIL, PASSWORD and URL');
  }
  const browser = await puppeteer.launch({
    args: [`--remote-debugging-port=${port}`],
    headless: true,
    slowMo: 50,
    defaultViewport: {
      width: 1200,
      height: 900
    }
  });

  await login(browser, url);

  const flags: LH.Flags = {
    output: 'html',
    port: port
  }

  const config: LH.Config.Json = {
    extends: 'lighthouse:default',
    settings: {
      maxWaitForFcp: 15 * 1000,
      maxWaitForLoad: 35 * 1000,
      emulatedFormFactor: 'desktop',
      throttling: {
        rttMs: 40,
        throughputKbps: 10 * 1024,
        cpuSlowdownMultiplier: 1,
      }
    },
  };

  const result = await lighthouse(url, flags, config);
  await browser.close();

  console.log(result.report);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
