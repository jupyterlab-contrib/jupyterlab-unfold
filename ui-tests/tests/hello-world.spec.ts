import { test, expect } from '@playwright/test';

const TARGET_URL = process.env.TARGET_URL ?? 'http://localhost:8888';

test('should emit console message', async ({ page }) => {
  // const logs: string[] = [];

  // page.on('console', message => {
  //   logs.push(message.text());
  // });

  await page.goto(`${TARGET_URL}/lab`);
  await page.waitForSelector('#jupyterlab-splash', { state: 'detached' });
  await page.waitForSelector('div[role="main"] >> text=Launcher');

  // await page.dblclick('text=light_single.png');

  // await page.click('text=light_single.png', {
  //   button: 'right'
  // });

  expect(
    await page.locator('div[role="main"]').screenshot()
    // await page.locator('div[role="main"] >> text=light_single.png').screenshot()
  ).toMatchSnapshot('test-image.png');

  // expect(
  //   logs.filter(s => s.startsWith('the JupyterLab main application'))
  // ).toHaveLength(1);
});
