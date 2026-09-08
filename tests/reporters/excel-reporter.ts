import ExcelJS from 'exceljs'
import { mkdir } from 'node:fs/promises'
import type { Reporter, FullConfig, Suite, FullResult } from '@playwright/test/reporter'

export default class ExcelReporter implements Reporter {
  private suite?: Suite
  onBegin(_config: FullConfig, suite: Suite) { this.suite = suite }
  async onEnd(run: FullResult) {
    const workbook = new ExcelJS.Workbook()
    const summary = workbook.addWorksheet('Summary')
    summary.addRows([['Run status', run.status], ['Generated (UTC)', new Date().toISOString()]])
    summary.columns = [{ width: 25 }, { width: 35 }]
    const sheet = workbook.addWorksheet('Test results')
    sheet.columns = [
      { header: 'Project', width: 16 }, { header: 'Test', width: 65 },
      { header: 'Case ID', width: 16 }, { header: 'Excel row', width: 12 },
      { header: 'Task name', width: 36 }, { header: 'Expected result', width: 20 },
      { header: 'Status', width: 16 }, { header: 'Attempt', width: 12 },
      { header: 'Duration (ms)', width: 18 }, { header: 'Error', width: 85 },
    ]
    for (const test of this.suite?.allTests() ?? []) {
      const meta = (type: string) => test.annotations.find(a => a.type === type)?.description ?? ''
      for (const result of test.results.length ? test.results : [undefined]) {
        const status = !result ? 'NOT RUN' : result.status === 'passed' ? 'PASS' : result.status === 'skipped' ? 'SKIPPED' : result.status === 'interrupted' ? 'INTERRUPTED' : 'FAIL'
        const row = sheet.addRow([
          test.parent.project()?.name ?? '', test.title, meta('case-id'), meta('excel-row'),
          meta('task-name'), meta('expected-result'), status, result ? result.retry + 1 : '',
          result?.duration ?? '', result?.errors.map(e => e.message ?? '').join('\n').slice(0, 32000) ?? '',
        ])
        row.alignment = { vertical: 'top', wrapText: true }
        row.getCell(7).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: status === 'PASS' ? 'FFDDEED6' : status === 'FAIL' ? 'FFFFD9D9' : 'FFFFEDBC' } }
      }
    }
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF355D49' } }
    sheet.views = [{ state: 'frozen', ySplit: 1 }]
    sheet.autoFilter = { from: 'A1', to: 'J1' }
    await mkdir('excel-report', { recursive: true })
    await workbook.xlsx.writeFile('excel-report/todo-results.xlsx')
  }
}
