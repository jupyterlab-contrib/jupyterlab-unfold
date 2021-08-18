import { test, expect } from '@playwright/test';

const TARGET_URL = process.env.TARGET_URL ?? 'http://localhost:8888';
const TREE_LOCATOR = '.jp-DirListing-content';


test('should unfold', async ({ page }) => {
  await page.goto(`${TARGET_URL}/lab`);
  await page.waitForSelector('#jupyterlab-splash', { state: 'detached' });
  await page.waitForSelector('div[role="main"] >> text=Launcher');

  // Let time for JupyterLab to finish rendering
  await page.waitForTimeout(2000);

  expect(
    await page.locator(TREE_LOCATOR).screenshot()
  ).toMatchSnapshot('first-render.png');

  await page.click('text=dir1');
  await page.waitForSelector('text=dir2');

  expect(
    await page.locator(TREE_LOCATOR).screenshot()
  ).toMatchSnapshot('unfold-dir1.png');

  await page.click('text=dir2');
  await page.waitForSelector('text=dir3');

  expect(
    await page.locator(TREE_LOCATOR).screenshot()
  ).toMatchSnapshot('unfold-dir2.png');

  await page.click('text=dir3');
  await page.waitForSelector('text=file211.txt');

  expect(
    await page.locator(TREE_LOCATOR).screenshot()
  ).toMatchSnapshot('unfold-dir3.png');
});


test('should work', async ({ page }) => {
  await page.goto(`${TARGET_URL}/lab`);
  await page.waitForSelector('#jupyterlab-splash', { state: 'detached' });
  await page.waitForSelector('div[role="main"] >> text=Launcher');

  // Let time for JupyterLab to finish rendering
  await page.waitForTimeout(2000);

  expect(
    await page.locator(TREE_LOCATOR).screenshot()
  ).toMatchSnapshot('second-render.png');
});
