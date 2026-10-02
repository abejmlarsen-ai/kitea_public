// ─── How It Works — Flow Diagram ──────────────────────────────────────────────
// Rendered on /how-it-works. Styles live in globals.css (.hiw-flow).
//
// Desktop: a fixed 1480×490 design canvas that scales to the available width.
// Every size inside it is expressed in design units via var(--u), which is
// 1 design px at full width and shrinks with the container (container query).
// Mobile (< 1200px): a vertical stack drawn with plain flow layout.

import type { ReactNode } from 'react'

type Step = {
  id: string
  label: string
  title: string
  text: string
  icon: ReactNode
  branch?: boolean
}

const icon = (paths: ReactNode) => (
  <svg
    className="hiw-flow__icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {paths}
  </svg>
)

const STEPS: Record<string, Step> = {
  s1: {
    id: 's1', label: 'Step 01', title: 'Sign in',
    text: 'Log in to Kitea on your mobile to begin.',
    icon: icon(<><rect x="9" y="2.5" width="11" height="19" rx="2.2" /><path d="M13 18.5h3" /><path d="M2.5 12h8M7.5 9l3 3-3 3" /></>),
  },
  s2: {
    id: 's2', label: 'Step 02', title: 'Find your hunt',
    text: 'Explore the map for hunts near you, or wherever you’re headed next.',
    icon: icon(<><path d="M3 6.5l5.5-2 7 2 5.5-2v13l-5.5 2-7-2-5.5 2z" /><path d="M8.5 4.5v13M15.5 6.5v13" /></>),
  },
  s3: {
    id: 's3', label: 'Step 03', title: 'Set out',
    text: 'Choose your hunt and begin the adventure.',
    icon: icon(<><circle cx="12" cy="12" r="9" /><path d="M15.8 8.2l-2.4 5.2-5.2 2.4 2.4-5.2z" /></>),
  },
  s4: {
    id: 's4', label: 'Step 04', title: 'Choose your path',
    text: 'Two trails lead to every tag.',
    icon: icon(<><path d="M12 2.5v19" /><path d="M12 5h6.5l2.5 2.5-2.5 2.5H12" /><path d="M12 12H5.5L3 14.5 5.5 17H12" /><path d="M9 21.5h6" /></>),
  },
  s4a: {
    id: 's4a', label: 'Path 4a', title: 'On arrival', branch: true,
    text: 'Solve clues that only reveal themselves at the hunt location.',
    icon: icon(<><path d="M12 21.5s-6.5-6-6.5-11.5a6.5 6.5 0 0 1 13 0c0 5.5-6.5 11.5-6.5 11.5z" /><circle cx="12" cy="10" r="2.4" /></>),
  },
  s4b: {
    id: 's4b', label: 'Path 4b', title: 'On the way', branch: true,
    text: 'Crack a coded clue before you arrive.',
    icon: icon(<><circle cx="7.5" cy="16.5" r="4" /><path d="M10.4 13.6L20.5 3.5" /><path d="M17 7l2.5 2.5" /><path d="M14.5 9.5l2 2" /></>),
  },
  s5: {
    id: 's5', label: 'Step 05', title: 'Find the tag',
    text: 'Follow your clue to its hiding place, or trust your instincts and search.',
    icon: icon(<><circle cx="10.5" cy="10.5" r="6.5" /><path d="M15.3 15.3L21 21" /></>),
  },
  s6: {
    id: 's6', label: 'Step 06', title: 'Tap to claim',
    text: 'Hold your phone to the tag and follow the link into Kitea.',
    icon: icon(<><rect x="3" y="4" width="10" height="16" rx="2" /><path d="M7 16.5h2" /><path d="M16.5 9a4.5 4.5 0 0 1 0 6" /><path d="M19.5 6.5a8 8 0 0 1 0 11" /></>),
  },
  s7: {
    id: 's7', label: 'Step 07', title: 'Admire your find',
    text: 'A new collectible joins your library.',
    icon: icon(<><path d="M6.5 4h11l3.5 5-9 11L3 9z" /><path d="M3 9h18" /><path d="M12 20L8.5 9l2-5M12 20l3.5-11-2-5" /></>),
  },
  s8: {
    id: 's8', label: 'Step 08', title: 'Shop',
    text: 'Visit the store for limited merch tied to your completed hunt.',
    icon: icon(<><path d="M4.5 8h15l-1.2 13H5.7z" /><path d="M9 10.5V7a3 3 0 0 1 6 0v3.5" /></>),
  },
}

const BEFORE_FORK = [STEPS.s1, STEPS.s2, STEPS.s3, STEPS.s4]
const BRANCHES = [STEPS.s4a, STEPS.s4b]
const AFTER_FORK = [STEPS.s5, STEPS.s6, STEPS.s7, STEPS.s8]

// Desktop positions in design px (canvas is 1480 × 490).
const u = (n: number) => `calc(${n} * var(--u))`
const DESKTOP: { step: Step; left: number; top: number }[] = [
  { step: STEPS.s1, left: 0, top: 144 },
  { step: STEPS.s2, left: 156, top: 144 },
  { step: STEPS.s3, left: 312, top: 144 },
  { step: STEPS.s4, left: 468, top: 144 },
  { step: STEPS.s4a, left: 660, top: 4 },
  { step: STEPS.s4b, left: 660, top: 284 },
  { step: STEPS.s5, left: 892, top: 144 },
  { step: STEPS.s6, left: 1048, top: 144 },
  { step: STEPS.s7, left: 1204, top: 144 },
  { step: STEPS.s8, left: 1360, top: 144 },
]

function Tile({ step }: { step: Step }) {
  return (
    <div className={`hiw-flow__tile${step.branch ? ' hiw-flow__tile--branch' : ''}`}>
      {step.icon}
      <span className="hiw-flow__tile-text">
        <span className="hiw-flow__label">{step.label}</span>
        <span className="hiw-flow__title">{step.title}</span>
        <span className="hiw-flow__text hiw-flow__text--mobile">{step.text}</span>
      </span>
    </div>
  )
}

export default function HowItWorksFlow() {
  return (
    <div className="hiw-flow">
      {/* ── Desktop ── */}
      <div className="hiw-flow__desktop">
        <div className="hiw-flow__canvas">
          <svg className="hiw-flow__lines" viewBox="0 0 1480 490" aria-hidden="true">
            <defs>
              <marker id="hiw-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="10" markerHeight="10" markerUnits="userSpaceOnUse" orient="auto">
                <path d="M0 1L9 5L0 9z" className="hiw-flow__arrowhead" />
              </marker>
            </defs>
            <path d="M588 208H624M624 68V348M820 68H856M820 348H856M856 68V348" />
            {['M120 208H154', 'M276 208H310', 'M432 208H466', 'M624 68H658', 'M624 348H658',
              'M856 208H890', 'M1012 208H1046', 'M1168 208H1202', 'M1324 208H1358'].map((d) => (
              <path key={d} d={d} markerEnd="url(#hiw-arrow)" />
            ))}
            <circle cx="624" cy="208" r="11" className="hiw-flow__halo" />
            <circle cx="624" cy="208" r="7" className="hiw-flow__junction" />
            <circle cx="856" cy="208" r="11" className="hiw-flow__halo" />
            <circle cx="856" cy="208" r="7" className="hiw-flow__junction" />
          </svg>

          <ol className="hiw-flow__steps">
            {DESKTOP.map(({ step, left, top }) => (
              <li
                key={step.id}
                className={`hiw-flow__step${step.branch ? ' hiw-flow__step--branch' : ''}`}
                style={{ left: u(left), top: u(top) }}
              >
                <Tile step={step} />
                <p className="hiw-flow__caption">{step.text}</p>
              </li>
            ))}
          </ol>
          <span className="hiw-flow__or" style={{ left: u(720), top: u(224) }} aria-hidden="true">or</span>
        </div>
      </div>

      {/* ── Mobile ── */}
      <ol className="hiw-flow__mobile">
        {BEFORE_FORK.map((step) => (
          <li key={step.id} className="hiw-flow__mstep"><Tile step={step} /></li>
        ))}
        <li className="hiw-flow__mfork">
          <span className="hiw-flow__msplit" aria-hidden="true" />
          <span className="hiw-flow__mjoin" aria-hidden="true" />
          <span className="hiw-flow__mdot hiw-flow__mdot--split" aria-hidden="true" />
          <span className="hiw-flow__mdot hiw-flow__mdot--join" aria-hidden="true" />
          <ol className="hiw-flow__mbranches">
            {BRANCHES.map((step) => (
              <li key={step.id} className="hiw-flow__mbranch"><Tile step={step} /></li>
            ))}
          </ol>
        </li>
        {AFTER_FORK.map((step) => (
          <li key={step.id} className="hiw-flow__mstep"><Tile step={step} /></li>
        ))}
      </ol>
    </div>
  )
}
