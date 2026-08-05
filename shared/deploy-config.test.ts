import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { expect, test } from 'vitest'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

test('Dockerfile launches the compiled web server entrypoint', () => {
  const dockerfile = readFileSync(join(root, 'Dockerfile'), 'utf8')
  expect(dockerfile).toMatch(/dist-server\/server\/index\.js/)
})

test('.dockerignore keeps node_modules and test files out of the image', () => {
  const ignore = readFileSync(join(root, '.dockerignore'), 'utf8')
  expect(ignore).toContain('node_modules')
  expect(ignore).toMatch(/\*\.test\.ts/)
})

test('the refresh job cron schedule is declared in the provisioning script', () => {
  const provision = readFileSync(join(root, 'infra/provision.sh'), 'utf8')
  expect(provision).toContain('0 0 * * *')
})

test('a CI workflow exists to deploy to Azure Container Apps', () => {
  expect(existsSync(join(root, '.github/workflows/deploy.yml'))).toBe(true)
})

// The placeholder is non-empty, so getMondayToken() accepts it and every board 401s
// instead of the app failing loudly. That shipped to the web container's secret and
// went unnoticed until the Run now button exposed it (2026-07-30).
test('provisioning refuses to run with the placeholder Monday token', () => {
  const provision = readFileSync(join(root, 'infra/provision.sh'), 'utf8')
  const guard = provision.slice(provision.indexOf('REPLACE_WITH_MONDAY_TOKEN'))
  expect(guard).toMatch(/exit 1/)
})
