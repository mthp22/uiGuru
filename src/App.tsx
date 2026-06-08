import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import {
  Clipboard,
  Download,
  Eye,
  Grid2X2,
  LayoutDashboard,
  Monitor,
  PanelLeft,
  PanelRight,
  Save,
  Smartphone,
  Tablet,
  WandSparkles,
} from 'lucide-react';
import { createDesign, frameworks, pagePresets, presetContent } from './data';
import { exportDesign } from './exporters';
import type { Design, PagePreset, PreviewSize } from './types';

const storageKey = 'uiguru:saved-designs';

const previewWidths: Record<PreviewSize, string> = {
  desktop: '100%',
  tablet: '720px',
  mobile: '390px',
};

function readSavedDesigns(): Design[] {
  try {
    const stored = localStorage.getItem(storageKey);
    return stored ? (JSON.parse(stored) as Design[]) : [];
  } catch {
    return [];
  }
}

function AppButton({
  children,
  onClick,
  active,
  title,
}: {
  children: ReactNode;
  onClick: () => void;
  active?: boolean;
  title?: string;
}) {
  return (
    <button className={`icon-button ${active ? 'is-active' : ''}`} onClick={onClick} title={title} type="button">
      {children}
    </button>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="toggle">
      <input checked={checked} onChange={(event) => onChange(event.target.checked)} type="checkbox" />
      <span>{label}</span>
    </label>
  );
}

export function App() {
  const [design, setDesign] = useState(() => createDesign({ name: 'Revenue dashboard card' }));
  const [saved, setSaved] = useState<Design[]>(readSavedDesigns);
  const [previewSize, setPreviewSize] = useState<PreviewSize>('desktop');
  const exportedCode = useMemo(() => exportDesign(design, design.framework), [design]);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(saved));
  }, [saved]);

  const updateDesign = (patch: Partial<Design>) => {
    setDesign((current) => ({ ...current, ...patch, updatedAt: new Date().toISOString() }));
  };

  const updateContent = (key: keyof Design['content'], value: string | string[]) => {
    setDesign((current) => ({
      ...current,
      content: { ...current.content, [key]: value },
      updatedAt: new Date().toISOString(),
    }));
  };

  const updateStyle = (key: keyof Design['style'], value: string | number | boolean) => {
    setDesign((current) => ({
      ...current,
      style: { ...current.style, [key]: value },
      updatedAt: new Date().toISOString(),
    }));
  };

  const choosePreset = (preset: PagePreset) => {
    setDesign((current) => ({
      ...current,
      preset,
      name: pagePresets.find((item) => item.id === preset)?.label ?? current.name,
      content: { ...presetContent[preset] },
      updatedAt: new Date().toISOString(),
    }));
  };

  const saveDesign = () => {
    setSaved((current) => {
      const nextDesign = { ...design, id: design.id || crypto.randomUUID(), updatedAt: new Date().toISOString() };
      const existing = current.filter((item) => item.id !== nextDesign.id);
      return [nextDesign, ...existing].slice(0, 12);
    });
  };

  const copyCode = async () => {
    await navigator.clipboard.writeText(exportedCode);
  };

  const downloadCode = () => {
    const extension = design.framework === 'javafx' ? 'java' : design.framework === 'html-css' ? 'html' : 'txt';
    const blob = new Blob([exportedCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `uiguru-${design.mode}-${design.framework}.${extension}`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="app-shell">
      <aside className="workspace-panel controls-panel">
        <div className="brand-row">
          <div>
            <strong>uiGuru</strong>
            <span>Framework UI playground</span>
          </div>
          <WandSparkles size={20} />
        </div>

        <div className="segmented">
          <button className={design.mode === 'card' ? 'active' : ''} onClick={() => updateDesign({ mode: 'card' })} type="button">
            <PanelLeft size={16} /> Card
          </button>
          <button className={design.mode === 'page' ? 'active' : ''} onClick={() => updateDesign({ mode: 'page' })} type="button">
            <LayoutDashboard size={16} /> Page
          </button>
        </div>

        <section>
          <h2>Presets</h2>
          <div className="preset-list">
            {pagePresets.map((preset) => (
              <button
                className={design.preset === preset.id ? 'preset active' : 'preset'}
                key={preset.id}
                onClick={() => choosePreset(preset.id)}
                type="button"
              >
                <strong>{preset.label}</strong>
                <span>{preset.description}</span>
              </button>
            ))}
          </div>
        </section>

        <section>
          <h2>Content</h2>
          <Field label="Name">
            <input value={design.name} onChange={(event) => updateDesign({ name: event.target.value })} />
          </Field>
          <Field label="Title">
            <input value={design.content.title} onChange={(event) => updateContent('title', event.target.value)} />
          </Field>
          <Field label="Subtitle">
            <input value={design.content.subtitle} onChange={(event) => updateContent('subtitle', event.target.value)} />
          </Field>
          <Field label="Body">
            <textarea value={design.content.body} onChange={(event) => updateContent('body', event.target.value)} rows={4} />
          </Field>
          <Field label="Meta">
            <input value={design.content.meta} onChange={(event) => updateContent('meta', event.target.value)} />
          </Field>
          <Field label="Image URL">
            <input value={design.content.image} onChange={(event) => updateContent('image', event.target.value)} />
          </Field>
          <Field label="Badges">
            <input value={design.content.badges.join(', ')} onChange={(event) => updateContent('badges', event.target.value.split(',').map((item) => item.trim()).filter(Boolean))} />
          </Field>
          <Field label="List Items">
            <textarea value={design.content.items.join('\n')} onChange={(event) => updateContent('items', event.target.value.split('\n').filter(Boolean))} rows={4} />
          </Field>
        </section>

        <section>
          <h2>Style</h2>
          <div className="swatch-row">
            {['#2563eb', '#0f766e', '#b45309', '#be123c', '#4338ca'].map((color) => (
              <button
                aria-label={`Use ${color}`}
                className={design.style.accent === color ? 'swatch active' : 'swatch'}
                key={color}
                onClick={() => updateStyle('accent', color)}
                style={{ background: color }}
                type="button"
              />
            ))}
          </div>
          <Field label="Accent">
            <input type="color" value={design.style.accent} onChange={(event) => updateStyle('accent', event.target.value)} />
          </Field>
          <Field label={`Spacing ${design.style.spacing}px`}>
            <input min="10" max="34" type="range" value={design.style.spacing} onChange={(event) => updateStyle('spacing', Number(event.target.value))} />
          </Field>
          <Field label={`Radius ${design.style.radius}px`}>
            <input min="0" max="24" type="range" value={design.style.radius} onChange={(event) => updateStyle('radius', Number(event.target.value))} />
          </Field>
          <Field label={`Shadow ${design.style.shadow}`}>
            <input min="0" max="28" type="range" value={design.style.shadow} onChange={(event) => updateStyle('shadow', Number(event.target.value))} />
          </Field>
          <Field label={`Type ${design.style.fontScale.toFixed(1)}x`}>
            <input min="0.8" max="1.3" step="0.1" type="range" value={design.style.fontScale} onChange={(event) => updateStyle('fontScale', Number(event.target.value))} />
          </Field>
          <div className="toggle-grid">
            <Toggle checked={design.style.showImage} label="Image" onChange={(checked) => updateStyle('showImage', checked)} />
            <Toggle checked={design.style.showBadges} label="Badges" onChange={(checked) => updateStyle('showBadges', checked)} />
            <Toggle checked={design.style.showActions} label="Actions" onChange={(checked) => updateStyle('showActions', checked)} />
          </div>
          <Field label="Card layout">
            <select value={design.style.cardLayout} onChange={(event) => updateStyle('cardLayout', event.target.value)}>
              <option value="vertical">Vertical</option>
              <option value="horizontal">Horizontal</option>
              <option value="compact">Compact</option>
            </select>
          </Field>
          <Field label="Page layout">
            <select value={design.style.pageLayout} onChange={(event) => updateStyle('pageLayout', event.target.value)}>
              <option value="grid">Grid</option>
              <option value="sidebar">Sidebar</option>
              <option value="stacked">Stacked</option>
            </select>
          </Field>
        </section>
      </aside>

      <section className="preview-stage">
        <header className="stage-toolbar">
          <div>
            <h1>{design.name}</h1>
            <span>{design.mode === 'card' ? 'Card Builder' : 'Page Layout Generator'}</span>
          </div>
          <div className="toolbar-actions">
            <AppButton active={previewSize === 'desktop'} onClick={() => setPreviewSize('desktop')} title="Desktop preview">
              <Monitor size={18} />
            </AppButton>
            <AppButton active={previewSize === 'tablet'} onClick={() => setPreviewSize('tablet')} title="Tablet preview">
              <Tablet size={18} />
            </AppButton>
            <AppButton active={previewSize === 'mobile'} onClick={() => setPreviewSize('mobile')} title="Mobile preview">
              <Smartphone size={18} />
            </AppButton>
            <AppButton onClick={saveDesign} title="Save design">
              <Save size={18} />
            </AppButton>
          </div>
        </header>

        <div className="preview-wrap">
          <div className="preview-viewport" style={{ maxWidth: previewWidths[previewSize] }}>
            {design.mode === 'card' ? <CardPreview design={design} /> : <PagePreview design={design} />}
          </div>
        </div>
      </section>

      <aside className="workspace-panel export-panel">
        <div className="export-header">
          <div>
            <h2>Export</h2>
            <span>{frameworks.find((item) => item.id === design.framework)?.label}</span>
          </div>
          <PanelRight size={20} />
        </div>

        <div className="framework-grid">
          {frameworks.map((framework) => (
            <button
              className={design.framework === framework.id ? 'active' : ''}
              key={framework.id}
              onClick={() => updateDesign({ framework: framework.id })}
              type="button"
            >
              {framework.label}
            </button>
          ))}
        </div>

        <div className="code-actions">
          <button onClick={copyCode} type="button">
            <Clipboard size={16} /> Copy
          </button>
          <button onClick={downloadCode} type="button">
            <Download size={16} /> Download
          </button>
        </div>

        <pre className="code-block">
          <code>{exportedCode}</code>
        </pre>

        <section className="saved-section">
          <h2>Saved</h2>
          {saved.length === 0 ? (
            <p>No saved designs yet.</p>
          ) : (
            <div className="saved-list">
              {saved.map((item) => (
                <button key={item.id} onClick={() => setDesign(item)} type="button">
                  <Eye size={14} />
                  <span>{item.name}</span>
                </button>
              ))}
            </div>
          )}
        </section>
      </aside>
    </main>
  );
}

function CardPreview({ design }: { design: Design }) {
  const { content: c, style: s } = design;
  return (
    <article
      className={`preview-card layout-${s.cardLayout}`}
      style={
        {
          '--accent': s.accent,
          '--surface': s.surface,
          '--text': s.text,
          '--muted': s.muted,
          '--space': `${s.spacing}px`,
          '--radius': `${s.radius}px`,
          '--shadow': `0 ${Math.max(4, s.shadow)}px ${s.shadow * 2}px rgba(15, 23, 42, .14)`,
          '--scale': s.fontScale,
        } as CSSProperties
      }
    >
      {s.showImage && <img alt="" src={c.image} />}
      <div className="preview-card-body">
        <p className="meta">{c.meta}</p>
        <h2>{c.title}</h2>
        <p className="subtitle">{c.subtitle}</p>
        <p className="body-text">{c.body}</p>
        {s.showBadges && (
          <div className="badge-row">
            {c.badges.map((badge) => (
              <span key={badge}>{badge}</span>
            ))}
          </div>
        )}
        <ul>
          {c.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        {s.showActions && (
          <div className="action-row">
            <button type="button">{c.primaryAction}</button>
            <button className="secondary" type="button">
              {c.secondaryAction}
            </button>
          </div>
        )}
      </div>
    </article>
  );
}

function PagePreview({ design }: { design: Design }) {
  const { content: c, style: s } = design;
  return (
    <div
      className={`preview-page page-${s.pageLayout}`}
      style={
        {
          '--accent': s.accent,
          '--surface': s.surface,
          '--text': s.text,
          '--muted': s.muted,
          '--space': `${s.spacing}px`,
          '--radius': `${s.radius}px`,
          '--shadow': `0 ${Math.max(4, s.shadow)}px ${s.shadow * 2}px rgba(15, 23, 42, .12)`,
          '--scale': s.fontScale,
        } as CSSProperties
      }
    >
      <header>
        <p>{c.meta}</p>
        <h2>{c.title}</h2>
        <span>{c.body}</span>
      </header>
      <div className="page-grid">
        {c.items.map((item, index) => (
          <section key={item}>
            <Grid2X2 size={18} />
            <strong>0{index + 1}</strong>
            <h3>{item}</h3>
            <p>{c.subtitle} module for fast layout generation.</p>
          </section>
        ))}
      </div>
    </div>
  );
}
