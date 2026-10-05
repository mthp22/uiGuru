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
import { useTheme } from './useTheme';

const heroStagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

const heroItem: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

const reveal: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};

const revealViewport = { once: true, amount: 0.25 } as const;

const listStagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

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
  { icon: <FileCode2 size={18} />, title: 'Five export targets', copy: 'React (.jsx/.tsx), Vue, Angular, JavaFX, HTML/CSS.' },
  { icon: <Save size={18} />, title: 'Autosave', copy: 'Refresh the tab and your work is still there.' },
  { icon: <Code2 size={18} />, title: 'Clean generated code', copy: 'Semantic output with no editor leftovers.' },
];

const steps = [
  { number: '01', title: 'Drag', copy: 'Choose the blocks you need.' },
  { number: '02', title: 'Design', copy: 'Customize content, spacing, colors, and layout visually.' },
  { number: '03', title: 'Export', copy: 'Take the resulting code into the framework you already use.' },
];

export function LandingPage({ onOpenBuilder }: { onOpenBuilder: () => void }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  return (
    <MotionConfig reducedMotion="user">
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
        <div className="nav-actions">
          <button
            aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            aria-pressed={isDark}
            className="theme-toggle"
            onClick={toggleTheme}
            title={isDark ? 'Light theme' : 'Dark theme'}
            type="button"
          >
            {isDark ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <button className="nav-cta" onClick={onOpenBuilder} type="button">
            Open builder
          </button>
        </div>
      </header>

      <main id="top">
        <section className="landing-hero">
          <motion.div variants={heroStagger} initial="hidden" animate="show">
            <motion.p className="eyebrow" variants={heroItem}>
              Low-code UI builder
            </motion.p>
            <motion.h1 variants={heroItem}>
              Build UI visually.
              <br />
              Ship real code.
            </motion.h1>
            <motion.p className="hero-copy" variants={heroItem}>
              Turn your interface ideas into working code without starting from scratch. Drag, drop, customize, and
              export production-ready interfaces to React, Vue, Angular, and more.
            </motion.p>
            <motion.div className="hero-actions" variants={heroItem}>
              <button className="button-primary" onClick={onOpenBuilder} type="button">
                Start building <ArrowRight size={17} />
              </button>
              <a className="button-secondary" href="#how-it-works">
                See how it works
              </a>
            </motion.div>
          </motion.div>

          <motion.div
            className="hero-preview"
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
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
          </motion.div>
        </section>

        <motion.section
          className="export-strip"
          aria-label="Export targets"
          variants={reveal}
          initial="hidden"
          whileInView="show"
          viewport={revealViewport}
        >
          <p>One UI. Multiple targets.</p>
          <ul>
            {frameworks.map((framework) => (
              <li key={framework.id}>{framework.label}</li>
            ))}
          </ul>
        </motion.section>

        <motion.section
          className="landing-section"
          id="how-it-works"
          variants={reveal}
          initial="hidden"
          whileInView="show"
          viewport={revealViewport}
        >
          <p className="section-kicker">How it works</p>
          <h2>Drag. Design. Export.</h2>
          <motion.ol className="steps" variants={listStagger} initial="hidden" whileInView="show" viewport={revealViewport}>
            {steps.map((step) => (
              <motion.li key={step.number} variants={reveal}>
                <span className="step-number">{step.number}</span>
                <h3>{step.title}</h3>
                <p>{step.copy}</p>
              </motion.li>
            ))}
          </motion.ol>
        </motion.section>

        <motion.section
          className="landing-section split-section"
          id="examples"
          variants={reveal}
          initial="hidden"
          whileInView="show"
          viewport={revealViewport}
        >
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
        </motion.section>

        <motion.section
          className="landing-section"
          id="features"
          variants={reveal}
          initial="hidden"
          whileInView="show"
          viewport={revealViewport}
        >
          <p className="section-kicker">Features</p>
          <h2>Everything the builder does, nothing it doesn&apos;t.</h2>
          <motion.ul className="feature-list" variants={listStagger} initial="hidden" whileInView="show" viewport={revealViewport}>
            {features.map((feature) => (
              <motion.li key={feature.title} variants={reveal}>
                <span className="feature-icon">{feature.icon}</span>
                <div>
                  <strong>{feature.title}</strong>
                  <span>{feature.copy}</span>
                </div>
              </motion.li>
            ))}
          </motion.ul>
        </motion.section>

        <motion.section
          className="landing-section final-cta"
          variants={reveal}
          initial="hidden"
          whileInView="show"
          viewport={revealViewport}
        >
          <h2>Start building your next interface.</h2>
          <button className="button-primary" onClick={onOpenBuilder} type="button">
            Open uiGuru <ArrowRight size={17} />
          </button>
        </motion.section>
      </main>

      <footer className="landing-footer">
        <strong>uiGuru</strong>
        <span>Build visually. Own the code.</span>
      </footer>
    </div>
    </MotionConfig>
  );
}
