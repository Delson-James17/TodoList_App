# Little List

A small React + TypeScript todo app for practicing Playwright. Add, complete, filter, delete, and clear tasks. Tasks save automatically in localStorage; your first visit includes five example tasks. No account or backend required.

## Start the app

```sh
npm install
npm run dev
```

Open the local URL printed by Vite.

## Run browser tests

```sh
npx playwright install chromium
npm run test:e2e
```

Playwright starts the app automatically and runs tests in desktop Chromium and a mobile viewport. Each test gets isolated browser storage. Tests cover adding with Enter or the button, blank input, filters, completion, deletion, clearing completed tasks, and persistence after reload.

```sh
npm run test:e2e:ui
```

Use UI mode to watch and debug the tests. Start with `tests/todo.spec.ts`; locators use accessible roles and names, for example `page.getByRole('textbox', { name: 'New task' })`.

## Other checks

```sh
npm run build
npm run lint
```

## GitHub Actions + Netlify CI/CD

The workflow is `.github/workflows/ci-cd.yml`. It assumes your production branch is `main`; update the trigger branches and deployment condition if yours has another name.

- Pull requests targeting `main`: install dependencies, lint, build, and run all 14 Playwright tests.
- Pushes to `main`: run the same checks, then deploy to Netlify only if they pass.
- The Actions tab also supports manually running the workflow. Only runs on `main` deploy.
- CI tests the production build with Vite preview and deploys that exact build artifact.
- Download `playwright-results` from the workflow run to inspect the HTML report and any failure traces. After extracting, run `npx playwright show-report <path-to-playwright-report>`.

### One-time setup

1. Push this project (including `package-lock.json` and `.github/workflows/ci-cd.yml`) to a GitHub repository. This local folder is not currently a Git repository.
2. Create a Netlify project and copy its **Project ID** (also called Site ID). Use an existing project if you already have one.
3. Create a Netlify personal access token in your Netlify user settings.
4. In your GitHub repository, open **Settings → Secrets and variables → Actions → New repository secret**, and add:

   | Secret | Value |
   | --- | --- |
   | `NETLIFY_AUTH_TOKEN` | Your Netlify personal access token |
   | `NETLIFY_SITE_ID` | Your Netlify Project ID |

5. Use GitHub Actions as the deployment path. If the Netlify project is connected to Git, disable its automatic Git builds so that it cannot publish independently before the Playwright checks finish. CLI deployments should remain enabled.
6. Push to `main`, then watch **Actions → Test and deploy to Netlify**. The deployment step prints the deployed URL.

Keep token values in GitHub secrets; do not put them in the YAML file. Pull requests run tests without deployment credentials. To require passing checks before merging, configure a GitHub branch rule requiring **Build and Playwright**.

`netlify.toml` declares the build command, `dist` publish directory, and Node version. The workflow uses Netlify CLI major version 23 with `--no-build` to upload the already tested files.

References: [Playwright CI](https://playwright.dev/docs/ci), [Netlify CLI authentication](https://docs.netlify.com/api-and-cli-guides/cli-guides/get-started-with-cli/), [Netlify deploy flags](https://cli.netlify.com/commands/deploy/).

## Appearance

Use the header’s Dark mode / Light mode button to switch themes. The app starts with your system preference and remembers your selection in this browser. Playwright covers both themes and preference persistence on desktop and mobile.


## Excel test data and results

Open `tests/data/todo-cases.xlsx` in Excel. Keep the worksheet name `Todo cases` and its headers. Add one row per case with a unique Case ID, Task name (up to 200 characters), and Expected result (`added` or `blocked`). An empty Task name tests blank input. Save and close the workbook before running tests.

Run `npm run test:e2e`. The Excel cases are registered in `tests/todo.spec.ts`, separately for desktop and mobile. Six sample rows bring the default suite to 26 tests.

Open `excel-report/todo-results.xlsx` after the run. It contains a Summary sheet and Test results sheet, including the existing tests and Excel cases. Results include project, case ID, source row, input, expectation, status, attempt, duration, and failure details. Skipped or interrupted tests are labeled separately from failures. The file is overwritten each run; close it in Excel before running again. A command-line `--reporter` override replaces configured reporters, so use the normal command to generate Excel output.

The HTML report is now generated locally as well: `npx playwright show-report`. In GitHub Actions, download the `playwright-results` artifact; it includes `excel-report/todo-results.xlsx`. Commit the input workbook; generated reports are ignored by Git.
