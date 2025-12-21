import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import * as fs from 'fs';

test.describe('Accessibility Audit', () => {
    test('should not have any detectable WCAG 2.1 AA violations on the homepage', async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('[aria-label="Piano keyboard"]')).toBeVisible();

        const accessibilityScanResults = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
            .analyze();

        expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('toolbar should be keyboard accessible', async ({ page }) => {
        await page.goto('/');
        await page.keyboard.press('Tab');

        const settingsButton = page.locator('header').getByRole('button', { name: /impostazioni|settings/i });
        const viewButton = page.locator('header').getByRole('button', { name: /vista|view/i });

        await expect(settingsButton).toBeVisible();
        await expect(viewButton).toBeVisible();
        await expect(settingsButton).toHaveAttribute('type', 'button');
        await expect(viewButton).toHaveAttribute('type', 'button');
    });

    test('settings modal should be accessible', async ({ page }) => {
        await page.goto('/');
        const settingsButton = page.locator('header').getByRole('button', { name: /impostazioni|settings/i });
        await settingsButton.click();

        await expect(page.getByRole('dialog')).toBeVisible();

        const accessibilityScanResults = await new AxeBuilder({ page })
            .include('[role="dialog"]')
            .analyze();

        expect(accessibilityScanResults.violations).toEqual([]);
    });
});
