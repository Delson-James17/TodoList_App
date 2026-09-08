import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test('adds a task with Enter and keeps it after reload', async ({ page }) => {
  await page.getByRole('textbox', { name: 'New task' }).fill('Write my first Playwright test')
  await page.getByRole('textbox', { name: 'New task' }).press('Enter')
  await expect(page.getByRole('checkbox', { name: 'Write my first Playwright test' })).toBeVisible()
  await expect(page.getByRole('textbox', { name: 'New task' })).toBeEmpty()
  await page.reload()
  await expect(page.getByRole('checkbox', { name: 'Write my first Playwright test' })).toBeVisible()
})

test('rejects blank tasks and adds a trimmed task using the button', async ({ page }) => {
  await page.getByRole('textbox', { name: 'New task' }).fill('   ')
  await expect(page.getByRole('button', { name: 'Add task' })).toBeDisabled()
  await page.getByRole('textbox', { name: 'New task' }).fill('  Buy groceries  ')
  await page.getByRole('button', { name: 'Add task' }).click()
  await expect(page.getByRole('checkbox', { name: 'Buy groceries', exact: true })).toBeVisible()
})

test('completes, filters, and reopens a task', async ({ page }) => {
  const task = page.getByRole('checkbox', { name: 'Plan the week ahead' })
  await task.check()
  await expect(page.getByRole('progressbar')).toHaveAttribute('value', '40')
  await page.getByRole('button', { name: 'Active', exact: true }).click()
  await expect(task).toHaveCount(0)
  await page.getByRole('button', { name: 'Completed', exact: true }).click()
  await expect(task).toBeChecked()
  await task.click() // The task disappears from this filter immediately.
  await expect(task).toHaveCount(0)
  await page.getByRole('button', { name: 'Active', exact: true }).click()
  await expect(task).not.toBeChecked()
})

test('deletes tasks and clears completed tasks without removing active ones', async ({ page }) => {
  await page.getByRole('button', { name: 'Delete Read 10 pages of a book', exact: true }).click()
  await expect(page.getByRole('checkbox', { name: 'Read 10 pages of a book' })).toHaveCount(0)
  await page.getByRole('button', { name: 'Clear completed', exact: true }).click()
  await expect(page.getByRole('checkbox', { name: 'Drink a glass of water' })).toHaveCount(0)
  await expect(page.getByRole('checkbox', { name: 'Plan the week ahead' })).toBeVisible()
  await page.getByRole('button', { name: 'Completed', exact: true }).click()
  await expect(page.getByText('Your completed tasks will appear here.')).toBeVisible()
  await page.reload()
  await expect(page.getByRole('checkbox')).toHaveCount(3)
})

test('keeps an empty list empty after reload', async ({ page }) => {
  const deleteButtons = page.getByRole('button', { name: /^Delete / })
  while (await deleteButtons.count()) await deleteButtons.first().click()
  await expect(page.getByText('A little breathing room.')).toBeVisible()
  await page.reload()
  await expect(page.getByRole('checkbox')).toHaveCount(0)
  await expect(page.getByRole('progressbar')).toHaveAttribute('value', '0')
})


test('switches themes and remembers the choice without changing tasks', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' })
  await page.reload()
  await page.getByRole('button', { name: 'Switch to dark mode' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await expect(page.locator('html')).toHaveCSS('background-color', 'rgb(23, 30, 26)')
  await page.getByRole('textbox', { name: 'New task' }).fill('A task in dark mode')
  await page.getByRole('button', { name: 'Add task' }).click()
  await page.reload()
  await expect(page.getByRole('button', { name: 'Switch to light mode' })).toBeVisible()
  await expect(page.getByRole('checkbox', { name: 'A task in dark mode' })).toBeVisible()
  await page.getByRole('button', { name: 'Switch to light mode' }).click()
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  await expect(page.locator('html')).toHaveCSS('background-color', 'rgb(247, 248, 244)')
})

test('uses the system dark preference on first visit', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.reload()
  await expect(page.getByRole('button', { name: 'Switch to light mode' })).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
})
