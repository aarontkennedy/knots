import { expect, test } from '@playwright/test';

// Playwright supports service workers in Chromium only, so this runs on the Android project.
test('works offline after the first visit, every knot included', async ({ page, context, browserName }) => {
  test.skip(browserName !== 'chromium', 'Service worker testing needs Chromium');

  await page.goto('./');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await context.setOffline(true);

  await page.reload();
  await expect(page.getByRole('heading', { name: 'Knots', exact: true })).toBeVisible();
  const links = await page.locator('.knot-card').evaluateAll((els) => els.map((e) => e.getAttribute('href')!));
  expect(links).toHaveLength(14);
  for (const href of links) {
    await page.goto(`./${href}`);
    await expect(page.locator('[data-art] svg')).toBeVisible();
  }
});
