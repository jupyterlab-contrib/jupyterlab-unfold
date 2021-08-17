import { test, expect } from '@playwright/test';

const TARGET_URL = process.env.TARGET_URL ?? 'http://localhost:8888';


test('should unfold', async ({ page }) => {
  await page.goto(`${TARGET_URL}/lab`);
  await page.waitForSelector('#jupyterlab-splash', { state: 'detached' });
  await page.waitForSelector('div[role="main"] >> text=Launcher');

  // await page.dblclick('text=light_single.png');

  // await page.click('text=light_single.png', {
  //   button: 'right'
  // });

  expect(
    await page.locator('.jp-DirListing-content').screenshot()
  ).toMatchSnapshot('first-render.png');

  // expect(
  //   logs.filter(s => s.startsWith('the JupyterLab main application'))
  // ).toHaveLength(1);
});
