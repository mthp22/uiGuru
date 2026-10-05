import {
  ArrowRight,
  Blocks,
  Code2,
  FileCode2,
  MonitorSmartphone,
  Moon,
  MousePointerClick,
  Save,
  SlidersHorizontal,
  Sun,
  Undo2,
} from 'lucide-react';
import { MotionConfig, motion, type Variants } from 'framer-motion';
import { frameworks } from './data';

const codeSample = `export function HeroSection() {
  return (
    <section className="hero">
      <h1>Build UI visually.</h1>
      <p>Turn your interface ideas into working code.</p>
      <button>Start building</button>
    </section>
  );
}`;

const features = [
  { icon: <MousePointerClick size={18} />, title: 'Drag-and-drop blocks', copy: 'Compose screens from ready-made blocks.' },
  { icon: <SlidersHorizontal size={18} />, title: 'Visual inspector', copy: 'Edit content, type, color, and spacing.' },
  { icon: <MonitorSmartphone size={18} />, title: 'Responsive preview', copy: 'Check desktop, tablet, and mobile widths.' },
  { icon: <Blocks size={18} />, title: 'Reusable components', copy: 'Drop in navbars, heroes, forms, and footers.' },
  { icon: <Undo2 size={18} />, title: 'Undo / redo', copy: 'Experiment freely with reliable history.' },
  { icon: <FileCode2 size={18} />, title: 'Seven export targets', copy: 'React, Vue, Angular, JavaFX, and more.' },
  { icon: <Save size={18} />, title: 'Autosave', copy: 'Refresh the tab and your work is still there.' },
  { icon: <Code2 size={18} />, title: 'Clean generated code', copy: 'Semantic output with no editor leftovers.' },
];

const steps = [
  { number: '01', title: 'Drag', copy: 'Choose the blocks you need.' },
  { number: '02', title: 'Design', copy: 'Customize content, spacing, colors, and layout visually.' },
  { number: '03', title: 'Export', copy: 'Take the resulting code into the framework you already use.' },
];

export function LandingPage({ onOpenBuilder }: { onOpenBuilder: () => void }) {
  return (
    <div className="landing">
      <header className="landing-nav">
        <a className="landing-logo" href="#top">
          uiGuru
        </a>
        <nav aria-label="Primary">
          <a href="#features">Features</a>
          <a href="#how-it-works">How it works</a>
          <a href="#examples">Examples</a>
        </nav>
        <button className="nav-cta" onClick={onOpenBuilder} type="button">
          Open builder
        </button>
      </header>

      <main id="top">
        <section className="landing-hero">
          <p className="eyebrow">Low-code UI builder</p>
          <h1>
            Build UI visually.
            <br />
            Ship real code.
          </h1>
          <p className="hero-copy">
            Turn your interface ideas into working code without starting from scratch. Drag, drop, customize, and
            export production-ready interfaces to React, Vue, Angular, and more.
          </p>
          <div className="hero-actions">
            <button className="button-primary" onClick={onOpenBuilder} type="button">
              Start building <ArrowRight size={17} />
            </button>
            <a className="button-secondary" href="#how-it-works">
              See how it works
            </a>
          </div>

          <div className="hero-preview">
            <div className="preview-window" aria-hidden="true">
              <div className="preview-toolbar">
                <span className="preview-dot" />
                <span className="preview-dot" />
                <span className="preview-dot" />
                <span className="preview-name">Landing page</span>
                <span className="preview-pills">
                  <i className="active" />
                  <i />
                  <i />
                </span>
                <span className="preview-zoom">100%</span>
              </div>
              <div className="preview-body">
                <div className="preview-side">
                  <span className="preview-label">Blocks</span>
                  <div className="preview-chip">Heading</div>
                  <div className="preview-chip">Text</div>
                  <div className="preview-chip">Button</div>
                  <div className="preview-chip">Image</div>
                  <span className="preview-label">Layers</span>
                  <div className="preview-layer">Section</div>
                  <div className="preview-layer indent">Heading</div>
                  <div className="preview-layer indent">Text</div>
                </div>
                <div className="preview-canvas">
                  <div className="preview-block block-heading">Build UI visually.</div>
                  <div className="preview-block block-text">Turn your interface ideas into working code.</div>
                  <div className="preview-block block-button selected">Start building</div>
                  <span className="preview-guide" />
                </div>
                <div className="preview-side preview-inspector">
                  <span className="preview-label">Heading</span>
                  <div className="preview-field">
                    <span>Content</span>
                    <i />
                  </div>
                  <div className="preview-field">
                    <span>Size</span>
                    <i className="short" />
                  </div>
                  <div className="preview-field">
                    <span>Color</span>
                    <i className="swatch" />
                  </div>
                  <span className="preview-label">Code</span>
                  <div className="preview-code">
                    <span>&lt;h1&gt;Build UI&lt;/h1&gt;</span>
                    <span>&lt;button&gt;Start&lt;/button&gt;</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="preview-flow">
              <span>Blocks</span>
              <b aria-hidden="true">→</b>
              <span>Canvas</span>
              <b aria-hidden="true">→</b>
              <span>Inspector</span>
              <b aria-hidden="true">→</b>
              <span>Code</span>
            </div>
          </div>
        </section>

        <section className="export-strip" aria-label="Export targets">
          <p>One UI. Multiple targets.</p>
          <ul>
            {frameworks.map((framework) => (
              <li key={framework.id}>{framework.label}</li>
            ))}
          </ul>
        </section>

        <section className="landing-section" id="how-it-works">
          <p className="section-kicker">How it works</p>
          <h2>Drag. Design. Export.</h2>
          <ol className="steps">
            {steps.map((step) => (
              <li key={step.number}>
                <span className="step-number">{step.number}</span>
                <h3>{step.title}</h3>
                <p>{step.copy}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="landing-section split-section" id="examples">
          <div className="split-copy">
            <p className="section-kicker">Examples</p>
            <h2>Your design. Your code.</h2>
            <p>Build visually, then take the implementation with you.</p>
            <button className="button-primary" onClick={onOpenBuilder} type="button">
              Try it yourself <ArrowRight size={17} />
            </button>
          </div>
          <div className="split-demo">
            <div className="split-canvas" aria-hidden="true">
              <span className="mini-tag">Canvas</span>
              <div className="mini-block mini-heading">Build UI visually.</div>
              <div className="mini-block mini-text">Turn your interface ideas into working code.</div>
              <div className="mini-block mini-button selected">Start building</div>
            </div>
            <pre className="split-code">
              <span className="code-tag">React</span>
              <code>{codeSample}</code>
            </pre>
          </div>
        </section>

        <section className="landing-section" id="features">
          <p className="section-kicker">Features</p>
          <h2>Everything the builder does, nothing it doesn&apos;t.</h2>
          <ul className="feature-list">
            {features.map((feature) => (
              <li key={feature.title}>
                <span className="feature-icon">{feature.icon}</span>
                <div>
                  <strong>{feature.title}</strong>
                  <span>{feature.copy}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="landing-section final-cta">
          <h2>Start building your next interface.</h2>
          <button className="button-primary" onClick={onOpenBuilder} type="button">
            Open uiGuru <ArrowRight size={17} />
          </button>
        </section>
      </main>

      <footer className="landing-footer">
        <strong>uiGuru</strong>
        <span>Build visually. Own the code.</span>
      </footer>
    </div>
  );
}
