import { Eye, ShieldCheck, Store, Users } from 'lucide-react'
import { Link } from 'react-router-dom'

import './Landing.css'

const ASSET = '/landing/'

const coreValues = [
  {
    title: 'Truth Before Visibility',
    body: 'We never sacrifice accuracy for visibility. Prices, availability, policies, and product information should be verified before they are communicated to customers or AI systems.',
    icon: ShieldCheck,
  },
  {
    title: 'Access Without Advantage',
    body: 'Local businesses should not need an AI team, expensive consultants, or technical expertise to participate in AI commerce. OneBridge makes the new digital marketplace accessible to everyone.',
    icon: Store,
  },
  {
    title: 'Humans Stay Accountable',
    body: 'AI can monitor, flag, synchronize, and recommend, but people remain responsible for uncertain information and consequential decisions.',
    icon: Users,
  },
  {
    title: 'Trust Through Transparency',
    body: 'Businesses should know what information OneBridge communicates, where it came from, when it changed, and when human review is required. We do not hide uncertainty.',
    icon: Eye,
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

const planFeatures = [
  'One verified information foundation for your business',
  'OneBridge AI cleans and structures your existing data',
  'Website for People, created or optimized from your approved facts',
  'MCP Server for AI, generated from the same approved facts',
  'Dashboard with form and AI-assisted updates, no technical skills needed',
  'robots.txt and llms.txt included where appropriate',
  'Activity tracking: website visits, MCP requests, and information freshness',
  'Human review for conflicting, uncertain, or material changes',
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
      <header className="ob-header">
        <Link className="ob-header-brand" to="/" aria-label="OneBridge home">
          <img src="/brand/logo-primary.png" alt="OneBridge" className="ob-logo" />
        </Link>
        <nav className="ob-nav" aria-label="Main navigation">
          <a className="ob-nav-detail" href="#our-story">Our Story</a>
          <a className="ob-nav-detail" href="#how-it-works">How It Works</a>
          <a className="ob-nav-detail" href="#core-values">Core Values</a>
          <a className="ob-nav-detail" href="#pricing">Pricing</a>
          <Link to="/login">Log in</Link>
          <Link className="ob-button ob-button-small ob-button-outline" to="/register">Set Up Your Business</Link>
        </nav>
      </header>

      <main id="main">
        <section className="ob-hero ob-container" aria-labelledby="hero-title">
          <div className="ob-hero-copy ob-enter">
            <p className="ob-eyebrow"><span className="ob-dot" />THE TRUSTED CONNECTION</p>
            <h1 id="hero-title">Your business, told right.<br /><span>To people and to AI.</span></h1>
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

        <section id="our-story" className="ob-story-new ob-container" aria-labelledby="story-title">
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

        <section id="core-values" className="ob-values-section" aria-labelledby="values-title">
          <div className="ob-container">
            <div className="ob-values-heading">
              <p className="ob-eyebrow">WHAT GUIDES US</p>
              <h2 id="values-title">Core values, built into every connection.</h2>
              <p>The way we connect business information to AI matters as much as the technology itself.</p>
            </div>
            <ol className="ob-values-list">
              {coreValues.map(({ title, body, icon: Icon }, index) => (
                <li className="ob-value-row" key={title}>
                  <span className="ob-value-number">0{index + 1}</span>
                  <div className="ob-value-copy"><h3>{title}</h3><p>{body}</p></div>
                  <span className="ob-value-icon"><Icon size={26} strokeWidth={1.6} /></span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="pricing" className="ob-pricing ob-container" aria-labelledby="pricing-title">
          <div className="ob-pricing-heading">
            <p className="ob-eyebrow">PRICING</p>
            <h2 id="pricing-title">One Simple Subscription</h2>
            <p className="ob-body">A one-time setup fee and a flat monthly service fee. Nothing else.</p>
          </div>
          <article className="ob-plan">
            <div className="ob-plan-prices">
              <div><span className="ob-plan-label">One-time setup fee</span><p className="ob-plan-price"><strong>$250</strong></p></div>
              <div><span className="ob-plan-label">Monthly service fee</span><p className="ob-plan-price"><strong>$149</strong><span>/ month</span></p></div>
            </div>
            <div className="ob-plan-body">
              <h3>Everything You Need To Connect Both Front Doors</h3>
              <ul>
                {planFeatures.map((feature) => <li key={feature}>{feature}</li>)}
              </ul>
              <Link className="ob-button ob-button-primary" to="/register">Set Up Your Business <span aria-hidden="true">→</span></Link>
            </div>
          </article>
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
