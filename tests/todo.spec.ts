import { reportStep } from './report-step'
import { readTodoCases } from './excel-data'
import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await reportStep(page, 'goto', "page", () => page.goto('/'))
})

test('adds a task with Enter and keeps it after reload', async ({ page }) => {
  await reportStep(page, 'fill', "page.getByRole('textbox', { name: 'New task' })", () => page.getByRole('textbox', { name: 'New task' }).fill('Write my first Playwright test'))
  await reportStep(page, 'press', "page.getByRole('textbox', { name: 'New task' })", () => page.getByRole('textbox', { name: 'New task' }).press('Enter'))
  await expect(page.getByRole('checkbox', { name: 'Write my first Playwright test' })).toBeVisible()
  await expect(page.getByRole('textbox', { name: 'New task' })).toBeEmpty()
  await reportStep(page, 'reload', "page", () => page.reload())
  await expect(page.getByRole('checkbox', { name: 'Write my first Playwright test' })).toBeVisible()
})

test('rejects blank tasks and adds a trimmed task using the button', async ({ page }) => {
  await reportStep(page, 'fill', "page.getByRole('textbox', { name: 'New task' })", () => page.getByRole('textbox', { name: 'New task' }).fill('   '))
  await expect(page.getByRole('button', { name: 'Add task' })).toBeDisabled()
  await reportStep(page, 'fill', "page.getByRole('textbox', { name: 'New task' })", () => page.getByRole('textbox', { name: 'New task' }).fill('  Buy groceries  '))
  await reportStep(page, 'click', "page.getByRole('button', { name: 'Add task' })", () => page.getByRole('button', { name: 'Add task' }).click())
  await expect(page.getByRole('checkbox', { name: 'Buy groceries', exact: true })).toBeVisible()
})

test('completes, filters, and reopens a task', async ({ page }) => {
  const task = page.getByRole('checkbox', { name: 'Plan the week ahead' })
  await reportStep(page, 'check', task.toString(), () => task.check())
  await expect(page.getByRole('progressbar')).toHaveAttribute('value', '40')
  await reportStep(page, 'click', "page.getByRole('button', { name: 'Active', exact: true })", () => page.getByRole('button', { name: 'Active', exact: true }).click())
  await expect(task).toHaveCount(0)
  await reportStep(page, 'click', "page.getByRole('button', { name: 'Completed', exact: true })", () => page.getByRole('button', { name: 'Completed', exact: true }).click())
  await expect(task).toBeChecked()
  await reportStep(page, 'click', task.toString(), () => task.click())
  await expect(task).toHaveCount(0)
  await reportStep(page, 'click', "page.getByRole('button', { name: 'Active', exact: true })", () => page.getByRole('button', { name: 'Active', exact: true }).click())
  await expect(task).not.toBeChecked()
})

test('deletes tasks and clears completed tasks without removing active ones', async ({ page }) => {
  await reportStep(page, 'click', "page.getByRole('button', { name: 'Delete Read 10 pages of a book', exact: true })", () => page.getByRole('button', { name: 'Delete Read 10 pages of a book', exact: true }).click())
  await expect(page.getByRole('checkbox', { name: 'Read 10 pages of a book' })).toHaveCount(0)
  await reportStep(page, 'click', "page.getByRole('button', { name: 'Clear completed', exact: true })", () => page.getByRole('button', { name: 'Clear completed', exact: true }).click())
  await expect(page.getByRole('checkbox', { name: 'Drink a glass of water' })).toHaveCount(0)
  await expect(page.getByRole('checkbox', { name: 'Plan the week ahead' })).toBeVisible()
  await reportStep(page, 'click', "page.getByRole('button', { name: 'Completed', exact: true })", () => page.getByRole('button', { name: 'Completed', exact: true }).click())
  await expect(page.getByText('Your completed tasks will appear here.')).toBeVisible()
  await reportStep(page, 'reload', "page", () => page.reload())
  await expect(page.getByRole('checkbox')).toHaveCount(3)
})

test('keeps an empty list empty after reload', async ({ page }) => {
  const deleteButtons = page.getByRole('button', { name: /^Delete / })
  while (await deleteButtons.count()) await reportStep(page, 'click', deleteButtons.first().toString(), () => deleteButtons.first().click())
  await expect(page.getByText('A little breathing room.')).toBeVisible()
  await reportStep(page, 'reload', "page", () => page.reload())
  await expect(page.getByRole('checkbox')).toHaveCount(0)
  await expect(page.getByRole('progressbar')).toHaveAttribute('value', '0')
})


test('switches themes and remembers the choice without changing tasks', async ({ page }) => {
  await reportStep(page, 'emulateMedia', "page", () => page.emulateMedia({ colorScheme: 'light' }))
  await reportStep(page, 'reload', "page", () => page.reload())
  await reportStep(page, 'click', "page.getByRole('button', { name: 'Switch to dark mode' })", () => page.getByRole('button', { name: 'Switch to dark mode' }).click())
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await expect(page.locator('html')).toHaveCSS('background-color', 'rgb(23, 30, 26)')
  await reportStep(page, 'fill', "page.getByRole('textbox', { name: 'New task' })", () => page.getByRole('textbox', { name: 'New task' }).fill('A task in dark mode'))
  await reportStep(page, 'click', "page.getByRole('button', { name: 'Add task' })", () => page.getByRole('button', { name: 'Add task' }).click())
  await reportStep(page, 'reload', "page", () => page.reload())
  await expect(page.getByRole('button', { name: 'Switch to light mode' })).toBeVisible()
  await expect(page.getByRole('checkbox', { name: 'A task in dark mode' })).toBeVisible()
  await reportStep(page, 'click', "page.getByRole('button', { name: 'Switch to light mode' })", () => page.getByRole('button', { name: 'Switch to light mode' }).click())
  await reportStep(page, 'reload', "page", () => page.reload())
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  await expect(page.locator('html')).toHaveCSS('background-color', 'rgb(247, 248, 244)')
})

test('uses the system dark preference on first visit', async ({ page }) => {
  await reportStep(page, 'emulateMedia', "page", () => page.emulateMedia({ colorScheme: 'dark' }))
  await reportStep(page, 'reload', "page", () => page.reload())
  await expect(page.getByRole('button', { name: 'Switch to light mode' })).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
})

// Each Excel row becomes its own test, with a separate result for each browser project.
const excelCases = await readTodoCases()
for (const data of excelCases) {
  test(`Excel ${data.id}: ${data.expected} (row ${data.row})`, {
    annotation: [
      { type: 'case-id', description: data.id },
      { type: 'excel-row', description: String(data.row) },
      { type: 'task-name', description: data.task },
      { type: 'expected-result', description: data.expected },
    ],
  }, async ({ page }, testInfo) => {
    await testInfo.attach('Excel input', { body: JSON.stringify(data, null, 2), contentType: 'application/json' })
    const countBefore = await page.getByRole('checkbox').count()
    await reportStep(page, 'fill', "page.getByRole('textbox', { name: 'New task' })", () => page.getByRole('textbox', { name: 'New task' }).fill(data.task))
    const add = page.getByRole('button', { name: 'Add task' })
    if (data.expected === 'blocked') {
      await expect(add).toBeDisabled()
      await reportStep(page, 'press', "page.getByRole('textbox', { name: 'New task' })", () => page.getByRole('textbox', { name: 'New task' }).press('Enter'))
      await expect(page.getByRole('checkbox')).toHaveCount(countBefore)
    } else {
      await expect(add).toBeEnabled()
      await reportStep(page, 'click', add.toString(), () => add.click())
      await expect(page.getByRole('checkbox')).toHaveCount(countBefore + 1)
      await expect(page.getByRole('checkbox', { name: data.task.trim(), exact: true }).last()).toBeVisible()
      await expect(page.getByRole('textbox', { name: 'New task' })).toBeEmpty()
    }
  })
}

