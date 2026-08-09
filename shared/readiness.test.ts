import { MODULES, ANALYZER_KEYS, buildPayload, visibleModules, MIN_VISIBLE_PERCENT } from './readiness'
import type { Module } from './readiness'

const at = (key: string, percent: number, extra: Partial<Module> = {}): Module => ({
  ...MODULES[0],
  key,
  percent,
  ...extra,
})

test('exposes every registry module in tab order', () => {
  expect(MODULES.map((m) => m.key)).toEqual(['pe', 'vt', 'uw', 'lexi', 'broker', 'docmagic', 'bank', 'id', 'pl', 'paystub', 'appraisal', 'credit', 'tax', 'tax1040', 'taxbiz', 'k1', 'form1099', 'w2', 'voe', 'title', 'insurance'])
})

test('flags exactly the assumed modules', () => {
  const assumed = MODULES.filter((m) => m.assumed).map((m) => m.key)
  expect(assumed.sort()).toEqual(['appraisal', 'bank', 'broker', 'credit', 'docmagic', 'form1099', 'id', 'insurance', 'k1', 'paystub', 'pl', 'tax', 'tax1040', 'taxbiz', 'title', 'voe', 'vt', 'w2'])
})

test('ANALYZER_KEYS lists the analyzers in order', () => {
  expect(ANALYZER_KEYS).toEqual(['bank', 'id', 'pl', 'paystub', 'appraisal', 'credit', 'tax', 'tax1040', 'taxbiz', 'k1', 'form1099', 'w2', 'voe', 'title', 'insurance'])
})

test('pe/uw/broker carry an editorial brief; uw has expandable detail', () => {
  for (const key of ['pe', 'uw', 'broker']) {
    const mod = MODULES.find((m) => m.key === key)!
    expect(mod.brief?.programStatusLabel).toBe('On Track')
    expect(mod.brief?.statusLine).toBeTruthy()
    expect(mod.brief?.goNoGo).toBeTruthy()
    expect(mod.brief?.goLive).toBeTruthy()
  }
  const uw = MODULES.find((m) => m.key === 'uw')!
  expect(uw.brief?.detail?.phaseScope).toHaveLength(4)
  expect(uw.brief?.detail?.analyzerStatus).toHaveLength(4)
})

test('lexi and the four analyzers carry Go/No-Go and Go Live dates', () => {
  const expected: Record<string, { goNoGo: string; goLive: string }> = {
    lexi: { goNoGo: 'Jul 20', goLive: 'Aug 1' },
    bank: { goNoGo: 'Jul 27', goLive: 'Aug 1' },
    id: { goNoGo: 'Jul 27', goLive: 'Aug 1' },
    pl: { goNoGo: 'Jul 27', goLive: 'Aug 1' },
    paystub: { goNoGo: 'Jul 27', goLive: 'Aug 1' },
  }
  for (const [key, dates] of Object.entries(expected)) {
    const mod = MODULES.find((m) => m.key === key)!
    expect(mod.brief?.goNoGo).toBe(dates.goNoGo)
    expect(mod.brief?.goLive).toBe(dates.goLive)
  }
})

test('bank is a delivery module', () => {
  const bank = MODULES.find((m) => m.key === 'bank')!
  expect(bank.phase).toBe('delivery')
})

test('MIN_VISIBLE_PERCENT is the 10 percent floor', () => {
  expect(MIN_VISIBLE_PERCENT).toBe(10)
})

test('visibleModules drops modules below the floor and keeps the floor itself', () => {
  const mods = [at('zero', 0), at('under', 9), at('floor', 10), at('over', 71)]
  expect(visibleModules(mods).map((m) => m.key)).toEqual(['floor', 'over'])
})

test('visibleModules exempts assumed modules from the floor', () => {
  const mods = [at('seeded', 0, { assumed: true }), at('under', 9), at('floor', 10)]
  expect(visibleModules(mods).map((m) => m.key)).toEqual(['seeded', 'floor'])
})

test('buildPayload stamps asOf and returns the modules', () => {
  const p = buildPayload('2026-06-17T14:00:00Z')
  expect(p.asOf).toBe('2026-06-17T14:00:00Z')
  expect(p.modules).toBe(MODULES)
})
