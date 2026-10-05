import type { CanvasElement, CanvasProject, Framework, ReactFlavor } from './types';

type StyleDecl = Record<string, string>;

interface HtmlNode {
  tag: string;
  className?: string;
  style?: StyleDecl;
  attrs?: Record<string, string | number>;
  children: (HtmlNode | string)[];
}

const voidTags = new Set(['img', 'br', 'hr', 'input']);

const esc = (value: string) =>
  value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

const px = (value: number) => `${Math.round(value)}px`;

const hyphenate = (key: string) => key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);

const jsNumber = (value: string) => (/^-?\d+(\.\d+)?px$/.test(value) ? value.slice(0, -2) : null);

const jsxString = (value: string) =>
  /[{}<&>\n"']/.test(value) ? `{${JSON.stringify(value)}}` : value;

const jsxAttrValue = (value: string | number) =>
  typeof value === 'number'
    ? `{${value}}`
    : /[{}<&>\n"']/.test(value)
      ? `{${JSON.stringify(value)}}`
      : `"${value}"`;

const escapeJsTemplate = (value: string) =>
  value.replaceAll('\\', '\\\\').replaceAll('`', '\\`').replaceAll('${', () => '\\${');

const javaString = (value: string) =>
  `"${value.replaceAll('\\', '\\\\').replaceAll('"', '\\"').replaceAll('\n', '\\n').replaceAll('\r', '')}"`;

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

export function exportFileName(project: CanvasProject, framework: Framework, reactFlavor: ReactFlavor = 'tsx') {
  switch (framework) {
    case 'react':
      return `${exportComponentName(project)}.${reactFlavor}`;
    case 'vue':
      return `${exportComponentName(project)}.vue`;
    case 'angular':
      return `${exportFileStem(project)}.component.ts`;
    case 'javafx':
      return `${exportComponentName(project)}.java`;
    case 'html-css':
      return 'index.html';
  }
}

function elementStyle(element: CanvasElement, absolute = true): StyleDecl {
  const { frame, style } = element;
  const decl: StyleDecl = {};
  if (absolute) {
    decl.position = 'absolute';
    decl.left = px(frame.x);
    decl.top = px(frame.y);
    decl.width = px(frame.width);
    decl.minHeight = px(frame.height);
  }
  decl.background = style.background;
  decl.color = style.color;
  decl.border = `1px solid ${style.borderColor}`;
  decl.borderRadius = px(style.radius);
  decl.padding = px(style.padding);
  decl.boxShadow = `0 ${Math.max(0, style.shadow)}px ${style.shadow * 2}px rgba(15,23,42,.12)`;
  decl.fontFamily = `${style.fontFamily},system-ui,sans-serif`;
  decl.fontSize = px(style.fontSize);
  decl.fontWeight = `${style.fontWeight}`;
  decl.textAlign = style.textAlign;
  decl.opacity = `${style.opacity / 100}`;
  decl.boxSizing = 'border-box';
  decl.overflow = 'hidden';
  return decl;
}

function elementNode(element: CanvasElement): HtmlNode {
  const c = element.content;
  const accent = element.style.accent;
  if (element.kind === 'heading') {
    return { tag: 'h2', className: 'uiguru-el uiguru-heading', style: elementStyle(element), children: [c.title] };
  }
  if (element.kind === 'text') {
    return { tag: 'p', className: 'uiguru-el uiguru-text', style: elementStyle(element), children: [c.body] };
  }
  if (element.kind === 'image') {
    return {
      tag: 'img',
      className: 'uiguru-el uiguru-image',
      style: { ...elementStyle(element), objectFit: 'cover', padding: '0' },
      attrs: { src: c.imageUrl, alt: c.altText },
      children: [],
    };
  }
  if (element.kind === 'button') {
    return { tag: 'button', className: 'uiguru-el uiguru-button', style: elementStyle(element), children: [c.actionLabel] };
  }
  if (element.kind === 'input') {
    return {
      tag: 'input',
      className: 'uiguru-el uiguru-input',
      style: elementStyle(element),
      attrs: { type: 'text', placeholder: c.body },
      children: [],
    };
  }
  if (element.kind === 'textarea') {
    return {
      tag: 'textarea',
      className: 'uiguru-el uiguru-textarea',
      style: { ...elementStyle(element), resize: 'none' },
      attrs: { rows: 4 },
      children: [c.body],
    };
  }
  if (element.kind === 'badge-list') {
    return {
      tag: 'div',
      className: 'uiguru-el uiguru-badges',
      style: elementStyle(element),
      children: c.items.map((item) => ({
        tag: 'span',
        style: {
          display: 'inline-block',
          margin: '4px',
          padding: '6px 9px',
          borderRadius: '999px',
          background: `${accent}1f`,
          color: accent,
          fontWeight: '700',
        },
        children: [item],
      })),
    };
  }
  if (element.kind === 'section') {
    return {
      tag: 'section',
      className: 'uiguru-el uiguru-section',
      style: elementStyle(element),
      children: [
        { tag: 'h2', children: [c.title] },
        { tag: 'p', children: [c.body] },
      ],
    };
  }
  return {
    tag: 'article',
    className: 'uiguru-el uiguru-card',
    style: elementStyle(element),
    children: [
      {
        tag: 'img',
        attrs: { src: c.imageUrl, alt: c.altText },
        style: {
          width: '100%',
          height: '42%',
          objectFit: 'cover',
          borderRadius: px(Math.max(0, element.style.radius - 2)),
          marginBottom: '12px',
        },
        children: [],
      },
      { tag: 'small', style: { color: accent, fontWeight: '800', textTransform: 'uppercase' }, children: [c.subtitle] },
      { tag: 'h2', style: { margin: '8px 0 6px', fontSize: '1.35em' }, children: [c.title] },
      { tag: 'p', style: { lineHeight: '1.5' }, children: [c.body] },
      {
        tag: 'div',
        children: c.items.map((item) => ({
          tag: 'span',
          style: {
            display: 'inline-block',
            margin: '4px 5px 4px 0',
            padding: '5px 8px',
            borderRadius: '999px',
            background: `${accent}1f`,
            color: accent,
            fontSize: '.78em',
            fontWeight: '800',
          },
          children: [item],
        })),
      },
      {
        tag: 'button',
        style: {
          marginTop: '12px',
          border: '0',
          borderRadius: '6px',
          background: accent,
          color: 'white',
          padding: '10px 12px',
          fontWeight: '800',
        },
        children: [c.actionLabel],
      },
    ],
  };
}

function canvasNode(project: CanvasProject): HtmlNode {
  return {
    tag: 'main',
    className: 'uiguru-canvas',
    style: {
      position: 'relative',
      width: px(project.canvas.width),
      minHeight: px(project.canvas.height),
      background: project.canvas.background,
      overflow: 'hidden',
    },
    children: project.elements.map(elementNode),
  };
}

function cssDecl(style: StyleDecl) {
  return Object.entries(style)
    .map(([key, value]) => `${hyphenate(key)}:${value};`)
    .join('');
}

function htmlAttrs(node: HtmlNode) {
  const parts: string[] = [];
  if (node.className) parts.push(`class="${node.className}"`);
  if (node.style) parts.push(`style="${cssDecl(node.style)}"`);
  for (const [key, value] of Object.entries(node.attrs ?? {})) parts.push(`${key}="${esc(String(value))}"`);
  return parts.length ? ` ${parts.join(' ')}` : '';
}

function serializeHtml(node: HtmlNode, depth: number): string {
  const pad = '  '.repeat(depth);
  const attrs = htmlAttrs(node);
  if (voidTags.has(node.tag)) return `${pad}<${node.tag}${attrs} />`;
  const textOnly = node.children.every((child) => typeof child === 'string');
  if (textOnly) {
    const text = node.children.map((child) => (typeof child === 'string' ? esc(child) : '')).join('');
    return `${pad}<${node.tag}${attrs}>${text}</${node.tag}>`;
  }
  const kids = node.children
    .map((child) => (typeof child === 'string' ? `${pad}  ${esc(child)}` : serializeHtml(child, depth + 1)))
    .join('\n');
  return `${pad}<${node.tag}${attrs}>\n${kids}\n${pad}</${node.tag}>`;
}

function jsxStyle(style: StyleDecl, reactFlavor: ReactFlavor) {
  const body = Object.entries(style)
    .map(([key, value]) => `${key}: ${jsNumber(value) ?? JSON.stringify(value)}`)
    .join(', ');
  const literal = `{ ${body} }`;
  return reactFlavor === 'tsx' ? `${literal} satisfies CSSProperties` : literal;
}

function jsxAttrs(node: HtmlNode, reactFlavor: ReactFlavor) {
  const parts: string[] = [];
  if (node.className) parts.push(`className="${node.className}"`);
  if (node.style) parts.push(`style={${jsxStyle(node.style, reactFlavor)}}`);
  for (const [key, value] of Object.entries(node.attrs ?? {})) parts.push(`${key}=${jsxAttrValue(value)}`);
  return parts.length ? ` ${parts.join(' ')}` : '';
}

function serializeJsx(node: HtmlNode, depth: number, reactFlavor: ReactFlavor): string {
  const pad = '  '.repeat(depth);
  const attrs = jsxAttrs(node, reactFlavor);
  if (voidTags.has(node.tag)) return `${pad}<${node.tag}${attrs} />`;
  const textOnly = node.children.every((child) => typeof child === 'string');
  if (textOnly) {
    const text = node.children.map((child) => (typeof child === 'string' ? jsxString(child) : '')).join('');
    return `${pad}<${node.tag}${attrs}>${text}</${node.tag}>`;
  }
  const kids = node.children
    .map((child) =>
      typeof child === 'string' ? `${pad}  ${jsxString(child)}` : serializeJsx(child, depth + 1, reactFlavor),
    )
    .join('\n');
  return `${pad}<${node.tag}${attrs}>\n${kids}\n${pad}</${node.tag}>`;
}

function indentLines(value: string, spaces: number) {
  const pad = ' '.repeat(spaces);
  return value
    .split('\n')
    .map((line) => (line ? `${pad}${line}` : line))
    .join('\n');
}

function react(project: CanvasProject, reactFlavor: ReactFlavor) {
  const typeImport = reactFlavor === 'tsx' ? `import type { CSSProperties } from 'react';\n\n` : '';
  return `${typeImport}export function ${exportComponentName(project)}() {
  return (
${serializeJsx(canvasNode(project), 2, reactFlavor)}
  );
}`;
}

function vue(project: CanvasProject) {
  return `<template>
${serializeHtml(canvasNode(project), 1)}
</template>`;
}

function angular(project: CanvasProject) {
  const template = escapeJsTemplate(serializeHtml(canvasNode(project), 1));
  return `import { Component } from '@angular/core';

@Component({
  selector: 'app-${exportFileStem(project)}',
  standalone: true,
  template: \`
${template}
  \`
})
export class ${exportComponentName(project)}Component {}`;
}

function htmlCss(project: CanvasProject) {
  const title = esc(project.name);
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <style>
      body { margin: 0; }
      .uiguru-canvas { font-family: Inter, system-ui, sans-serif; }
      .uiguru-el { box-sizing: border-box; }
      .uiguru-image { display: block; }
      .uiguru-button { cursor: pointer; }
    </style>
  </head>
  <body>
${indentLines(serializeHtml(canvasNode(project), 0), 4)}
  </body>
</html>`;
}

function javafx(project: CanvasProject) {
  const lines = project.elements
    .map((element, index) => {
      const variable = `node${index}`;
      const c = element.content;
      const text =
        element.kind === 'button' ? c.actionLabel : c.title || c.body || c.altText || element.name;
      const declaration =
        element.kind === 'button'
          ? `Button ${variable} = new Button(${javaString(text)});`
          : element.kind === 'input'
            ? `TextField ${variable} = new TextField();\n    ${variable}.setPromptText(${javaString(c.body)});`
            : element.kind === 'textarea'
              ? `TextArea ${variable} = new TextArea();\n    ${variable}.setPromptText(${javaString(c.body)});`
              : `Label ${variable} = new Label(${javaString(text)});`;
      return `${declaration}
    ${variable}.setLayoutX(${Math.round(element.frame.x)});
    ${variable}.setLayoutY(${Math.round(element.frame.y)});
    ${variable}.setPrefSize(${Math.round(element.frame.width)}, ${Math.round(element.frame.height)});
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
    stage.setScene(new Scene(root, ${Math.round(project.canvas.width)}, ${Math.round(project.canvas.height)}));
    stage.show();
  }
}`;
}

export function exportProject(
  project: CanvasProject,
  framework: Framework,
  reactFlavor: ReactFlavor = 'tsx',
): string {
  switch (framework) {
    case 'react':
      return react(project, reactFlavor);
    case 'vue':
      return vue(project);
    case 'angular':
      return angular(project);
    case 'javafx':
      return javafx(project);
    case 'html-css':
      return htmlCss(project);
  }
}
