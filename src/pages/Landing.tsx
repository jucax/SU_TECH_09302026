import { BarChart3, Compass, Handshake, Link2 } from 'lucide-react'
import { Link } from 'react-router-dom'

import './Landing.css'

const JORGE_SLUG = 'jorges-auto-parts'
const ASSET = '/landing/'

const judgeLinks = [
  {
    label: "Jorge's website",
    description: 'The front door for people, generated from Jorge’s business-approved record.',
    href: `/site/${JORGE_SLUG}`,
  },
  {
    label: 'llms.txt',
    description: 'Published business facts and a pointer to the MCP endpoint.',
    href: `/site/${JORGE_SLUG}/llms.txt`,
  },
  {
    label: 'MCP endpoint',
    description: 'Connect it from a compatible assistant or MCP Inspector.',
    href: `/site/${JORGE_SLUG}/mcp`,
  },
  {
    label: 'Connected AI accuracy check',
    description: 'Compare answers with and without Jorge’s MCP connection.',
    href: `/dashboard/monitoring?slug=${JORGE_SLUG}`,
  },
  {
    label: 'Source on GitHub',
    description: 'Review the code, setup instructions, and prototype status.',
    href: 'https://github.com/jucax/SU_TECH_09302026',
  },
]

const steps = [
  {
    title: 'Give us what you have',
    body: 'Bring your catalog, business details, or CSV. PDF and existing website ingestion are part of the product vision.',
  },
  {
    title: 'We clean the data',
    body: 'OneBridge organizes your facts and flags uncertainty. You review and approve information before it is shared.',
  },
  {
    title: 'We create your front doors',
    body: 'A website for people and an MCP connection for compatible AI assistants draw from the same approved information.',
  },
  {
    title: 'We stay with you',
    body: 'Update your information, inspect flagged inconsistencies, and track activity from your OneBridge platform.',
  },
]

const growthPhases = [
  {
    label: 'LAND',
    title: 'Start with visibility',
    body: 'The business plan proposes a free AI Visibility Check so owners can see how supported assistants currently represent their business.',
    icon: Compass,
  },
  {
    label: 'PROVE',
    title: 'Show the evidence',
    body: 'Compare AI answers with owner-approved facts. The prototype demonstrates a focused comparison with and without Jorge’s MCP connection.',
    icon: BarChart3,
  },
  {
    label: 'CONNECT',
    title: 'Build the trusted foundation',
    body: 'Review business information, then publish a website and MCP from the same approved record.',
    icon: Link2,
  },
  {
    label: 'EXPAND',
    title: 'Grow through trusted partners',
    body: 'The pilot plan explores reaching more local businesses through chambers, small business centers, universities, and trade groups.',
    icon: Handshake,
  },
]

function Actions() {
  return (
    <div className="ob-actions">
      <Link className="ob-button ob-button-primary" to="/demo">
        See the live demo <span aria-hidden="true">→</span>
      </Link>
      <Link className="ob-button ob-button-outline" to="/register">
        Try it yourself <span aria-hidden="true">↗</span>
      </Link>
    </div>
  )
}

export function Landing() {
  return (
    <div className="ob-landing">
      <a href="#main" className="ob-skip">Skip to content</a>
      <header className="ob-header ob-container">
        <Link to="/" aria-label="OneBridge home">
          <img src="/brand/logo-primary.png" alt="OneBridge" className="ob-logo" />
        </Link>
        <nav className="ob-nav" aria-label="Main navigation">
          <a className="ob-nav-detail" href="#how-it-works">How it works</a>
          <a className="ob-nav-detail" href="#for-judges">For judges</a>
          <Link to="/login">Log in</Link>
          <Link className="ob-button ob-button-small ob-button-outline" to="/register">Set up your business</Link>
        </nav>
      </header>

      <main id="main">
        <section className="ob-hero ob-container" aria-labelledby="hero-title">
          <div className="ob-hero-copy ob-enter">
            <p className="ob-eyebrow"><span className="ob-dot" />THE TRUSTED CONNECTION</p>
            <h1 id="hero-title">You know your business.<br /><span>Help AI understand it.</span></h1>
            <p className="ob-hero-description">
              Make trusted business information easier to access in AI-assisted shopping, and help customers make better choices. OneBridge connects business-approved facts to a website for people and an MCP connection for compatible AI assistants.
            </p>
            <Actions />
            <div className="ob-hero-points">
              <span>✓ Business-approved facts</span>
              <span>✓ Humans stay in control</span>
            </div>
          </div>
          <figure className="ob-flow-figure ob-enter ob-enter-delay">
            <img src={`${ASSET}onebridge-flow.svg`} alt="Product vision: business documents, CSV files, and existing website information flow through OneBridge AI and owner review into an optimized website and MCP connection. The platform supports updates, review, and activity." />
          </figure>
        </section>

        <section className="ob-context-strip" aria-label="Businesses we serve">
          <div className="ob-container">
            <span>BUILT AROUND LOCAL BUSINESSES</span>
            <div><span>Retailers</span><i /><span>Restaurants</span><i /><span>Specialty shops</span><i /><span>Service businesses</span></div>
          </div>
        </section>

        <section className="ob-story-new ob-container" aria-labelledby="story-title">
          <div className="ob-story-heading">
            <div>
              <p className="ob-eyebrow">A WIN FOR BOTH SIDES</p>
              <h2 id="story-title">Local businesses get a voice.<br />Customers get better information.</h2>
            </div>
            <p className="ob-body">The challenge is trustworthy AI product discovery: helping small businesses make reliable information available through emerging AI channels, while helping customers make better decisions.</p>
          </div>
          <img className="ob-people-scene" src={`${ASSET}jorge-and-maria-v2.png`} alt="Illustrated Jorge at his local auto parts store and Maria using her phone to find a brake rotor, connected through OneBridge." loading="lazy" />
          <div className="ob-benefit-grid">
            <article>
              <span className="ob-benefit-label">FOR OWNERS LIKE JORGE</span>
              <h3>Your expertise, made accessible.</h3>
              <p>Jorge knows his products, prices, and inventory. OneBridge helps him share approved facts with people and compatible AI systems, without becoming an engineer.</p>
            </article>
            <article>
              <span className="ob-benefit-label">FOR CUSTOMERS LIKE MARIA</span>
              <h3>Better facts for a better choice.</h3>
              <p>Maria needs the right part, at the right price. Current compatibility and availability information helps her avoid wasted time, money, and misleading answers.</p>
            </article>
          </div>
        </section>

        <section className="ob-growth ob-container" aria-labelledby="growth-title">
          <div className="ob-growth-heading">
            <div>
              <p className="ob-eyebrow">OUR GO-TO-MARKET: LAND → PROVE → CONNECT → EXPAND</p>
              <h2 id="growth-title">Start with what AI says.<br />Build a connection people can trust.</h2>
            </div>
            <p className="ob-body">OneBridge begins by making the information gap visible, then helps a business improve and maintain the facts available to customers and compatible AI systems.</p>
          </div>
          <div className="ob-growth-grid">
            {growthPhases.map(({ label, title, body, icon: Icon }, index) => (
              <article className="ob-growth-card" key={label}>
                <div className="ob-growth-top"><span className="ob-growth-icon"><Icon size={21} strokeWidth={1.8} /></span><span className="ob-growth-number">0{index + 1}</span></div>
                <p className="ob-growth-label">{label}</p>
                <h3>{title}</h3>
                <p className="ob-growth-copy">{body}</p>
              </article>
            ))}
          </div>
          <p className="ob-growth-note"><span>PROTOTYPE SCOPE</span> The free, multi-assistant AI Visibility Check and partner expansion are planned. The current prototype demonstrates the Jorge walkthrough and a focused connected AI accuracy comparison. The business plan’s pilot targets and measures are goals, not achieved results.</p>
        </section>

        <section id="how-it-works" className="ob-how ob-container" aria-labelledby="how-title">
          <div className="ob-section-heading">
            <div><p className="ob-eyebrow">HOW DO WE DO IT?</p><h2 id="how-title">The technical solution, made simple.</h2></div>
            <p>You manage the information.<br />OneBridge connects the pieces.</p>
          </div>
          <div className="ob-steps">
            {steps.map((step, index) => (
              <article className="ob-step" key={step.title}>
                <div className="ob-step-top">
                  <span className="ob-step-art"><img src={`${ASSET}step-${index + 1}.svg`} alt="" width="100" height="80" loading="lazy" /></span>
                  <span className="ob-step-number">{String(index + 1).padStart(2, '0')}</span>
                </div>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </article>
            ))}
          </div>
          <div className="ob-trust-note"><span aria-hidden="true">✓</span><p><strong>Truth before visibility.</strong> OneBridge helps make approved information accessible. It does not guarantee recommendations or independently certify every merchant claim.</p></div>
        </section>

        <section id="for-judges" className="ob-judge-simple ob-container" aria-labelledby="judges-title">
          <p className="ob-eyebrow">FOR THE JUDGES</p>
          <h2 id="judges-title">Two ways to explore OneBridge.</h2>
          <p className="ob-body">Follow Jorge’s guided live demo, or try setting up a business yourself.</p>
          <Actions />
        </section>

        <section className="ob-judge-resources-section ob-container" aria-labelledby="resources-title">
          <div className="ob-judge-resources-heading">
            <p className="ob-eyebrow">EXPLORE THE WORKING PROTOTYPE</p>
            <h2 id="resources-title">See what OneBridge publishes.</h2>
            <p className="ob-body">Open the generated website, structured information, and accuracy check directly.</p>
          </div>
          <div className="ob-judge-resource-grid">
            {judgeLinks.map((link) => (
              <a className="ob-resource" key={link.href} href={link.href}>
                <span className="ob-resource-icon" aria-hidden="true">↗</span>
                <span><strong>{link.label}</strong><small>{link.description}</small></span>
              </a>
            ))}
          </div>
        </section>

        <section className="ob-final ob-container">
          <div><p className="ob-eyebrow">YOUR BUSINESS. YOUR INFORMATION.</p><h2>Make your next connection.</h2><p>See the idea in action, or start with what your business already knows.</p></div>
          <Actions />
        </section>
      </main>

      <footer className="ob-footer ob-container">
        <div><img src="/brand/logo-primary.png" alt="OneBridge" /><p>The Trusted Connection.</p></div>
        <div><p>Southwestern University · HSI Battle of the Brains 2026</p><p>A working prototype with example data.</p></div>
        <a href="https://github.com/jucax/SU_TECH_09302026">Source on GitHub ↗</a>
      </footer>
    </div>
  )
}
