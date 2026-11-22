import { expect, test } from '@playwright/test';

test('opens a knot from the list and steps through tying it', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByRole('heading', { name: 'Knots', exact: true })).toBeVisible();
  await expect(page.locator('.knot-card')).toHaveCount(10);

  await page.getByRole('link', { name: /Bowline/ }).click();
  await expect(page.getByRole('heading', { name: 'Bowline' })).toBeVisible();
  await expect(page.locator('[data-count]')).toHaveText('Step 1 of 5');
  await expect(page.getByRole('button', { name: 'Step by step' })).toHaveAttribute('aria-pressed', 'true');

  for (let i = 2; i <= 4; i++) {
    await page.getByRole('button', { name: 'Next' }).click();
    await expect(page.locator('[data-count]')).toHaveText(`Step ${i} of 5`);
  }
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.locator('[data-count]')).toHaveText('Step 5 of 5: pull tight');
  await expect(page.getByRole('button', { name: 'Next' })).toBeDisabled();

  await page.getByRole('link', { name: 'All knots' }).click();
  await expect(page.locator('.knot-card')).toHaveCount(10);
});

test('plays straight through, and remembers that choice', async ({ page }) => {
  await page.goto('./#/k/clove');
  await page.getByRole('button', { name: 'Play through' }).click();
  await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible();
  // The whole clove hitch plays in a few seconds.
  await expect(page.locator('[data-count]')).toHaveText('Step 4 of 4: pull tight', { timeout: 15_000 });
  await expect(page.getByRole('button', { name: 'Play again' })).toBeVisible();

  await page.reload();
  await expect(page.getByRole('button', { name: 'Play through' })).toHaveAttribute('aria-pressed', 'true');
});

test('the list and every knot page fit the phone screen without sideways scrolling', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('./');
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth), 'list').toBeLessThanOrEqual(0);
  const ids = await page.locator('.knot-card').evaluateAll((els) => els.map((e) => e.getAttribute('href')!));
  for (const href of ids) {
    await page.goto(`./${href}`);
    await expect(page.locator('[data-art] svg')).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, href).toBeLessThanOrEqual(0);
  }
});

test('narrows the list to knots for a job', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'Join two ropes' }).click();
  await expect(page.locator('.knot-card:visible')).toHaveCount(2);
  await page.getByRole('link', { name: /Sheet bend/ }).click();
  await page.getByRole('link', { name: 'All knots' }).click();
  await expect(page.locator('.knot-card:visible')).toHaveCount(2);
  await page.getByRole('button', { name: 'All', exact: true }).click();
  await expect(page.locator('.knot-card:visible')).toHaveCount(10);
});
