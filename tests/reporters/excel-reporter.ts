import ExcelJS from 'exceljs'
import { mkdir, readFile } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import type { Reporter, FullConfig, Suite, FullResult, TestStep } from '@playwright/test/reporter'

function actionSteps(steps: TestStep[]): TestStep[] {
  return steps.flatMap(step => step.category === 'test.step' ? [step] : actionSteps(step.steps))
}

export default class ExcelReporter implements Reporter {
  private suite?: Suite
  onBegin(_config: FullConfig, suite: Suite) { this.suite = suite }
  async onEnd(run: FullResult) {
    const workbook = new ExcelJS.Workbook()
    const summary = workbook.addWorksheet('Summary')
    summary.columns = [{ header: 'Field', width: 20 }, { header: 'Value', width: 60 }]
    const tests = this.suite?.allTests() ?? []
    const steps = tests.flatMap(test => test.results.flatMap(result => actionSteps(result.steps)))
    summary.addRows([
      ['Execution ID', randomUUID()],
      ['Browser', [...new Set(tests.map(test => test.parent.project()?.name ?? ''))].join(', ')],
      ['Status', run.status],
      ['Started', run.startTime.toISOString()],
      ['Finished', new Date(run.startTime.getTime() + run.duration).toISOString()],
      ['Duration (ms)', run.duration],
      ['Passed steps', steps.filter(step => !step.error && !step.annotations.some(a => a.type === 'skip')).length],
      ['Failed steps', steps.filter(step => !!step.error).length],
      ['Skipped steps', steps.filter(step => !step.error && step.annotations.some(a => a.type === 'skip')).length],
    ])
    summary.getRow(1).font = { bold: true }
    const stepSheet = workbook.addWorksheet('Steps')
    stepSheet.columns = [
      { header: '#', width: 6 }, { header: 'Action', width: 16 },
      { header: 'Status', width: 12 }, { header: 'Duration (ms)', width: 14 },
      { header: 'Locator', width: 40 }, { header: 'Error', width: 60 },
      { header: 'Screenshot', width: 24 }, { header: 'Project', width: 16 },
      { header: 'Test', width: 65 }, { header: 'Attempt', width: 12 },
    ]
    stepSheet.getRow(1).font = { bold: true }
    stepSheet.views = [{ state: 'frozen', ySplit: 1 }]
    stepSheet.autoFilter = { from: 'A1', to: 'J1' }
    let stepNumber = 0
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
        for (const step of actionSteps(result?.steps ?? [])) {
          const separator = step.title.indexOf(' | ')
          const action = separator < 0 ? step.title : step.title.slice(0, separator)
          const locator = separator < 0 ? '' : step.title.slice(separator + 3)
          const status = step.error ? 'failed' : step.annotations.some(a => a.type === 'skip') ? 'skipped' : 'passed'
          const stepRow = stepSheet.addRow([
            ++stepNumber, action, status, step.duration, locator,
            (step.error?.message ?? '').slice(0, 32000), '',
            test.parent.project()?.name ?? '', test.title, result ? result.retry + 1 : '',
          ])
          stepRow.height = 68
          stepRow.alignment = { vertical: 'top', wrapText: true }
          stepRow.eachCell({ includeEmpty: true }, cell => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: status === 'passed' ? 'FFE6F6EA' : status === 'failed' ? 'FFFFD9D9' : 'FFFFEDBC' } }
          })
          const screenshot = step.attachments.find(a => a.contentType === 'image/png')
          if (screenshot) {
            try {
              const contents = screenshot.body ?? (screenshot.path ? await readFile(screenshot.path) : undefined)
              if (!contents) throw new Error('Attachment has no image data')
              const width = contents.readUInt32BE(16)
              const height = contents.readUInt32BE(20)
              const scale = Math.min(160 / width, 90 / height)
              const imageId = workbook.addImage({ base64: contents.toString('base64'), extension: 'png' })
              stepSheet.addImage(imageId, {
                tl: { col: 6, row: stepRow.number - 1 },
                ext: { width: width * scale, height: height * scale },
                editAs: 'oneCell',
              })
            } catch (error) {
              stepRow.getCell(7).value = `Screenshot unavailable: ${String(error)}`
            }
          } else {
            stepRow.getCell(7).value = 'Screenshot unavailable'
          }
        }
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
