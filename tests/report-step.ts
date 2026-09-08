import { test, type Page } from '@playwright/test'

// Keep screenshots attached to the action that produced them in both reports.
export async function reportStep(page: Page, action: string, locator: string, perform: () => Promise<unknown>) {
  await test.step(`${action} | ${locator}`, async step => {
    try {
      await perform()
    } finally {
      // A closed page must not hide the original action failure.
      try {
        await step.attach('Screenshot', {
          body: await page.screenshot({ fullPage: true, timeout: 5000 }),
          contentType: 'image/png',
        })
      } catch (error) {
        await step.attach('Screenshot unavailable', { body: String(error), contentType: 'text/plain' })
      }
    }
  })
}
