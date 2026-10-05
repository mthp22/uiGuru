import ts from 'typescript';
import { exportProject, exportFileName } from '../src/exporters';
import { createEmptyProject, createElement, createComponentElements } from '../src/data';
import { writeFileSync, mkdirSync } from 'node:fs';

const outDir = '/tmp/exp-build';
mkdirSync(outDir, { recursive: true });

const project = createEmptyProject();
project.name = 'Landing Page';

const kinds = ['section', 'card', 'heading', 'text', 'image', 'button', 'badge-list', 'input', 'textarea'] as const;
kinds.forEach((kind, i) => {
  const el = createElement(kind, { x: 20 + i * 30, y: 40 + i * 60 });
  el.content.title = `Title {with braces} & <tags> "quotes" $dollar`;
  el.content.body = 'Body with ${template} and backtick ` and \\backslash\\ newline\nline2';
  el.content.subtitle = 'Sub "quoted" & <angled>';
  el.content.actionLabel = 'Click {me} & "go"';
  el.content.altText = 'Alt & "quoted" <text>';
  el.content.items = ['Item {1}', 'Item & 2', 'It\'em 3'];
  project.elements.push(el);
});

project.elements.push(...createComponentElements('login-form', { x: 40, y: 700 }));

const frameworks = ['react', 'vue', 'angular', 'javafx', 'html-css'] as const;
let failures = 0;

function report(label: string, ok: boolean, detail?: string) {
  if (!ok) failures += 1;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${!ok && detail ? `\n      ${detail}` : ''}`);
}

function parseCheck(code: string, kind: ts.ScriptKind, label: string) {
  const sf = ts.createSourceFile(label, code, ts.ScriptTarget.Latest, true, kind);
  const diags = (sf as unknown as { parseDiagnostics?: ts.DiagnosticWithLocation[] }).parseDiagnostics ?? [];
  report(label, diags.length === 0, diags.length ? `line ${diags[0].start}: ${ts.flattenDiagnosticMessageText(diags[0].messageText, ' ')}` : undefined);
}

function htmlCheck(code: string, label: string) {

  const problems: string[] = [];
  if (code.includes('undefined')) problems.push('contains "undefined"');
  if (code.includes('[object')) problems.push('contains "[object"');


  const tagRe = /<\/?([a-zA-Z][\w-]*)([^>]*?)\/?>/g;
  const stack: string[] = [];
  const voids = new Set(['img', 'br', 'hr', 'input', 'meta', 'link']);
  let m: RegExpExecArray | null;
  while ((m = tagRe.exec(code))) {
    const [full, name, attrs] = m;
    const lower = name.toLowerCase();
    if (voids.has(lower) || full.endsWith('/>')) continue;
    if (full.startsWith('</')) {
      const top = stack.pop();
      if (top !== lower) problems.push(`mismatched </${lower}>, expected </${top ?? 'nothing'}>`);
    } else {
      stack.push(lower);
    }
    if (attrs.includes('"') && (attrs.match(/"/g) ?? []).length % 2 !== 0) {
      problems.push(`unbalanced quotes in <${lower}> attrs`);
    }
  }
  if (stack.length) problems.push(`unclosed tags: ${stack.join(', ')}`);
  report(label, problems.length === 0, problems.join('; '));
}

for (const fw of frameworks) {
  if (fw === 'react') {
    for (const flavor of ['jsx', 'tsx'] as const) {
      const code = exportProject(project, 'react', flavor);
      const name = exportFileName(project, 'react', flavor);
      writeFileSync(`${outDir}/${name}`, code);
      report(`react .${flavor} file name ends with .${flavor}`, name.endsWith(`.${flavor}`), name);
      parseCheck(code, flavor === 'tsx' ? ts.ScriptKind.TSX : ts.ScriptKind.JSX, `react .${flavor} parses`);
      if (flavor === 'tsx') {
        report('react .tsx imports CSSProperties', code.includes("import type { CSSProperties } from 'react'"));
      } else {
        report('react .jsx has no TS-only syntax', !code.includes('satisfies') && !code.includes('import type'));
      }
      report(`react .${flavor} has no string-hack style={{"`, !code.includes('style={{"'), 'found broken style hack');
      if (flavor === 'tsx') {
        const inputs = (code.match(/<input\b/g) ?? []).length;
        report('react .tsx emits real <input> elements', inputs >= 2, `found ${inputs}`);
        report('react .tsx emits <textarea> element', code.includes('<textarea'));
      }
    }
  } else if (fw === 'angular') {
    const code = exportProject(project, 'angular');
    const name = exportFileName(project, 'angular');
    writeFileSync(`${outDir}/${name}`, code);
    report('angular file name .component.ts', name.endsWith('.component.ts'), name);
    parseCheck(code, ts.ScriptKind.TS, 'angular .ts parses');
    report('angular template escapes ${ in content', !/(?<!\\)\$\{/.test(code));
  } else if (fw === 'vue') {
    const code = exportProject(project, 'vue');
    const name = exportFileName(project, 'vue');
    writeFileSync(`${outDir}/${name}`, code);
    report('vue file name .vue', name.endsWith('.vue'), name);
    report('vue starts with <template>', code.startsWith('<template>'));
    htmlCheck(code.slice(code.indexOf('>') + 1, code.lastIndexOf('</template>')), 'vue template balanced');
  } else if (fw === 'html-css') {
    const code = exportProject(project, 'html-css');
    const name = exportFileName(project, 'html-css');
    writeFileSync(`${outDir}/${name}`, code);
    report('html file name index.html', name === 'index.html', name);
    report('html is full document', code.startsWith('<!doctype html>') && code.endsWith('</html>'));
    htmlCheck(code.slice(code.indexOf('<body>') + 6, code.lastIndexOf('</body>')), 'html body balanced');
    const inputCount = (code.match(/<input\b/g) ?? []).length;
    report('html emits real <input> elements', inputCount >= 2, `found ${inputCount}`);
    report('html emits <textarea> with content', /<textarea[^>]*>[^<]+<\/textarea>/.test(code));
  } else if (fw === 'javafx') {
    const code = exportProject(project, 'javafx');
    const name = exportFileName(project, 'javafx');
    writeFileSync(`${outDir}/${name}`, code);
    report('javafx file name .java', name.endsWith('.java'), name);
    // Java class name must match file name (public class rule).
    const cls = name.replace(/\.java$/, '');
    report('javafx public class matches file name', code.includes(`public class ${cls} `), `expected public class ${cls}`);
    // No HTML entities in Java string literals (quotes must be \").
    const javaStringLines = code.split('\n').filter((l) => l.includes('new Button(') || l.includes('new Label('));
    const bad = javaStringLines.filter((l) => l.includes('&quot;') || l.includes('&amp;') || l.includes('&lt;'));
    report('javafx strings use Java escaping not HTML entities', bad.length === 0, bad[0]);
    // Brace balance smoke test.
    const opens = (code.match(/\{/g) ?? []).length;
    const closes = (code.match(/\}/g) ?? []).length;
    report('javafx braces balanced', opens === closes, `open=${opens} close=${closes}`);
    report('javafx emits TextField/TextArea controls', code.includes('new TextField(') && code.includes('new TextArea('));
    // Unescaped double quote inside string check: every " inside a string literal must be \" —
    // approximate: strip known-good quoted segments.
    const stripped = code.replace(/"(?:[^"\\]|\\.)*"/g, '');
    const stray = stripped.match(/"/g) ?? [];
    report('javafx quotes balanced outside literals', stray.length === 0, `${stray.length} stray quotes`);
  }
}

// Determinism: same input twice => identical output.
for (const fw of frameworks) {
  const a = exportProject(project, fw);
  const b = exportProject(project, fw);
  report(`${fw} deterministic`, a === b);
}

console.log(failures ? `\n${failures} FAILURES` : '\nALL PASS');
process.exit(failures ? 1 : 0);
