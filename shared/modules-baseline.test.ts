import { expect, test } from 'vitest'
import { MODULES } from './readiness'

// Locked before the registry refactor: moving the baseline cards must not change
// a single rendered field. Update this snapshot only on a deliberate copy edit.
test('baseline modules payload is unchanged', () => {
  expect(JSON.stringify(MODULES, null, 2)).toMatchSnapshot()
})
