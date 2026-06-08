import type { Design, Framework } from './types';

const esc = (value: string) =>
  value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

const cssVars = (design: Design) => {
  const s = design.style;
  return `--accent:${s.accent};--surface:${s.surface};--text:${s.text};--muted:${s.muted};--space:${s.spacing}px;--radius:${s.radius}px;--shadow:0 ${Math.max(4, s.shadow)}px ${s.shadow * 2}px rgba(15,23,42,.14);--scale:${s.fontScale};`;
};

const plainHtml = (design: Design, className = 'uiguru-card') => {
  const c = design.content;
  const s = design.style;
  const badges = s.showBadges ? c.badges.map((badge) => `<span>${esc(badge)}</span>`).join('') : '';
  const actions = s.showActions
    ? `<div class="actions"><button>${esc(c.primaryAction)}</button><button class="secondary">${esc(c.secondaryAction)}</button></div>`
    : '';
  const image = s.showImage ? `<img src="${esc(c.image)}" alt="" />` : '';
  const items = c.items.map((item) => `<li>${esc(item)}</li>`).join('');
  return `<article class="${className}" style="${cssVars(design)}">
  ${image}
  <div class="body">
    <p class="meta">${esc(c.meta)}</p>
    <h2>${esc(c.title)}</h2>
    <p class="subtitle">${esc(c.subtitle)}</p>
    <p>${esc(c.body)}</p>
    <div class="badges">${badges}</div>
    <ul>${items}</ul>
    ${actions}
  </div>
</article>`;
};

const pageHtml = (design: Design) => {
  const c = design.content;
  const cards = c.items
    .map(
      (item, index) => `<section class="uiguru-mini">
  <span>0${index + 1}</span>
  <h3>${esc(item)}</h3>
  <p>${esc(c.subtitle)} module for ${esc(c.title).toLowerCase()}.</p>
</section>`,
    )
    .join('\n');
  return `<main class="uiguru-page" style="${cssVars(design)}">
  <header>
    <p>${esc(c.meta)}</p>
    <h1>${esc(c.title)}</h1>
    <span>${esc(c.body)}</span>
  </header>
  <div class="uiguru-grid">
${cards}
  </div>
</main>`;
};

const css = `.uiguru-card{display:flex;flex-direction:column;gap:var(--space);max-width:420px;background:var(--surface);color:var(--text);border:1px solid #e2e8f0;border-radius:var(--radius);box-shadow:var(--shadow);overflow:hidden;font-family:Inter,system-ui,sans-serif}.uiguru-card img{width:100%;height:180px;object-fit:cover}.uiguru-card .body{padding:var(--space)}.uiguru-card h2{font-size:calc(1.35rem * var(--scale));margin:.1rem 0}.uiguru-card p{color:var(--muted);line-height:1.5}.uiguru-card .meta{font-size:.78rem;text-transform:uppercase;letter-spacing:0;color:var(--accent);font-weight:700}.uiguru-card .badges{display:flex;flex-wrap:wrap;gap:8px}.uiguru-card .badges span{background:color-mix(in srgb,var(--accent) 12%,white);color:var(--accent);border-radius:999px;padding:4px 8px;font-size:.78rem}.uiguru-card ul{padding-left:1.1rem;color:var(--text)}.uiguru-card .actions{display:flex;gap:10px;flex-wrap:wrap}.uiguru-card button{border:0;border-radius:6px;padding:10px 12px;background:var(--accent);color:#fff;font-weight:700}.uiguru-card button.secondary{background:#eef2f7;color:var(--text)}.uiguru-page{font-family:Inter,system-ui,sans-serif;color:var(--text);background:#f8fafc;padding:var(--space);border-radius:var(--radius)}.uiguru-page header{max-width:760px;margin-bottom:var(--space)}.uiguru-page header p{color:var(--accent);font-weight:700;text-transform:uppercase}.uiguru-page h1{font-size:calc(2rem * var(--scale));margin:.2rem 0}.uiguru-page header span{color:var(--muted)}.uiguru-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:var(--space)}.uiguru-mini{background:var(--surface);border:1px solid #e2e8f0;border-radius:var(--radius);box-shadow:var(--shadow);padding:var(--space)}.uiguru-mini span{color:var(--accent);font-weight:800}.uiguru-mini p{color:var(--muted)}`;

function htmlCss(design: Design) {
  const body = design.mode === 'card' ? plainHtml(design) : pageHtml(design);
  return `${body}\n\n<style>\n${css}\n</style>`;
}

function react(design: Design) {
  return `export function UiGuru${design.mode === 'card' ? 'Card' : 'Page'}() {
  return (
    <>
      ${design.mode === 'card' ? plainHtml(design, 'uiguru-card').replaceAll('class=', 'className=') : pageHtml(design).replaceAll('class=', 'className=')}
      <style>{\`${css}\`}</style>
    </>
  );
}`;
}

function vue(design: Design) {
  return `<template>
  ${design.mode === 'card' ? plainHtml(design) : pageHtml(design)}
</template>

<style scoped>
${css}
</style>`;
}

function angular(design: Design) {
  return `import { Component } from '@angular/core';

@Component({
  selector: 'app-uiguru-${design.mode}',
  standalone: true,
  template: \`
${design.mode === 'card' ? plainHtml(design) : pageHtml(design)}
  \`,
  styles: [\`${css}\`]
})
export class UiGuru${design.mode === 'card' ? 'Card' : 'Page'}Component {}`;
}

function bootstrap(design: Design) {
  const c = design.content;
  const items = c.items.map((item) => `<li class="list-group-item">${esc(item)}</li>`).join('\n    ');
  return design.mode === 'card'
    ? `<div class="card shadow-sm" style="max-width: 26rem;">
  ${design.style.showImage ? `<img src="${esc(c.image)}" class="card-img-top" alt="">` : ''}
  <div class="card-body">
    <div class="text-primary fw-bold small text-uppercase">${esc(c.meta)}</div>
    <h5 class="card-title">${esc(c.title)}</h5>
    <p class="card-subtitle mb-2 text-body-secondary">${esc(c.subtitle)}</p>
    <p class="card-text">${esc(c.body)}</p>
    <ul class="list-group list-group-flush mb-3">
    ${items}
    </ul>
    <a href="#" class="btn btn-primary">${esc(c.primaryAction)}</a>
    <a href="#" class="btn btn-outline-secondary">${esc(c.secondaryAction)}</a>
  </div>
</div>`
    : `<main class="container py-4">
  <div class="mb-4">
    <p class="text-primary fw-bold text-uppercase">${esc(c.meta)}</p>
    <h1>${esc(c.title)}</h1>
    <p class="text-body-secondary">${esc(c.body)}</p>
  </div>
  <div class="row g-3">
    ${c.items.map((item) => `<section class="col-md-3"><div class="card h-100 shadow-sm"><div class="card-body"><h5>${esc(item)}</h5><p>${esc(c.subtitle)}</p></div></div></section>`).join('\n    ')}
  </div>
</main>`;
}

function tailwind(design: Design) {
  const c = design.content;
  const image = design.style.showImage ? `<img class="h-44 w-full object-cover" src="${esc(c.image)}" alt="" />` : '';
  const badges = design.style.showBadges ? c.badges.map((badge) => `<span class="rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">${esc(badge)}</span>`).join('') : '';
  return design.mode === 'card'
    ? `<article class="max-w-md overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
  ${image}
  <div class="space-y-4 p-5">
    <p class="text-xs font-bold uppercase text-blue-700">${esc(c.meta)}</p>
    <div>
      <h2 class="text-2xl font-bold text-slate-900">${esc(c.title)}</h2>
      <p class="text-sm text-slate-500">${esc(c.subtitle)}</p>
    </div>
    <p class="text-slate-600">${esc(c.body)}</p>
    <div class="flex flex-wrap gap-2">${badges}</div>
    <div class="flex flex-wrap gap-2">
      <button class="rounded-md bg-blue-600 px-4 py-2 font-semibold text-white">${esc(c.primaryAction)}</button>
      <button class="rounded-md bg-slate-100 px-4 py-2 font-semibold text-slate-800">${esc(c.secondaryAction)}</button>
    </div>
  </div>
</article>`
    : `<main class="bg-slate-50 p-6">
  <header class="mb-6 max-w-3xl">
    <p class="text-xs font-bold uppercase text-blue-700">${esc(c.meta)}</p>
    <h1 class="text-4xl font-bold text-slate-950">${esc(c.title)}</h1>
    <p class="mt-2 text-slate-600">${esc(c.body)}</p>
  </header>
  <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
    ${c.items.map((item, i) => `<section class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"><span class="font-bold text-blue-700">0${i + 1}</span><h3 class="mt-2 font-bold">${esc(item)}</h3><p class="text-sm text-slate-500">${esc(c.subtitle)}</p></section>`).join('\n    ')}
  </div>
</main>`;
}

function javafx(design: Design) {
  const c = design.content;
  const title = design.mode === 'card' ? 'UiGuruCard' : 'UiGuruPage';
  return `import javafx.application.Application;
import javafx.geometry.Insets;
import javafx.scene.Scene;
import javafx.scene.control.*;
import javafx.scene.layout.*;
import javafx.stage.Stage;

public class ${title} extends Application {
  @Override public void start(Stage stage) {
    VBox root = new VBox(14);
    root.setPadding(new Insets(${design.style.spacing}));
    root.setStyle("-fx-background-color: ${design.style.surface}; -fx-border-color: #e2e8f0; -fx-border-radius: ${design.style.radius}; -fx-background-radius: ${design.style.radius};");
    Label meta = new Label("${c.meta}");
    meta.setStyle("-fx-text-fill: ${design.style.accent}; -fx-font-weight: bold;");
    Label heading = new Label("${c.title}");
    heading.setStyle("-fx-font-size: ${Math.round(22 * design.style.fontScale)}px; -fx-font-weight: bold; -fx-text-fill: ${design.style.text};");
    Label body = new Label("${c.body}");
    body.setWrapText(true);
    body.setStyle("-fx-text-fill: ${design.style.muted};");
    Button primary = new Button("${c.primaryAction}");
    Button secondary = new Button("${c.secondaryAction}");
    HBox actions = new HBox(8, primary, secondary);
    root.getChildren().addAll(meta, heading, body, actions);
    stage.setScene(new Scene(root, 420, 360));
    stage.show();
  }
}`;
}

export function exportDesign(design: Design, framework: Framework) {
  const exporters: Record<Framework, (design: Design) => string> = {
    react,
    vue,
    angular,
    javafx,
    bootstrap,
    tailwind,
    'html-css': htmlCss,
  };
  return exporters[framework](design);
}
