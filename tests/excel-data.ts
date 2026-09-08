import ExcelJS from 'exceljs'
import { fileURLToPath } from 'node:url'
import { readFile } from 'node:fs/promises'

export async function readTodoCases() {
  const workbook = new ExcelJS.Workbook()
  const workbookPath = fileURLToPath(new URL('./data/todo-cases.xlsx', import.meta.url))
  let contents: Buffer
  try {
    contents = await readFile(workbookPath)
  } catch (error) {
    throw new Error(`Cannot read Excel test data at ${workbookPath}. Ensure tests/data/todo-cases.xlsx exists and is saved.`, { cause: error })
  }
  await workbook.xlsx.load(new Uint8Array(contents).buffer)
  const sheet = workbook.getWorksheet('Todo cases')
  if (!sheet) throw new Error('Excel workbook needs a worksheet named "Todo cases".')
  const headers = ['Case ID', 'Task name', 'Expected result']
  headers.forEach((header, index) => {
    if (sheet.getRow(1).getCell(index + 1).text !== header) throw new Error(`Excel column ${index + 1} must be "${header}".`)
  })
  const cases: { id: string; task: string; expected: 'added' | 'blocked'; row: number }[] = []
  const ids = new Set<string>()
  sheet.eachRow((row, number) => {
    if (number === 1) return
    const id = row.getCell(1).text.trim()
    const task = row.getCell(2).text
    const expected = row.getCell(3).text.trim()
    if (!id && !task && !expected) return
    if (!id || ids.has(id)) throw new Error(`Excel row ${number}: Case ID must be nonempty and unique.`)
    if (expected !== 'added' && expected !== 'blocked') throw new Error(`Excel row ${number}: Expected result must be added or blocked.`)
    if (task.length > 200) throw new Error(`Excel row ${number}: Task name must be at most 200 characters.`)
    ids.add(id)
    cases.push({ id, task, expected, row: number })
  })
  if (!cases.length) throw new Error('Excel workbook contains no test cases.')
  return cases
}

