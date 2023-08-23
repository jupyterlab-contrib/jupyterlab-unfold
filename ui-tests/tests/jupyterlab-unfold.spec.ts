import { test, expect } from '@playwright/test';

const TARGET_URL = process.env.TARGET_URL ?? 'http://localhost:8888';
const TREE_LOCATOR = '.jp-DirListing-content';
const TABS_LOCATOR = '.lm-DockPanel-tabBar';

// This seems to be more robust than the page.locator('text=name')
function item(name: string) {
  return `.jp-DirListing-item[title^="Name: ${name}"]`;
}

test.describe.serial('jupyterlab-unfold', () => {
  test('should unfold', async ({ page }) => {
    let workspace = { data: {}, metadata: { id: 'default' } };
    await page.route(/.*\/api\/workspaces.*/, (route, request) => {
      if (request.method() === 'GET') {
        route.fulfill({
          status: 200,
          body: JSON.stringify(workspace)
        });
      } else if (request.method() === 'PUT') {
        workspace = request.postDataJSON();
        route.fulfill({ status: 204 });
      } else {
        route.continue();
      }
    });

    await page.goto(`${TARGET_URL}/lab`);
    await page.waitForSelector('#jupyterlab-splash', { state: 'detached' });
    await page.waitForSelector('div[role="main"] >> text=Launcher');

    // Let time for JupyterLab to finish rendering
    await page.hover(item('dir1'));

    expect(await page.locator(TREE_LOCATOR).screenshot()).toMatchSnapshot(
      'first-render.png'
    );

    await page.click(item('dir1'));
    await page.waitForSelector(item('dir2'));

    expect(await page.locator(TREE_LOCATOR).screenshot()).toMatchSnapshot(
      'unfold-dir1.png'
    );

    await page.click(item('dir2'));
    await page.waitForSelector(item('dir3'));

    expect(await page.locator(TREE_LOCATOR).screenshot()).toMatchSnapshot(
      'unfold-dir2.png'
    );

    await page.click(item('dir3'));
    await page.waitForSelector(item('file211.txt'));

    expect(await page.locator(TREE_LOCATOR).screenshot()).toMatchSnapshot(
      'unfold-dir3.png'
    );

    await page.click(item('dir2'));
    await page.waitForSelector(item('dir3'), { state: 'detached' });

    expect(await page.locator(TREE_LOCATOR).screenshot()).toMatchSnapshot(
      'fold-dir2.png'
    );

    await Promise.all([
      page.waitForResponse(
        response =>
          response.request().method() === 'PUT' &&
          response.status() === 204 &&
          response.url().includes('api/workspaces')
      ),
      page.click(item('dir2'))
    ]);
    await page.waitForSelector(item('dir3'));

    expect(await page.locator(TREE_LOCATOR).screenshot()).toMatchSnapshot(
      'unfold-dir2-2.png'
    );
  });

  test('should open file', async ({ page }) => {
    let workspace = {
      data: {
        'file-browser-filebrowser:openState': {
          openState: { '.': true, dir1: true, dir2: true, 'dir2/dir3': true }
        }
      },
      metadata: { id: 'default' }
    };
    await page.route(/.*\/api\/workspaces.*/, (route, request) => {
      if (request.method() === 'GET') {
        route.fulfill({
          status: 200,
          body: JSON.stringify(workspace)
        });
      } else if (request.method() === 'PUT') {
        workspace = request.postDataJSON();
        route.fulfill({ status: 204 });
      } else {
        route.continue();
      }
    });

    await page.goto(`${TARGET_URL}/lab`);
    await page.waitForSelector('#jupyterlab-splash', { state: 'detached' });
    await page.waitForSelector('div[role="main"] >> text=Launcher');

    // Let time for JupyterLab to finish rendering
    await page.hover(item('dir1'));

    await page.dblclick(item('file211.txt'));

    await page.waitForSelector('[role="main"] >> text=file211.txt');

    expect(await page.locator(TABS_LOCATOR).screenshot()).toMatchSnapshot(
      'open-file211.png'
    );
  });
});
