import { test, expect } from '@playwright/test';

test('connectivity check', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Chord Analyzer/i);
});
