import type { CanvasElement, CanvasProject, Framework } from './types';

const esc = (value: string) =>
  value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

const cssNumber = (value: number, unit = 'px') => `${Math.round(value)}${unit}`;

function projectNameWords(project: CanvasProject) {
  return project.name.match(/[A-Za-z0-9]+/g) ?? [];
}

export function exportComponentName(project: CanvasProject) {
  const name = projectNameWords(project)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
  if (!name) return 'UiGuruCanvas';
  return /^[A-Za-z]/.test(name) ? name : `UiGuru${name}`;
}

export function exportFileStem(project: CanvasProject) {
  const stem = projectNameWords(project)
    .map((word) => word.toLowerCase())
    .join('-');
  return stem || 'uiguru-canvas';
}

function elementStyle(element: CanvasElement, absolute = true) {
  const { frame, style } = element;
  const position = absolute
    ? `position:absolute;left:${cssNumber(frame.x)};top:${cssNumber(frame.y)};width:${cssNumber(frame.width)};min-height:${cssNumber(frame.height)};`
    : '';
  return `${position}background:${style.background};color:${style.color};border:1px solid ${style.borderColor};border-radius:${cssNumber(style.radius)};padding:${cssNumber(style.padding)};box-shadow:0 ${Math.max(0, style.shadow)}px ${style.shadow * 2}px rgba(15,23,42,.12);font-family:${style.fontFamily},system-ui,sans-serif;font-size:${cssNumber(style.fontSize)};font-weight:${style.fontWeight};text-align:${style.textAlign};opacity:${style.opacity / 100};box-sizing:border-box;overflow:hidden;`;
}

function htmlForElement(element: CanvasElement) {
  const c = element.content;
  if (element.kind === 'heading') {
    return `<h2 class="uiguru-el uiguru-heading" style="${elementStyle(element)}">${esc(c.title)}</h2>`;
  }
  if (element.kind === 'text') {
    return `<p class="uiguru-el uiguru-text" style="${elementStyle(element)}">${esc(c.body)}</p>`;
  }
  if (element.kind === 'image') {
    return `<img class="uiguru-el uiguru-image" style="${elementStyle(element)}object-fit:cover;padding:0;" src="${esc(c.imageUrl)}" alt="${esc(c.altText)}" />`;
  }
  if (element.kind === 'button') {
    return `<button class="uiguru-el uiguru-button" style="${elementStyle(element)}">${esc(c.actionLabel)}</button>`;
  }
  if (element.kind === 'badge-list') {
    return `<div class="uiguru-el uiguru-badges" style="${elementStyle(element)}">${c.items
      .map((item) => `<span style="display:inline-block;margin:4px;padding:6px 9px;border-radius:999px;background:${element.style.accent}1f;color:${element.style.accent};font-weight:700;">${esc(item)}</span>`)
      .join('')}</div>`;
  }
  if (element.kind === 'section') {
    return `<section class="uiguru-el uiguru-section" style="${elementStyle(element)}"><h2>${esc(c.title)}</h2><p>${esc(c.body)}</p></section>`;
  }
  return `<article class="uiguru-el uiguru-card" style="${elementStyle(element)}">
  <img src="${esc(c.imageUrl)}" alt="${esc(c.altText)}" style="width:100%;height:42%;object-fit:cover;border-radius:${cssNumber(Math.max(0, element.style.radius - 2))};margin-bottom:12px;" />
  <small style="color:${element.style.accent};font-weight:800;text-transform:uppercase;">${esc(c.subtitle)}</small>
  <h2 style="margin:8px 0 6px;font-size:1.35em;">${esc(c.title)}</h2>
  <p style="line-height:1.5;">${esc(c.body)}</p>
  <div>${c.items.map((item) => `<span style="display:inline-block;margin:4px 5px 4px 0;padding:5px 8px;border-radius:999px;background:${element.style.accent}1f;color:${element.style.accent};font-size:.78em;font-weight:800;">${esc(item)}</span>`).join('')}</div>
  <button style="margin-top:12px;border:0;border-radius:6px;background:${element.style.accent};color:white;padding:10px 12px;font-weight:800;">${esc(c.actionLabel)}</button>
</article>`;
}

function htmlCanvas(project: CanvasProject) {
  return `<main class="uiguru-canvas" style="position:relative;width:${project.canvas.width}px;min-height:${project.canvas.height}px;background:${project.canvas.background};overflow:hidden;">
${project.elements.map(htmlForElement).join('\n')}
</main>`;
}

function htmlCss(project: CanvasProject) {
  return `${htmlCanvas(project)}

<style>
.uiguru-canvas{font-family:Inter,system-ui,sans-serif}
.uiguru-el{box-sizing:border-box}
.uiguru-image{display:block}
.uiguru-button{cursor:pointer}
</style>`;
}

function react(project: CanvasProject) {
  return `export function ${exportComponentName(project)}() {
  return (
    ${htmlCanvas(project).replaceAll('class=', 'className=').replaceAll('style="', 'style={{"').replaceAll(';"', '"}}')}
  );
}`;
}

function vue(project: CanvasProject) {
  return `<template>
  ${htmlCanvas(project)}
</template>`;
}

function angular(project: CanvasProject) {
  return `import { Component } from '@angular/core';

@Component({
  selector: 'app-${exportFileStem(project)}',
  standalone: true,
  template: \`
${htmlCanvas(project)}
  \`
})
export class ${exportComponentName(project)}Component {}`;
}

function bootstrap(project: CanvasProject) {
  return `<main class="container-fluid position-relative p-4" style="min-height:${project.canvas.height}px;background:${project.canvas.background};">
${project.elements
  .map((element) => `<section class="card shadow-sm position-absolute" style="left:${element.frame.x}px;top:${element.frame.y}px;width:${element.frame.width}px;min-height:${element.frame.height}px;"><div class="card-body">${htmlForElement(element)}</div></section>`)
  .join('\n')}
</main>`;
}

function tailwind(project: CanvasProject) {
  return `<main class="relative overflow-hidden" style="width:${project.canvas.width}px;min-height:${project.canvas.height}px;background:${project.canvas.background};">
${project.elements.map(htmlForElement).join('\n')}
</main>`;
}

function javafx(project: CanvasProject) {
  const lines = project.elements
    .map((element, index) => {
      const variable = `node${index}`;
      const label = element.kind === 'button' ? `Button ${variable} = new Button("${esc(element.content.actionLabel)}");` : `Label ${variable} = new Label("${esc(element.content.title || element.content.body || element.name)}");`;
      return `${label}
    ${variable}.setLayoutX(${element.frame.x});
    ${variable}.setLayoutY(${element.frame.y});
    ${variable}.setPrefSize(${element.frame.width}, ${element.frame.height});
    ${variable}.setStyle("-fx-background-color: ${element.style.background}; -fx-text-fill: ${element.style.color}; -fx-border-color: ${element.style.borderColor}; -fx-background-radius: ${element.style.radius}; -fx-border-radius: ${element.style.radius}; -fx-padding: ${element.style.padding};");
    root.getChildren().add(${variable});`;
    })
    .join('\n    ');

  return `import javafx.application.Application;
import javafx.scene.Scene;
import javafx.scene.control.*;
import javafx.scene.layout.Pane;
import javafx.stage.Stage;

public class ${exportComponentName(project)} extends Application {
  @Override public void start(Stage stage) {
    Pane root = new Pane();
    root.setStyle("-fx-background-color: ${project.canvas.background};");
    ${lines}
    stage.setScene(new Scene(root, ${project.canvas.width}, ${project.canvas.height}));
    stage.show();
  }
}`;
}

export function exportProject(project: CanvasProject, framework: Framework) {
  const exporters: Record<Framework, (project: CanvasProject) => string> = {
    react,
    vue,
    angular,
    javafx,
    bootstrap,
    tailwind,
    'html-css': htmlCss,
  };
  return exporters[framework](project);
}
