import type { CardBrief, DeliveryModule } from './readiness.js'

// Single source of truth for every dashboard module. Adding one means adding one
// entry here: the module key union, tab order, analyzer tab membership, baseline
// card, board id and status column are all derived from this list.
export interface ModuleEntry {
  key: string
  name: string
  // Renders under the Analyzers tab instead of as a top-level delivery tab.
  analyzer?: boolean
  // null/omitted = no Monday board yet, so the module stays hidden until an id
  // is set here or via its env var.
  board?: number | null
  // Defaults to `task_status`; a board that keeps status elsewhere declares it.
  statusColumn?: string
  // Defaults to ID_MONDAY_<KEY>.
  envVar?: string
  // Editorial switch: keep the board wired but drop the module from the tabs and
  // from every rollup. Distinct from a null board, which means there is nothing
  // to read yet.
  hidden?: boolean
  sub?: string
  accentColor?: string
  brief?: CardBrief
  // Hand-written baseline shown until the board returns stories. Omit it and the
  // module renders as an empty, assumed card.
  baseline?: Partial<DeliveryModule>
}

// Preserves the literal key type so ModuleKey stays a union rather than string.
function defineModule<K extends string>(entry: ModuleEntry & { key: K }) {
  return entry
}

export const MODULE_REGISTRY = [
  defineModule({
    key: 'pe',
    name: 'Pricing & Eligibility',
    sub: 'Pricing engine, eligibility evaluation, product and rules catalogs.',
    board: 18420951236,
    brief: {
      programStatus: 'on_track',
      programStatusLabel: 'On Track',
      statusLine:
        'Engine complete. Minor fixes and stakeholder-requested enhancements only. Nataliya and Richard loading all products full time using new paste-from-Excel entry.',
      goNoGo: 'Jul 20',
      goLive: 'Aug 1',
    },
    baseline: {
      percent: 71,
      status: 'on_track',
      statusLabel: 'On track',
      note: '53 of 75 tracked stories accepted. The most mature module on the program.',
      targetDate: '11 July',
      dateConfidence: 'committed',
      assumed: false,
      counts: { delivered: 53, inProgress: 14, remaining: 8 },
      buckets: {
        delivered: [
          { title: 'Product catalog and field library.', detail: 'Loan attributes modeled, loanPASS-aligned.' },
          { title: 'Rules engine, end to end.', detail: 'Backend, frontend, and CI/CD all live.' },
          { title: 'Eligibility against real prequal data.', detail: 'Evaluates actual scenarios, explains each qualify or decline.' },
          { title: 'Add and modify products and rules.', detail: 'Admin can author eligibility and pricing without code.' },
        ],
        inProgress: [
          { title: 'Final price calculation.', detail: 'Refining the full price build-up.' },
          { title: 'Pricing accuracy fixes.', detail: 'CLTV bands, LPC, escrow waiver, scope-wins precedence.' },
          { title: 'Evaluation performance.', detail: 'Faster price evaluation in review.' },
        ],
        remaining: [
          { title: 'Load Series 2 through Z rules.', detail: 'Currently blocked, the main remaining lift.' },
          { title: 'Admin draft and publish workflow.', detail: 'Separate admin edits from the live calculator.' },
          { title: 'Residual calculation fixes.', detail: 'Field dependencies and edge cases.' },
        ],
      },
    },
  }),

  defineModule({
    key: 'vt',
    name: 'Verified Truth',
    sub: 'Governed, evidence-backed loan state. Currently defining the data model and integration contract.',
    board: null,
    hidden: true,
    accentColor: '#7A5FD0',
    baseline: {
      percent: 55,
      status: 'in_progress',
      statusLabel: 'In design',
      note: 'Data model and integration contract substantially in place. The governed lifecycle is the remaining build. Figures assumed.',
      targetDate: '6 July',
      dateConfidence: 'committed',
      assumedLabel: 'Architecture phase',
      // bcount strings are non-numeric; counts derived from bucket item count (delivered) and card bignum (inProgress, remaining)
      counts: { delivered: 3, inProgress: 1, remaining: 4 },
      buckets: {
        delivered: [
          { title: 'Integration-contract principle.', detail: 'Verified Truth established as the contract between modules, not point-to-point calls.' },
          { title: 'Downstream reaction model.', detail: 'How a truth change drives pricing, conditions, and underwriting is defined.' },
          { title: 'Truth record data model.', detail: 'Versioned scenario state per loan, designed and locked.' },
        ],
        inProgress: [
          { title: 'Provenance and versioning.', detail: 'Each value linked to the evidence version behind it. Being finalized.' },
        ],
        remaining: [
          { title: 'Propose, approve, publish.', detail: 'The governance workflow for every truth change.' },
          { title: 'Auto-recalculate on publish.', detail: 'Conditions, readiness, and pricing react automatically.' },
          { title: 'Version history view.', detail: 'Reconstruct the decision trail at any point.' },
        ],
      },
    },
  }),

  defineModule({
    key: 'uw',
    name: 'Underwriting',
    sub: 'Analyzer framework and verification center.',
    board: 18420951193,
    accentColor: '#1E8E7E',
    brief: {
      programStatus: 'on_track',
      programStatusLabel: 'On Track',
      statusLine:
        'Phase 1 delivers document intake through condition clearance. Document pipeline built, four analyzers in active build. Phase 2 covers the rest of the underwriting workflow, targeted early September.',
      goNoGo: 'Jul 27',
      goLive: 'Aug 1 (Phase 1)',
      detail: {
        phaseScope: [
          'Document Upload and Versioning with automatic analyzer re-run',
          'Bank Statement, ID, Paystub, and P&L Analyzers',
          'Create, Modify, and Clear Conditions with recomputed Readiness',
          'Account Executive View in MainLogic',
        ],
        analyzerStatus: [
          { name: 'Bank Statement', note: 'extraction with provenance delivered, format tuning in progress' },
          { name: 'ID', note: 'active build, five document types supported, extraction complete' },
          { name: 'Paystub', note: 'early build, pay data extraction with cross-document discrepancy checks' },
          { name: 'P&L', note: 'early build, self-employed income extraction with bank statement reconciliation' },
        ],
      },
    },
    baseline: {
      percent: 69,
      status: 'on_track',
      statusLabel: 'On track',
      note: '9 of 13 framework stories accepted. Core analyzer plumbing is live.',
      targetDate: 'mid-August',
      dateConfidence: 'committed',
      assumed: false,
      counts: { delivered: 9, inProgress: 0, remaining: 4 },
      buckets: {
        delivered: [
          { title: 'Analyzer framework.', detail: 'Structured findings, manual trigger, full run history.' },
          { title: 'Auto re-run on new evidence.', detail: 'Replacement evidence re-triggers the right analyzers.' },
          { title: 'Analyzer service and workbench UI.', detail: 'Built and operational.' },
        ],
        inProgress: [
          { title: 'Individual analyzers.', detail: 'Bank and ID tracked on their own tabs.' },
        ],
        remaining: [
          { title: 'Verification center.', detail: 'Unified findings and discrepancy view for the underwriter.' },
          { title: 'Discrepancy accept and reject.', detail: 'With permanently recorded reason codes.' },
          { title: 'Truth-proposal handoff.', detail: 'The same output-contract dependency that gates the analyzers.' },
        ],
      },
    },
  }),

  defineModule({
    key: 'lexi',
    name: 'Lexi Intelligence',
    sub: 'Agent orchestration and Generative UI. v1 is back online answering questions from pricing data.',
    board: 18420631446,
    statusColumn: 'status',
    accentColor: '#C77DBB',
    brief: {
      goNoGo: 'Jul 20',
      goLive: 'Aug 1',
    },
    baseline: {
      percent: 55,
      status: 'in_progress',
      statusLabel: 'In progress',
      note: '11 of 20 stories accepted. v1 orchestration and the Generative UI kit are live.',
      targetDate: '6 July',
      dateConfidence: 'committed',
      assumed: false,
      counts: { delivered: 11, inProgress: 0, remaining: 9 },
      buckets: {
        delivered: [
          { title: 'Orchestration v1.', detail: 'Plan generation, sequencing, live progress.' },
          { title: 'Generative UI kit.', detail: 'Component library and interactive form flow with validation.' },
          { title: 'Edit-from-chat.', detail: 'First end-to-end agent use case, plus direct field updates.' },
        ],
        inProgress: [
          { title: 'Q&A on pricing data.', detail: 'Lexi answers from the engine, surfaced through Slack for now.' },
        ],
        remaining: [
          { title: 'Background autonomy.', detail: 'Auto-detect evidence, trigger analyzers, plan remediation for gaps.' },
          { title: 'Truth-proposal routing.', detail: 'Generate proposals from findings, route to the right approver.' },
          { title: 'Approval surface and resilience.', detail: 'Approve or reject in the workflow view, retry and recovery.' },
        ],
      },
    },
  }),

  defineModule({
    key: 'broker',
    name: 'Broker LOS',
    sub: 'Broker-facing loan origination system.',
    board: 18420631446,
    statusColumn: 'status',
    accentColor: '#3D6CC4',
    brief: {
      programStatus: 'on_track',
      programStatusLabel: 'On Track',
      statusLine:
        'Minor fixes plus new Lexi tools and functionality. New capability: brokers connect directly with their account executive from Lexi Chat.',
      goNoGo: 'Jul 20',
      goLive: 'Aug 1',
    },
  }),

  defineModule({
    key: 'bank',
    name: 'Bank Statement Analyzer',
    analyzer: true,
    sub: 'Document-extraction analyzer. Build progress from the Analyzers workstream.',
    board: 18420951194,
    brief: {
      goNoGo: 'Jul 27',
      goLive: 'Aug 1',
    },
    baseline: {
      percent: 77,
      status: 'on_track',
      statusLabel: 'On track',
      note: 'Figures assumed until the Analyzers board is tagged.',
      targetDate: '~6 July',
    },
  }),

  defineModule({
    key: 'id',
    name: 'ID Analyzer',
    analyzer: true,
    sub: 'Identity document extraction and validation.',
    board: 18420951197,
    accentColor: '#E0913B',
    brief: {
      goNoGo: 'Jul 27',
      goLive: 'Aug 1',
    },
    baseline: {
      percent: 30,
      note: 'Inherits the live analyzer framework. Identity-specific extraction and validation ahead. Figures assumed.',
      targetDate: '1 July',
      dateConfidence: 'committed',
      assumedLabel: 'Scaffolding done',
      // delivered bcount is "inherited foundation" (1 item); inProgress card shows 1; remaining card shows "—" (2 items listed)
      counts: { delivered: 1, inProgress: 1, remaining: 2 },
      buckets: {
        delivered: [
          { title: 'Analyzer framework.', detail: 'Structured findings, provenance, run history, auto re-run all reused.' },
        ],
        inProgress: [
          { title: 'Identity field extraction.', detail: 'Name, date of birth, document number, issue and expiry, issuing authority.' },
        ],
        remaining: [
          { title: 'Validation and flags.', detail: 'Expired ID, name or date-of-birth mismatch against the application and credit data.' },
          { title: 'Eligibility checks.', detail: 'Document type and residency status against program rules.' },
        ],
      },
    },
  }),

  defineModule({
    key: 'pl',
    name: 'P&L Analyzer',
    analyzer: true,
    sub: 'Profit & Loss statement extraction for self-employed Non-QM income.',
    board: 18420951201,
    accentColor: '#B5654A',
    brief: {
      goNoGo: 'Jul 27',
      goLive: 'Aug 1',
    },
  }),

  defineModule({
    key: 'paystub',
    name: 'Paystub Analyzer',
    analyzer: true,
    sub: 'Income extraction and verification from paystubs.',
    board: 18420951200,
    accentColor: '#5B8C5A',
    brief: {
      goNoGo: 'Jul 27',
      goLive: 'Aug 1',
    },
  }),

  defineModule({
    key: 'appraisal',
    name: 'Appraisal Analyzer',
    analyzer: true,
    sub: 'Property valuation and collateral data extraction from appraisal reports.',
    board: 18423914149,
    brief: {
      goNoGo: 'Aug 3',
      goLive: 'Aug 8',
    },
  }),

  defineModule({
    key: 'tax',
    name: 'Tax Docs Analyzer',
    analyzer: true,
    sub: 'Tax form extraction. Planned for Release Two.',
    board: null,
    hidden: true,
    accentColor: '#5A8FB5',
    baseline: {
      percent: 30,
      note: 'Framework scaffolding in place. Form-specific extraction is the bulk of the work, planned for Release Two. Figures assumed.',
      targetDate: '3 July',
      dateConfidence: 'committed',
      assumedLabel: 'Scaffolding done',
      // delivered bcount "inherited foundation" (1 item); inProgress card "—" (1 item); remaining card "—" (3 items)
      counts: { delivered: 1, inProgress: 1, remaining: 3 },
      buckets: {
        delivered: [
          { title: 'Analyzer framework.', detail: 'The same structured-findings and provenance plumbing the other analyzers use.' },
        ],
        inProgress: [
          { title: 'Coverage definition.', detail: 'Which forms, which fields, which discrepancy checks.' },
        ],
        remaining: [
          { title: 'Personal returns.', detail: 'Form 1040 with all schedules: AGI, wages, self-employment, rental income.' },
          { title: 'Business returns.', detail: 'Forms 1065, 1120-S, 1120: revenue, ordinary income, distributions, ownership.' },
          { title: 'Income forms.', detail: 'W-2, the 1099 family, and Schedule K-1 variants.' },
        ],
      },
    },
  }),
]

export type ModuleKey = (typeof MODULE_REGISTRY)[number]['key']

export const DEFAULT_STATUS_COLUMN = 'task_status'

const ANALYZER_SUB = 'Document-extraction analyzer. Build progress from the Analyzers workstream.'
const DELIVERY_SUB = 'Delivery module. Build progress from its dedicated Monday board.'

// A module produces a live card only when it has a board to read and is not
// deliberately hidden. Board resolution needs env access, so the caller passes the
// resolved id in and the visibility rule stays here with the registry.
export function isActiveEntry(entry: ModuleEntry, boardId: number | null): boolean {
  return boardId !== null && entry.hidden !== true
}

export function moduleEnvVar(entry: ModuleEntry): string {
  return entry.envVar ?? `ID_MONDAY_${entry.key.toUpperCase()}`
}

export function moduleStatusColumn(entry: ModuleEntry): string {
  return entry.statusColumn ?? DEFAULT_STATUS_COLUMN
}

// A bare entry still yields a complete, renderable card: an assumed placeholder
// that the live rollup overwrites as soon as its board returns stories.
export function toBaselineModule(entry: ModuleEntry): DeliveryModule {
  const module: DeliveryModule = {
    key: entry.key,
    name: entry.name,
    sub: entry.sub ?? (entry.analyzer ? ANALYZER_SUB : DELIVERY_SUB),
    phase: 'delivery',
    percent: 0,
    status: 'early',
    statusLabel: 'Early build',
    note: 'Dedicated board just seeded. Figures assumed until stories land.',
    targetDate: 'Release Two',
    dateConfidence: 'projected',
    assumed: true,
    assumedLabel: 'Awaiting board data',
    accentColor: entry.accentColor,
    brief: entry.brief,
    counts: { delivered: 0, inProgress: 0, remaining: 0 },
    buckets: { delivered: [], inProgress: [], remaining: [] },
    ...entry.baseline,
  }
  if (!module.assumed) delete module.assumedLabel
  return module
}
