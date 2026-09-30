import { ArrowRight, Check } from 'lucide-react'
import { Link } from 'react-router-dom'

import '@/pages/Workflow.css'

export function WorkflowFrame({
  children,
  title,
  description,
}: {
  children: React.ReactNode
  title: string
  description: string
}) {
  return (
    <main className="ob-auth-page">
      <header className="ob-auth-header">
        <Link to="/" aria-label="OneBridge home"><img src="/brand/logo-primary.png" alt="OneBridge" /></Link>
        <span>THE TRUSTED CONNECTION</span>
      </header>
      <div className="ob-auth-layout">
        <section className="ob-auth-story">
          <p className="ob-workflow-kicker"><span /> SMALL BUSINESS, CONNECTED</p>
          <h1>{title}</h1>
          <p>{description}</p>
          <ul>
            <li><Check size={17} /> One business approved information record</li>
            <li><Check size={17} /> A website for people and MCP for AI</li>
            <li><Check size={17} /> You stay in control of every fact</li>
          </ul>
          <img className="ob-auth-flow" src="/landing/onebridge-flow.svg" alt="OneBridge connects business information to a website and MCP, with an owner platform for updates and review." />
        </section>
        <section className="ob-auth-card">{children}</section>
      </div>
      <footer className="ob-auth-footer"><Link to="/">Back to OneBridge</Link><span>Secure business setup <ArrowRight size={14} /></span></footer>
    </main>
  )
}
