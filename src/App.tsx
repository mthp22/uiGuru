import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { Clipboard, Copy, Download, Eye, Layers, Lock, Monitor, MousePointer2, RotateCcw, Save, Smartphone, Tablet, Trash2, Unlock } from 'lucide-react';
import {
  bringElementForward,
  duplicateElement,
  normalizeProject,
  removeElement,
  resetElementSize,
  sendElementBackward,
  toggleElementLock,
  updateElement,
} from './canvasCommands';
import { CanvasBlock, ContextMenu, type ContextMenuAction } from './CanvasElements';
import { iconByKind } from './canvasIcons';
import { createElement, createEmptyProject, createPresetProject, elementPalette, frameworks, presetProjects } from './data';
import { exportProject } from './exporters';
import { marqueeStyle, useCanvasInteractions } from './useCanvasInteractions';
import type { CanvasElement, CanvasProject, ElementKind, PreviewSize } from './types';

const storageKey = 'uiguru:canvas-projects';
const dragMime = 'application/uiguru-element-kind';

const previewScales: Record<PreviewSize, number> = {
  desktop: 0.78,
  tablet: 0.58,
  mobile: 0.34,
};

function readProjects(): CanvasProject[] {
  try {
    const stored = localStorage.getItem(storageKey);
    return stored ? (JSON.parse(stored) as CanvasProject[]).map(normalizeProject) : [];
  } catch {
    return [];
  }
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function ToolButton({
  children,
  label,
  active,
  onClick,
}: {
  children: ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button className={`tool-button ${active ? 'active' : ''}`} onClick={onClick} title={label} type="button">
      {children}
    </button>
  );
}

export function App() {
  const [project, setProject] = useState<CanvasProject>(createEmptyProject);
  const [savedProjects, setSavedProjects] = useState<CanvasProject[]>(readProjects);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [previewSize, setPreviewSize] = useState<PreviewSize>('desktop');
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const exportedCode = useMemo(() => exportProject(project, project.framework), [project]);
  const selected = project.elements.find((element) => element.id === selectedId) ?? null;
  const previewScale = previewScales[previewSize];
  const interactions = useCanvasInteractions({
    canvasRef,
    project,
    scale: previewScale,
    selectedId,
    setProject,
    setSelectedId,
  });

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(savedProjects));
  }, [savedProjects]);

  const commit = (recipe: (current: CanvasProject) => CanvasProject) => {
    setProject((current) => ({ ...recipe(current), updatedAt: new Date().toISOString() }));
  };

  const updateProject = (patch: Partial<CanvasProject>) => {
    commit((current) => ({ ...current, ...patch }));
  };

  const updateSelected = (recipe: (element: CanvasElement) => CanvasElement) => {
    if (!selectedId) return;
    setProject((current) => updateElement(current, selectedId, recipe));
  };

  const addElement = (kind: ElementKind, position?: { x: number; y: number }) => {
    const element = createElement(kind, position);
    commit((current) => ({ ...current, elements: [...current.elements, element] }));
    setSelectedId(element.id);
  };

  const dropElement = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const kind = event.dataTransfer.getData(dragMime) as ElementKind;
    if (!kind || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const scale = previewScales[previewSize];
    addElement(kind, {
      x: Math.max(0, Math.round((event.clientX - rect.left) / scale)),
      y: Math.max(0, Math.round((event.clientY - rect.top) / scale)),
    });
  };

  const saveProject = () => {
    setSavedProjects((current) => {
      const next = { ...project, updatedAt: new Date().toISOString() };
      return [next, ...current.filter((item) => item.id !== project.id)].slice(0, 12);
    });
  };

  const copyCode = async () => {
    await navigator.clipboard.writeText(exportedCode);
  };

  const downloadCode = () => {
    const extension = project.framework === 'javafx' ? 'java' : project.framework === 'html-css' ? 'html' : 'txt';
    const blob = new Blob([exportedCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `uiguru-canvas-${project.framework}.${extension}`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const duplicateSelected = () => {
    if (!selectedId) return;
    setProject((current) => {
      const result = duplicateElement(current, selectedId);
      if (result.duplicatedId) setSelectedId(result.duplicatedId);
      return result.project;
    });
  };

  const removeSelected = () => {
    if (!selectedId) return;
    setProject((current) => removeElement(current, selectedId));
    setSelectedId(null);
    interactions.closeContextMenu();
  };

  const resetSelectedSize = () => {
    if (!selectedId) return;
    setProject((current) => resetElementSize(current, selectedId));
  };

  const runContextAction = (action: ContextMenuAction) => {
    const elementId = interactions.contextMenu?.elementId;
    if (!elementId) return;
    if (action === 'remove') {
      setProject((current) => removeElement(current, elementId));
      setSelectedId(null);
    }
    if (action === 'duplicate') {
      setProject((current) => {
        const result = duplicateElement(current, elementId);
        if (result.duplicatedId) setSelectedId(result.duplicatedId);
        return result.project;
      });
    }
    if (action === 'reset-size') setProject((current) => resetElementSize(current, elementId));
    if (action === 'toggle-lock') setProject((current) => toggleElementLock(current, elementId));
    if (action === 'bring-forward') setProject((current) => bringElementForward(current, elementId));
    if (action === 'send-backward') setProject((current) => sendElementBackward(current, elementId));
    interactions.closeContextMenu();
  };

  return (
    <main className="app-shell">
      <aside className="workspace-panel palette-panel">
        <div className="brand-row">
          <div>
            <strong>uiGuru</strong>
            <span>Drag blocks onto the canvas</span>
          </div>
        </div>

        <section>
          <h2>Canvas</h2>
          <Field label="Project name">
            <input value={project.name} onChange={(event) => updateProject({ name: event.target.value })} />
          </Field>
          <div className="split-fields">
            <Field label="Width">
              <input min="320" type="number" value={project.canvas.width} onChange={(event) => updateProject({ canvas: { ...project.canvas, width: Number(event.target.value) } })} />
            </Field>
            <Field label="Height">
              <input min="320" type="number" value={project.canvas.height} onChange={(event) => updateProject({ canvas: { ...project.canvas, height: Number(event.target.value) } })} />
            </Field>
          </div>
          <Field label="Background">
            <input type="color" value={project.canvas.background} onChange={(event) => updateProject({ canvas: { ...project.canvas, background: event.target.value } })} />
          </Field>
          <button className="wide-action" onClick={() => { setProject(createEmptyProject()); setSelectedId(null); }} type="button">
            Empty playground
          </button>
        </section>

        <section>
          <h2>Blocks</h2>
          <div className="palette-list">
            {elementPalette.map((item) => (
              <button
                draggable
                key={item.kind}
                onClick={() => addElement(item.kind)}
                onDragStart={(event) => event.dataTransfer.setData(dragMime, item.kind)}
                type="button"
              >
                {iconByKind[item.kind]}
                <span>
                  <strong>{item.label}</strong>
                  <small>{item.description}</small>
                </span>
              </button>
            ))}
          </div>
        </section>

        <section>
          <h2>Presets</h2>
          <div className="preset-list">
            {presetProjects.map((preset) => (
              <button
                key={preset.id}
                onClick={() => {
                  const next = createPresetProject(preset.id);
                  setProject(next);
                  setSelectedId(next.elements[0]?.id ?? null);
                }}
                type="button"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </section>

        <section>
          <h2>Layers</h2>
          <div className="layer-list">
            {project.elements.length === 0 ? <p>No layers yet.</p> : null}
            {project.elements.map((element) => (
              <button className={selectedId === element.id ? 'active' : ''} key={element.id} onClick={() => setSelectedId(element.id)} type="button">
                {iconByKind[element.kind]}
                <span>{element.name}</span>
              </button>
            ))}
          </div>
        </section>
      </aside>

      <section className="canvas-stage">
        <header className="stage-toolbar">
          <div>
            <h1>{project.name}</h1>
            <span>{project.elements.length === 0 ? 'Empty playground' : `${project.elements.length} configurable blocks`}</span>
          </div>
          <div className="toolbar-actions">
            <ToolButton active={previewSize === 'desktop'} label="Desktop preview" onClick={() => setPreviewSize('desktop')}>
              <Monitor size={18} />
            </ToolButton>
            <ToolButton active={previewSize === 'tablet'} label="Tablet preview" onClick={() => setPreviewSize('tablet')}>
              <Tablet size={18} />
            </ToolButton>
            <ToolButton active={previewSize === 'mobile'} label="Mobile preview" onClick={() => setPreviewSize('mobile')}>
              <Smartphone size={18} />
            </ToolButton>
            <ToolButton label="Save project" onClick={saveProject}>
              <Save size={18} />
            </ToolButton>
            <ToolButton label="Duplicate" onClick={duplicateSelected}>
              <Copy size={18} />
            </ToolButton>
            <ToolButton label="Reset size" onClick={resetSelectedSize}>
              <RotateCcw size={18} />
            </ToolButton>
            <ToolButton label="Remove" onClick={removeSelected}>
              <Trash2 size={18} />
            </ToolButton>
          </div>
        </header>

        <div className="canvas-scroll">
          <div
            className="canvas-scale"
            style={{ width: project.canvas.width * previewScale, height: project.canvas.height * previewScale }}
          >
            <div
              className="design-canvas"
              onDragOver={(event) => event.preventDefault()}
              onDrop={dropElement}
              onClick={() => {
                setSelectedId(null);
                interactions.closeContextMenu();
              }}
              onContextMenu={(event) => event.preventDefault()}
              onPointerDown={interactions.startMarquee}
              ref={canvasRef}
              style={
                {
                  width: project.canvas.width,
                  height: project.canvas.height,
                  background: project.canvas.background,
                  transform: `scale(${previewScale})`,
                } as CSSProperties
              }
            >
              {project.elements.length === 0 ? (
                <div className="empty-canvas">
                  <Layers size={28} />
                  <strong>Start with a blank canvas</strong>
                  <span>Drag blocks from the left panel, then select them to edit content, images, fonts, spacing, and position.</span>
                </div>
              ) : null}
              {project.elements.map((element) => (
                <CanvasBlock
                  element={element}
                  key={element.id}
                  onContextMenu={(event) => interactions.openContextMenu(element.id, event)}
                  onPointerDown={(event) => interactions.startMove(element.id, event)}
                  onResizeStart={(handle, event) => interactions.startResize(element.id, handle, event)}
                  selected={selectedId === element.id}
                />
              ))}
              {interactions.marquee ? <div className="selection-marquee" style={marqueeStyle(interactions.marquee)} /> : null}
            </div>
          </div>
        </div>
      </section>

      <aside className="workspace-panel inspector-panel">
        {selected ? (
          <Inspector element={selected} updateSelected={updateSelected} />
        ) : (
          <div className="empty-inspector">
            <MousePointer2 size={24} />
            <h2>Select a block</h2>
            <p>Use the inspector to configure content, images, heading sizes, fonts, colors, spacing, and placement.</p>
          </div>
        )}

        <section>
          <h2>Export</h2>
          <div className="framework-grid">
            {frameworks.map((framework) => (
              <button
                className={project.framework === framework.id ? 'active' : ''}
                key={framework.id}
                onClick={() => updateProject({ framework: framework.id })}
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
        </section>

        <section>
          <h2>Saved</h2>
          <div className="saved-list">
            {savedProjects.length === 0 ? <p>No saved projects yet.</p> : null}
            {savedProjects.map((item) => (
              <button key={item.id} onClick={() => { const next = normalizeProject(item); setProject(next); setSelectedId(next.elements[0]?.id ?? null); }} type="button">
                <Eye size={14} />
                <span>{item.name}</span>
              </button>
            ))}
          </div>
        </section>
      </aside>
      {interactions.contextMenu ? (
        <ContextMenu
          locked={project.elements.find((element) => element.id === interactions.contextMenu?.elementId)?.locked ?? false}
          onAction={runContextAction}
          position={interactions.contextMenu}
        />
      ) : null}
    </main>
  );
}


function Inspector({
  element,
  updateSelected,
}: {
  element: CanvasElement;
  updateSelected: (recipe: (element: CanvasElement) => CanvasElement) => void;
}) {
  const updateFrame = (key: keyof CanvasElement['frame'], value: number) => {
    updateSelected((current) => ({ ...current, frame: { ...current.frame, [key]: value } }));
  };
  const updateStyle = (key: keyof CanvasElement['style'], value: string | number) => {
    updateSelected((current) => ({ ...current, style: { ...current.style, [key]: value } }));
  };
  const updateContent = (key: keyof CanvasElement['content'], value: string | string[]) => {
    updateSelected((current) => ({ ...current, content: { ...current.content, [key]: value } }));
  };

  return (
    <section className="inspector">
      <div className="inspector-title">
        <div>
          <h2>{element.name}</h2>
          <span>{element.kind}</span>
        </div>
        <button onClick={() => updateSelected((current) => ({ ...current, locked: !current.locked }))} type="button">
          {element.locked ? <Lock size={16} /> : <Unlock size={16} />}
        </button>
      </div>

      <Field label="Layer name">
        <input value={element.name} onChange={(event) => updateSelected((current) => ({ ...current, name: event.target.value }))} />
      </Field>

      <div className="split-fields">
        <Field label="X">
          <input type="number" value={element.frame.x} onChange={(event) => updateFrame('x', Number(event.target.value))} />
        </Field>
        <Field label="Y">
          <input type="number" value={element.frame.y} onChange={(event) => updateFrame('y', Number(event.target.value))} />
        </Field>
        <Field label="W">
          <input min="24" type="number" value={element.frame.width} onChange={(event) => updateFrame('width', Number(event.target.value))} />
        </Field>
        <Field label="H">
          <input min="24" type="number" value={element.frame.height} onChange={(event) => updateFrame('height', Number(event.target.value))} />
        </Field>
      </div>

      {['heading', 'card', 'section'].includes(element.kind) ? (
        <Field label="Title">
          <input value={element.content.title} onChange={(event) => updateContent('title', event.target.value)} />
        </Field>
      ) : null}
      {element.kind === 'card' ? (
        <Field label="Subtitle">
          <input value={element.content.subtitle} onChange={(event) => updateContent('subtitle', event.target.value)} />
        </Field>
      ) : null}
      {['text', 'card', 'section'].includes(element.kind) ? (
        <Field label="Body">
          <textarea rows={4} value={element.content.body} onChange={(event) => updateContent('body', event.target.value)} />
        </Field>
      ) : null}
      {['image', 'card'].includes(element.kind) ? (
        <>
          <Field label="Image URL">
            <input value={element.content.imageUrl} onChange={(event) => updateContent('imageUrl', event.target.value)} />
          </Field>
          <Field label="Alt text">
            <input value={element.content.altText} onChange={(event) => updateContent('altText', event.target.value)} />
          </Field>
        </>
      ) : null}
      {['button', 'card'].includes(element.kind) ? (
        <Field label="Button label">
          <input value={element.content.actionLabel} onChange={(event) => updateContent('actionLabel', event.target.value)} />
        </Field>
      ) : null}
      {['badge-list', 'card'].includes(element.kind) ? (
        <Field label="Items">
          <textarea rows={3} value={element.content.items.join('\n')} onChange={(event) => updateContent('items', event.target.value.split('\n').filter(Boolean))} />
        </Field>
      ) : null}

      <div className="split-fields">
        <Field label="Text">
          <input type="color" value={element.style.color} onChange={(event) => updateStyle('color', event.target.value)} />
        </Field>
        <Field label="Fill">
          <input type="color" value={element.style.background === 'transparent' ? '#ffffff' : element.style.background} onChange={(event) => updateStyle('background', event.target.value)} />
        </Field>
        <Field label="Accent">
          <input type="color" value={element.style.accent} onChange={(event) => updateStyle('accent', event.target.value)} />
        </Field>
      </div>

      <Field label="Font family">
        <select value={element.style.fontFamily} onChange={(event) => updateStyle('fontFamily', event.target.value)}>
          <option value="Inter">Inter</option>
          <option value="Georgia">Georgia</option>
          <option value="Arial">Arial</option>
          <option value="Courier New">Courier New</option>
          <option value="Trebuchet MS">Trebuchet MS</option>
        </select>
      </Field>
      <Field label={`Heading/text size ${element.style.fontSize}px`}>
        <input min="10" max="72" type="range" value={element.style.fontSize} onChange={(event) => updateStyle('fontSize', Number(event.target.value))} />
      </Field>
      <Field label={`Weight ${element.style.fontWeight}`}>
        <input min="300" max="900" step="100" type="range" value={element.style.fontWeight} onChange={(event) => updateStyle('fontWeight', Number(event.target.value))} />
      </Field>
      <Field label={`Padding ${element.style.padding}px`}>
        <input min="0" max="42" type="range" value={element.style.padding} onChange={(event) => updateStyle('padding', Number(event.target.value))} />
      </Field>
      <Field label={`Radius ${element.style.radius}px`}>
        <input min="0" max="32" type="range" value={element.style.radius} onChange={(event) => updateStyle('radius', Number(event.target.value))} />
      </Field>
      <Field label={`Shadow ${element.style.shadow}`}>
        <input min="0" max="28" type="range" value={element.style.shadow} onChange={(event) => updateStyle('shadow', Number(event.target.value))} />
      </Field>
      <Field label="Align">
        <select value={element.style.textAlign} onChange={(event) => updateStyle('textAlign', event.target.value)}>
          <option value="left">Left</option>
          <option value="center">Center</option>
          <option value="right">Right</option>
        </select>
      </Field>
    </section>
  );
}
