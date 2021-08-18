import { test, expect } from '@playwright/test';

const TARGET_URL = process.env.TARGET_URL ?? 'http://localhost:8888';
const TREE_LOCATOR = '.jp-DirListing-content';

// This seems to be more robust than the page.locator('text=name')
function item(name: string) {
  return `.jp-DirListing-item[title^="Name: ${name}"]`;
}


test('should unfold', async ({ page }) => {
  await page.goto(`${TARGET_URL}/lab`);
  await page.waitForSelector('#jupyterlab-splash', { state: 'detached' });
  await page.waitForSelector('div[role="main"] >> text=Launcher');

  // Let time for JupyterLab to finish rendering
  await page.waitForTimeout(2000);

  expect(
    await page.locator(TREE_LOCATOR).screenshot()
  ).toMatchSnapshot('first-render.png');

  await page.click(item('dir1'));
  await page.waitForSelector(item('dir2'));

  expect(
    await page.locator(TREE_LOCATOR).screenshot()
  ).toMatchSnapshot('unfold-dir1.png');

  await page.click(item('dir2'));
  await page.waitForSelector(item('dir3'));

  expect(
    await page.locator(TREE_LOCATOR).screenshot()
  ).toMatchSnapshot('unfold-dir2.png');

  await page.click(item('dir3'));
  await page.waitForSelector(item('file211.txt'));

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
