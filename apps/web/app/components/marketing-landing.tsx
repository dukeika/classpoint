"use client";

const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "classpoint.ng";
const appHost = `app.${rootDomain}`;
const demoHost = `demo.${rootDomain}`;

export default function MarketingLanding() {
  return (
    <main className="marketing">
      <header className="marketing-nav">
        <div className="marketing-logo">
          <span className="marketing-mark">CP</span>
          <span>ClassPoint</span>
        </div>
        <nav className="marketing-links">
          <a href="#features">Features</a>
          <a href="#impact">Impact</a>
          <a href="#workflow">Workflow</a>
          <a href="#cta">Get started</a>
        </nav>
        <div className="marketing-actions">
          <a className="ghost-button" href={`https://${appHost}/login`}>
            Sign in
          </a>
          <a className="button" href={`https://${demoHost}`}>
            Live demo
          </a>
        </div>
      </header>

      <section className="marketing-hero">
        <div>
          <span className="chip">School operations, unified</span>
          <h1>Run your school like a system, not a spreadsheet.</h1>
          <p>
            ClassPoint brings billing, academics, and communication into one shared workspace so teams move faster with
            fewer handoffs.
          </p>
          <div className="marketing-cta">
            <a className="button" href={`https://${appHost}/login`}>
              Request access
            </a>
            <a className="ghost-button" href="#workflow">
              See how it works
            </a>
          </div>
          <div className="marketing-metrics">
            <div>
              <strong>96%</strong>
              <span>on-time collections</span>
            </div>
            <div>
              <strong>4 weeks</strong>
              <span>average onboarding</span>
            </div>
            <div>
              <strong>1 hub</strong>
              <span>for staff, teachers, parents</span>
            </div>
          </div>
          <div className="marketing-role-cta">
            <small className="muted">Demo logins by role</small>
            <div className="role-buttons">
              <a className="ghost-button" href={`https://${demoHost}/login?next=/admin`}>
                Admin demo
              </a>
              <a className="ghost-button" href={`https://${demoHost}/login?next=/teacher`}>
                Teacher demo
              </a>
              <a className="ghost-button" href={`https://${demoHost}/login?next=/portal`}>
                Parent demo
              </a>
            </div>
          </div>
        </div>
        <div className="marketing-hero-card">
          <h3>What a school admin sees</h3>
          <ul>
            <li>
              <span className="dot" />
              Collections and receivables
            </li>
            <li>
              <span className="dot" />
              Staff onboarding progress
            </li>
            <li>
              <span className="dot" />
              Parent communication queue
            </li>
            <li>
              <span className="dot" />
              Academic calendar snapshot
            </li>
          </ul>
          <div className="marketing-hero-stat">
            <div>
              <strong>NGN 42.6M</strong>
              <span>processed this term</span>
            </div>
            <div>
              <strong>+18%</strong>
              <span>attendance uplift</span>
            </div>
          </div>
        </div>
      </section>

      <section className="marketing-faq" id="faq">
        <div>
          <h2>Questions schools ask</h2>
          <p className="muted">Short answers for operations and finance teams.</p>
        </div>
        <div className="marketing-faq-grid">
          <div>
            <h4>How fast can we launch?</h4>
            <p>Most schools go live in 4 weeks with guided onboarding and data import support.</p>
          </div>
          <div>
            <h4>Does it support term billing?</h4>
            <p>Yes—sessions, terms, classes, and fee templates are built-in and configurable.</p>
          </div>
          <div>
            <h4>Is it local-payment ready?</h4>
            <p>Designed for Nigerian payment flows with proof uploads, receipts, and SMS/WhatsApp reminders.</p>
          </div>
        </div>
      </section>

      <section className="marketing-trust">
        <div className="marketing-trust-card">
          <strong>Made for local ops</strong>
          <span>Term structures, payment channels, and SMS-first reminders.</span>
        </div>
        <div className="marketing-trust-card">
          <strong>One source of truth</strong>
          <span>Finance, teaching, and parent communication stay in sync.</span>
        </div>
        <div className="marketing-trust-card">
          <strong>Secure by design</strong>
          <span>Role-based access, audit trails, and AWS-grade security.</span>
        </div>
        <div className="marketing-trust-card">
          <strong>Launch fast</strong>
          <span>Guided onboarding, templates, and migration support.</span>
        </div>
      </section>

      <section className="marketing-grid" id="features">
        <article>
          <h3>Smart billing</h3>
          <p>Issue, track, and reconcile invoices with proof uploads, receipts, and automated reminders.</p>
        </article>
        <article>
          <h3>Role-based dashboards</h3>
          <p>Admins, teachers, bursars, and parents each get the views and tools they need.</p>
        </article>
        <article>
          <h3>Unified communications</h3>
          <p>Broadcast announcements, run campaigns, and log every interaction in one place.</p>
        </article>
        <article>
          <h3>Academic structure</h3>
          <p>Set sessions, terms, classes, subjects, and assessments with guided setup.</p>
        </article>
        <article>
          <h3>Operational visibility</h3>
          <p>Track attendance, results, and staff activity across the entire school.</p>
        </article>
        <article>
          <h3>Secure, scalable</h3>
          <p>Built on AWS with tenant isolation, guarded access, and auditable actions.</p>
        </article>
      </section>

      <section className="marketing-impact" id="impact">
        <div>
          <h2>Clear outcomes for every stakeholder.</h2>
          <p>
            Schools reduce admin time, parents get transparency, and teachers stay focused on instruction instead of
            paperwork.
          </p>
        </div>
        <div className="marketing-pillars">
          <div>
            <h4>Finance clarity</h4>
            <p>Know who paid, who did not, and why with real-time visibility.</p>
          </div>
          <div>
            <h4>Operational rhythm</h4>
            <p>Plan sessions, assign staff, and monitor performance in one view.</p>
          </div>
          <div>
            <h4>Parent trust</h4>
            <p>Families access invoices, results, calendars, and support in one portal.</p>
          </div>
        </div>
      </section>

      <section className="marketing-case">
        <div>
          <h2>What changes when ClassPoint goes live</h2>
          <p className="muted">
            Operations teams get a single source of truth, and parents receive consistent, automated communication.
          </p>
        </div>
        <div className="marketing-case-card">
          <h3>Demo Academy</h3>
          <p>
            Reduced payment follow-ups by 52% and cut end-of-term reporting time from two weeks to three days.
          </p>
          <div className="marketing-case-metrics">
            <div>
              <strong>+18%</strong>
              <span>fee collection</span>
            </div>
            <div>
              <strong>3 days</strong>
              <span>report turnaround</span>
            </div>
            <div>
              <strong>96%</strong>
              <span>parent engagement</span>
            </div>
          </div>
        </div>
      </section>

      <section className="marketing-modules">
        <div>
          <h2>Everything your school runs in one place.</h2>
          <p className="muted">
            Modules are designed to work together so staff do not jump between tools or re-enter data.
          </p>
        </div>
        <div className="marketing-module-grid">
          <div>
            <h4>Admissions and profiles</h4>
            <p>Centralized student and parent records with secure access controls.</p>
          </div>
          <div>
            <h4>Billing and collections</h4>
            <p>Fee plans, invoice generation, proof management, receipts, and reports.</p>
          </div>
          <div>
            <h4>Teaching workspace</h4>
            <p>Class lists, attendance capture, assessment entry, and results publishing.</p>
          </div>
          <div>
            <h4>Comms and engagement</h4>
            <p>Announcements, campaigns, and templated messages with delivery tracking.</p>
          </div>
          <div>
            <h4>Reports and analytics</h4>
            <p>Dashboards for financial health, attendance, and operational milestones.</p>
          </div>
          <div>
            <h4>Support and tickets</h4>
            <p>Help desk for parents and staff with audit logs on every action.</p>
          </div>
        </div>
      </section>

      <section className="marketing-flow" id="workflow">
        <h2>How ClassPoint rolls out</h2>
        <div className="marketing-steps">
          <div>
            <span>01</span>
            <h4>Discovery</h4>
            <p>Audit your structures, fees, and communication needs.</p>
          </div>
          <div>
            <span>02</span>
            <h4>Setup</h4>
            <p>Configure academic structure, roles, and onboarding workflows.</p>
          </div>
          <div>
            <span>03</span>
            <h4>Launch</h4>
            <p>Invite staff and parents, publish announcements, go live.</p>
          </div>
          <div>
            <span>04</span>
            <h4>Optimize</h4>
            <p>Use dashboards to refine operations and grow trust.</p>
          </div>
        </div>
      </section>

      <section className="marketing-faq">
        <div>
          <h2>Common questions</h2>
          <p className="muted">Everything you need to plan a rollout.</p>
        </div>
        <div className="marketing-faq-grid">
          <div>
            <h4>How long does onboarding take?</h4>
            <p>Most schools are live within 4 weeks, including data import and staff training.</p>
          </div>
          <div>
            <h4>Can parents access multiple children?</h4>
            <p>Yes, parents get a unified portal with profiles, invoices, and results per child.</p>
          </div>
          <div>
            <h4>Does ClassPoint support multiple campuses?</h4>
            <p>Multi-campus organizations are supported with centralized reporting.</p>
          </div>
          <div>
            <h4>Is data secure?</h4>
            <p>All data is encrypted in transit and at rest with AWS-native controls.</p>
          </div>
        </div>
      </section>

      <section className="marketing-cta-panel" id="cta">
        <div>
          <h2>Ready to run your school like a modern business?</h2>
          <p>Start with a live demo, then onboard in weeks, not months.</p>
        </div>
        <div className="marketing-cta">
          <a className="button" href={`https://${appHost}/login`}>
            Request access
          </a>
          <a className="ghost-button" href={`https://${demoHost}`}>
            Explore demo
          </a>
        </div>
      </section>

      <footer className="marketing-footer">
        <div>
          <strong>ClassPoint</strong>
          <span>Operating system for school operations.</span>
        </div>
        <div>
          <span>Security</span>
          <span>Support</span>
          <span>Contact</span>
        </div>
      </footer>
    </main>
  );
}
