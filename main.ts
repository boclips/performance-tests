import * as lighthouse from "lighthouse";
import {} from "lighthouse/types/config";
import {} from "lighthouse/types/externs";
import * as puppeteer from "puppeteer";

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
    page.$eval("#kc-form-login", (form) => form.submit()),
    page.waitForNavigation(),
  ]);

  await page.close();
}

function isMissing(setting: string) {
  return typeof setting === "undefined" || setting === "";
}

async function main() {
  if ( isMissing(email)
    || isMissing(password)
    || isMissing(url)
  ) {
    return Promise.reject("Please set EMAIL, PASSWORD and URL");
  }
  const browser = await puppeteer.launch({
    args: [`--remote-debugging-port=${port}`],
    headless: true,
    slowMo: 50,
  });

  await login(browser, url);

  const flags: LH.Flags = {
    output: "html",
    port,
  };

  const config: LH.Config.Json = {
    extends: "lighthouse:default",
    settings: {
      emulatedFormFactor: "desktop",
      maxWaitForFcp: 15 * 1000,
      maxWaitForLoad: 35 * 1000,
      throttling: {
        cpuSlowdownMultiplier: 1,
        rttMs: 40,
        throughputKbps: 10 * 1024,
      },
    },
  };

  const result = await lighthouse(url, flags, config);
  await browser.close();

  process.stdout.write(result.report);
}

main().catch((err) => {
  process.stderr.write(err);
  process.exit(1);
});
