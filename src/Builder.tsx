import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type DragEvent as ReactDragEvent,
  type ReactNode,
} from 'react';
import {
  ArrowLeft,
  Check,
  Clipboard,
  Copy,
  Download,
  Eye,
  Layers,
  Monitor,
  Moon,
  MousePointer2,
  Redo2,
  RotateCcw,
  Save,
  Smartphone,
  Sun,
  Tablet,
  Trash2,
  Undo2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
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
import { CanvasBlock, ContextMenu, LayerTree, type ContextMenuAction } from './CanvasElements';
import { componentIcon, iconByKind } from './canvasIcons';
import {
  componentPalette,
  createElement,
  createComponentElements,
  createEmptyProject,
  createPresetProject,
  elementPalette,
  frameworks,
  presetProjects,
} from './data';
import { exportFileName, exportProject } from './exporters';
import { Field, Inspector } from './Inspector';
import { clamp } from './geometry';
import { marqueeStyle, useCanvasInteractions } from './useCanvasInteractions';
import { useHistory } from './useHistory';
import { useTheme } from './useTheme';
import type { CanvasElement, CanvasProject, ComponentId, ElementKind, PreviewSize, ReactFlavor} from './types';

const savedProjectsKey = 'uiguru:canvas-projects';
const currentProjectKey = 'uiguru:current-project';
const dragMime = 'application/uiguru-element-kind';

const previewWidth: Record<PreviewSize, number> = {
  desktop: 1200,
  tablet: 768,
  mobile: 390,
};

function readProjects(): CanvasProject[] {
  try {
    const stored = localStorage.getItem(savedProjectsKey);
    return stored ? (JSON.parse(stored) as CanvasProject[]).map(normalizeProject) : [];
  } catch {
    return [];
  }
}

function readCurrentProject(): CanvasProject | null {
  try {
    const stored = localStorage.getItem(currentProjectKey);
    return stored ? normalizeProject(JSON.parse(stored) as CanvasProject) : null;
  } catch {
    return null;
  }
}

function ToolButton({
  children,
  label,
  active,
  disabled,
  onClick,
}: {
  children: ReactNode;
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      aria-pressed={active === undefined ? undefined : active}
      className={`tool-button ${active ? 'active' : ''}`}
      disabled={disabled}
      onClick={onClick}
      title={label}
      type="button"
    >
      {children}
    </button>
  );
}

export function Builder({ onHome }: { onHome: () => void }) {
  const history = useHistory<CanvasProject>(() => readCurrentProject() ?? createEmptyProject());
  const { present: project, commit, stage, endStage, undo, redo, canUndo, canRedo } = history;
  const [savedProjects, setSavedProjects] = useState<CanvasProject[]>(readProjects);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [previewSize, setPreviewSize] = useState<PreviewSize>('desktop');
  const [zoom, setZoom] = useState(1);
  const [savedProject, setSavedProject] = useState<CanvasProject>(() => history.present);
  const [copied, setCopied] = useState(false);
  const [reactFlavor, setReactFlavor] = useState<ReactFlavor>('tsx');
  const { theme, toggleTheme } = useTheme();
  const isDarkTheme = theme === 'dark';
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const exportedCode = useMemo(
    () => exportProject(project, project.framework, reactFlavor),
    [project, reactFlavor],
  );
  const exportName = exportFileName(project, project.framework, reactFlavor);  const selected = project.elements.find((element) => element.id === selectedId) ?? null;
  const previewScale = Math.min(1, previewWidth[previewSize] / project.canvas.width) * zoom;

  function commitProject(recipe: (current: CanvasProject) => CanvasProject, groupKey?: string) {
    commit((current) => {
      const next = recipe(current);
      return next === current ? current : { ...next, updatedAt: new Date().toISOString() };
    }, groupKey);
  }

  const interactions = useCanvasInteractions({
    canvasRef,
    project,
    scale: previewScale,
    selectedId,
    setProject: stage,
    commitProject,
    endStage,
    undo,
    redo,
    setSelectedId,
  });

  const saveStatus: 'saving' | 'saved' = savedProject === project ? 'saved' : 'saving';

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(currentProjectKey, JSON.stringify(project));
      } catch {
        // Storage can be unavailable or full; the in-memory project still works.
      }
      setSavedProject(project);
    }, 400);
    return () => clearTimeout(timer);
  }, [project]);

  useEffect(() => {
    localStorage.setItem(savedProjectsKey, JSON.stringify(savedProjects));
  }, [savedProjects]);

  const updateProject = (patch: Partial<CanvasProject>, groupKey?: string) => {
    commitProject((current) => ({ ...current, ...patch }), groupKey);
  };

  const updateSelected = (recipe: (element: CanvasElement) => CanvasElement, groupKey?: string) => {
    if (!selectedId) return;
    commitProject((current) => updateElement(current, selectedId, recipe), groupKey && `${selectedId}:${groupKey}`);
  };

  const addElement = (kind: ElementKind, position?: { x: number; y: number }) => {
    const element = createElement(kind, position);
    commitProject((current) => ({ ...current, elements: [...current.elements, element] }));
    setSelectedId(element.id);
  };

  const addComponent = (id: ComponentId) => {
    const lowest = project.elements.reduce(
      (max, element) => Math.max(max, element.frame.y + element.frame.height),
      0,
    );
    const origin = { x: 48, y: lowest > 0 ? lowest + 40 : 48 };
    const elements = createComponentElements(id, origin);
    const bottom = elements.reduce((max, element) => Math.max(max, element.frame.y + element.frame.height), 0);
    commitProject((current) => ({
      ...current,
      elements: [...current.elements, ...elements],
      canvas: { ...current.canvas, height: Math.max(current.canvas.height, bottom + 48) },
    }));
    setSelectedId(elements[0]?.id ?? null);
  };

  const dropElement = (event: ReactDragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const kind = event.dataTransfer.getData(dragMime) as ElementKind;
    if (!kind || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    addElement(kind, {
      x: Math.max(0, Math.round((event.clientX - rect.left) / previewScale)),
      y: Math.max(0, Math.round((event.clientY - rect.top) / previewScale)),
    });
  };

  const saveProject = () => {
    setSavedProjects((current) => {
      const next = { ...project, updatedAt: new Date().toISOString() };
      return [next, ...current.filter((item) => item.id !== project.id)].slice(0, 12);
    });
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(exportedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      const field = document.createElement('textarea');
      field.value = exportedCode;
      field.style.position = 'fixed';
      field.style.opacity = '0';
      document.body.appendChild(field);
      field.select();
      const ok = document.execCommand('copy');
      field.remove();
      if (ok) {
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      }
    }
  };

  const downloadCode = () => {
    const mime =
      project.framework === 'html-css'
        ? 'text/html;charset=utf-8'
        : project.framework === 'javafx'
          ? 'text/x-java-source;charset=utf-8'
          : 'text/plain;charset=utf-8';
    const blob = new Blob([exportedCode], { type: mime });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = exportName;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const duplicateSelected = () => {
    if (!selectedId) return;
    const cloneId = crypto.randomUUID();
    commitProject((current) => duplicateElement(current, selectedId, cloneId));
    setSelectedId(cloneId);
  };

  const removeSelected = () => {
    if (!selectedId) return;
    commitProject((current) => removeElement(current, selectedId));
    setSelectedId(null);
    interactions.closeContextMenu();
  };

  const resetSelectedSize = () => {
    if (!selectedId) return;
    commitProject((current) => resetElementSize(current, selectedId), `size:${selectedId}`);
  };

  const changeZoom = (delta: number) => {
    setZoom((current) => clamp(Math.round((current + delta) * 10) / 10, 0.4, 2));
  };

  const runContextAction = (action: ContextMenuAction) => {
    const elementId = interactions.contextMenu?.elementId;
    if (!elementId) return;
    if (action === 'remove') {
      commitProject((current) => removeElement(current, elementId));
      setSelectedId(null);
    }
    if (action === 'duplicate') {
      const cloneId = crypto.randomUUID();
      commitProject((current) => duplicateElement(current, elementId, cloneId));
      setSelectedId(cloneId);
    }
    if (action === 'reset-size') commitProject((current) => resetElementSize(current, elementId));
    if (action === 'toggle-lock') commitProject((current) => toggleElementLock(current, elementId));
    if (action === 'bring-forward') commitProject((current) => bringElementForward(current, elementId));
    if (action === 'send-backward') commitProject((current) => sendElementBackward(current, elementId));
    interactions.closeContextMenu();
  };

  return (
    <main className="app-shell">
      <aside className="workspace-panel palette-panel">
        <div className="brand-row">
          <button aria-label="Back to landing page" className="brand-mark" onClick={onHome} title="Back to landing page" type="button">
            <ArrowLeft size={15} />
            uiGuru
          </button>
          <span>Build visually. Own the code.</span>
        </div>

        <section>
          <h2>Blocks</h2>
          <div className="palette-list">
            {elementPalette.map((item) => (
              <button
                draggable
                key={item.kind}
                onClick={() => addElement(item.kind)}
                onDragStart={(event) => event.dataTransfer.setData(dragMime, item.kind)}
                title={item.description}
                type="button"
              >
                {iconByKind[item.kind]}
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </section>

        <section>
          <h2>Components</h2>
          <div className="palette-list compact">
            {componentPalette.map((item) => (
              <button key={item.id} onClick={() => addComponent(item.id)} title={item.description} type="button">
                {componentIcon[item.id]}
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </section>

        <section>
          <h2>Layers</h2>
          {project.elements.length === 0 ? (
            <p className="panel-note">No layers yet.</p>
          ) : (
            <LayerTree elements={project.elements} selectedId={selectedId} onSelect={setSelectedId} />
          )}
        </section>

        <details className="panel-collapse">
          <summary>Templates</summary>
          <div className="preset-list">
            {presetProjects.map((preset) => (
              <button
                key={preset.id}
                onClick={() => {
                  const next = createPresetProject(preset.id);
                  commitProject(() => next);
                  setSelectedId(next.elements[0]?.id ?? null);
                }}
                type="button"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </details>

        <details className="panel-collapse">
          <summary>Canvas</summary>
          <Field label="Project name">
            <input
              value={project.name}
              onChange={(event) => updateProject({ name: event.target.value }, 'project-name')}
            />
          </Field>
          <div className="split-fields">
            <Field label="Width">
              <input
                min="320"
                type="number"
                value={project.canvas.width}
                onChange={(event) =>
                  commitProject(
                    (current) => ({ ...current, canvas: { ...current.canvas, width: Number(event.target.value) } }),
                    'canvas-width',
                  )
                }
              />
            </Field>
            <Field label="Height">
              <input
                min="320"
                type="number"
                value={project.canvas.height}
                onChange={(event) =>
                  commitProject(
                    (current) => ({ ...current, canvas: { ...current.canvas, height: Number(event.target.value) } }),
                    'canvas-height',
                  )
                }
              />
            </Field>
          </div>
          <Field label="Background">
            <input
              aria-label="Canvas background"
              type="color"
              value={project.canvas.background}
              onChange={(event) =>
                commitProject(
                  (current) => ({ ...current, canvas: { ...current.canvas, background: event.target.value } }),
                  'canvas-background',
                )
              }
            />
          </Field>
          <button
            className="wide-action"
            onClick={() => {
              commitProject(() => createEmptyProject());
              setSelectedId(null);
            }}
            type="button"
          >
            Empty playground
          </button>
        </details>
      </aside>

      <section className="canvas-stage">
        <header className="stage-toolbar">
          <div className="toolbar-heading">
            <h1>{project.name}</h1>
            <span>{project.elements.length === 0 ? 'Empty playground' : `${project.elements.length} configurable blocks`}</span>
          </div>
          <div className="toolbar-actions">
            <ToolButton disabled={!canUndo} label="Undo (Cmd/Ctrl + Z)" onClick={undo}>
              <Undo2 size={16} />
            </ToolButton>
            <ToolButton disabled={!canRedo} label="Redo (Cmd/Ctrl + Shift + Z)" onClick={redo}>
              <Redo2 size={16} />
            </ToolButton>
            <span className="toolbar-divider" aria-hidden="true" />
            <div className="toolbar-group" role="group" aria-label="Preview viewport">
              <ToolButton active={previewSize === 'desktop'} label="Desktop preview" onClick={() => setPreviewSize('desktop')}>
                <Monitor size={16} />
              </ToolButton>
              <ToolButton active={previewSize === 'tablet'} label="Tablet preview" onClick={() => setPreviewSize('tablet')}>
                <Tablet size={16} />
              </ToolButton>
              <ToolButton active={previewSize === 'mobile'} label="Mobile preview" onClick={() => setPreviewSize('mobile')}>
                <Smartphone size={16} />
              </ToolButton>
            </div>
            <span className="toolbar-divider" aria-hidden="true" />
            <div className="toolbar-group zoom-group" role="group" aria-label="Zoom">
              <ToolButton label="Zoom out" onClick={() => changeZoom(-0.1)}>
                <ZoomOut size={16} />
              </ToolButton>
              <span className="zoom-value">{Math.round(previewScale * 100)}%</span>
              <ToolButton label="Zoom in" onClick={() => changeZoom(0.1)}>
                <ZoomIn size={16} />
              </ToolButton>
            </div>
            {selected ? (
              <>
                <span className="toolbar-divider" aria-hidden="true" />
                <div className="toolbar-group" role="group" aria-label="Selected block">
                  <ToolButton label="Duplicate block (Cmd/Ctrl + D)" onClick={duplicateSelected}>
                    <Copy size={16} />
                  </ToolButton>
                  <ToolButton label="Reset size" onClick={resetSelectedSize}>
                    <RotateCcw size={16} />
                  </ToolButton>
                  <ToolButton label="Delete block (Delete / Backspace)" onClick={removeSelected}>
                    <Trash2 size={16} />
                  </ToolButton>
                </div>
              </>
            ) : null}
            <span className="toolbar-divider" aria-hidden="true" />
            <span className="toolbar-divider" aria-hidden="true" />
            <ToolButton
              label={isDarkTheme ? 'Switch to light theme' : 'Switch to dark theme'}
              onClick={toggleTheme}
            >
              {isDarkTheme ? <Sun size={16} /> : <Moon size={16} />}
            </ToolButton>
            <span className={`save-status ${saveStatus}`} role="status">
              {saveStatus === 'saved' ? (
                <>
                  <Check size={14} /> Saved
                </>
              ) : (
                'Saving…'
              )}
            </span>
            <ToolButton label="Save to project list" onClick={saveProject}>
              <Save size={16} />
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
                  <span>
                    Drag blocks from the left panel, or drop in a component. Select anything to edit it here.
                  </span>
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
              {interactions.guides.x.map((x) => (
                <div className="snap-guide snap-guide-x" key={`guide-x-${x}`} style={{ left: x }} />
              ))}
              {interactions.guides.y.map((y) => (
                <div className="snap-guide snap-guide-y" key={`guide-y-${y}`} style={{ top: y }} />
              ))}
            </div>
          </div>
        </div>
      </section>

      <aside className="workspace-panel inspector-panel">
        {selected ? (
          <Inspector element={selected} onDuplicate={duplicateSelected} onDelete={removeSelected} update={updateSelected} />
        ) : (
          <div className="empty-inspector">
            <MousePointer2 size={24} />
            <h2>Select a block</h2>
            <p>Click a block on the canvas or in the layers list to edit its content, type, color, spacing, and position.</p>
          </div>
        )}

        <section className="export-section">
          <div className="panel-heading">
            <h2>Export</h2>
            <span className="component-name" title="Exported file name">
              {exportName}
            </span>
          </div>
          <div className="framework-grid">
            {frameworks.map((framework) => (
              <button
                aria-pressed={project.framework === framework.id}
                className={project.framework === framework.id ? 'active' : ''}
                key={framework.id}
                onClick={() => updateProject({ framework: framework.id })}
                type="button"
              >
                {framework.label}
              </button>
            ))}
          </div>
          {project.framework === 'react' ? (
            <div className="framework-grid flavor-grid" role="group" aria-label="React file format">
              {(['jsx', 'tsx'] as const).map((flavor) => (
                <button
                  aria-pressed={reactFlavor === flavor}
                  className={reactFlavor === flavor ? 'active' : ''}
                  key={flavor}
                  onClick={() => setReactFlavor(flavor)}
                  type="button"
                >
                  .{flavor}
                </button>
              ))}
            </div>
          ) : null}
          <div className="code-actions">
            <button onClick={copyCode} type="button">
              {copied ? <Check size={16} /> : <Clipboard size={16} />} {copied ? 'Copied' : 'Copy'}
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
            {savedProjects.length === 0 ? <p className="panel-note">No saved projects yet.</p> : null}
            {savedProjects.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  const next = normalizeProject(item);
                  commitProject(() => next);
                  setSelectedId(next.elements[0]?.id ?? null);
                }}
                type="button"
              >
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
