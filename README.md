````
 uiGuru

**Build UI visually. Own the code.**

A low-code UI builder for creating interfaces visually and exporting them as real, production-ready code.

Drag blocks onto a canvas, customize them with a visual inspector, preview responsive layouts, and export your design to **React, Vue, Angular, JavaFX, Bootstrap, Tailwind, or plain HTML/CSS**.

---

## Features

### 🎨 Visual UI Builder

Build interfaces visually using a drag-and-drop canvas. Add blocks, rearrange them, and see your changes immediately.

###  Drag-and-Drop Blocks

Compose interfaces from reusable building blocks:

- Sections
- Headings
- Text
- Buttons
- Images
- Navigation bars
- Hero sections
- Forms
- Cards
- Footers

### Visual Inspector

Select any element and customize its properties without manually editing source code.

Configure:

- Content
- Typography
- Font size
- Font weight
- Text color
- Background color
- Width
- Height
- Margin
- Padding
- Alignment
- Layout
- Responsive behavior

### Responsive Preview

Preview your interface across different viewport sizes:

- Desktop
- Tablet
- Mobile

 ### Undo & Redo

 Experiment freely with your design using reliable editor history.

 ### Autosave

 Your work is automatically saved so refreshing the page doesn't mean losing your design.

 ### 💻 Clean Code Generation

 Export clean, readable code that you can take into your own project and continue editing.

---

 ## Export Targets

 Design your interface once and export it to the technology you already use.

 | Target | Output |
| --- | --- |
| React | React components |
| Vue | Vue components |
| Angular | Angular templates/components |
| JavaFX | JavaFX UI code |
| Bootstrap | Bootstrap HTML |
| Tailwind | Tailwind HTML |
| HTML/CSS | Plain HTML and CSS |


 ## Tech Stack

 uiGuru is currently built with:

 - React
- TypeScript
- Vite
- ESLint

---

 ## Requirements

 Before running uiGuru locally, make sure you have:

 - Node.js installed
- npm
- Git

 A current LTS version of Node.js is recommended.

---

 ## Getting Started

 ### 1\. Clone the repository

 ### 2\. Navigate to the project

```
cd uiGuru
```

 ### 3\. Install dependencies

```
npm install
```

 ### 4\. Start the development server

```
npm run dev
```

 Vite will start the development server and provide a local URL.

 Open the URL in your browser to launch uiGuru.

---
 ### Development

```
npm run dev
```

 Starts the Vite development server with hot module replacement.

 ### Production Build

```
npm run build
```

 Creates an optimized production build.

 ### Preview

```
npm run preview
```

 Serves the production build locally.

 ### Lint

```
npm run lint
```

 Runs ESLint against the project.

---

 ## Project Structure

```
uiGuru/
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   ├── App.tsx
│   ├── main.tsx
│   └── ...
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── eslint.config.js
```

 As the builder grows, the project can be organized into editor and exporter modules:

```
src/
├── components/
│   ├── blocks/
│   ├── canvas/
│   ├── inspector/
│   ├── layers/
│   └── code/
├── editor/
├── exporters/
│   ├── react/
│   ├── vue/
│   ├── angular/
│   ├── javafx/
│   ├── bootstrap/
│   ├── tailwind/
│   └── html/
└── ...
```

---

 ## Architecture

 uiGuru separates the visual editor from generated output.

```
                 ┌─────────────────┐
                 │   UI Builder    │
                 └────────┬────────┘
                          │
                          ▼
                 ┌─────────────────┐
                 │  UI Definition  │
                 │   Component     │
                 │      Tree       │
                 └────────┬────────┘
                          │
            ┌─────────────┼─────────────┐
            │             │             │
            ▼             ▼             ▼
         React           Vue        Angular
            │             │             │
            └─────────────┼─────────────┘
                          │
             ┌────────────┼────────────┐
             │            │            │
             ▼            ▼            ▼
          JavaFX      Bootstrap     Tailwind
                          │
                          ▼
                       HTML/CSS
```

 The editor works with a structured representation of the interface, while exporters transform that representation into the selected target technology.

 This allows a single visual design to support multiple export targets.

---

 ## Design Philosophy

 ### Visual First

 Users should be able to create useful interfaces without manually writing every line of code.

 ### Code Ownership

 Generated code belongs to the user. uiGuru should help create the interface without locking users into the editor.

 ### Framework Flexibility

 The same visual design should be capable of being exported to different technologies.

 ### Clean Output

 Generated code should be readable, maintainable, semantic, and free from unnecessary editor-specific artifacts.

 ### Fast Iteration

 Users should be able to experiment, preview, undo changes, and iterate quickly.

---

 ## Roadmap

 - [ ] More UI blocks
- [ ] Component templates
- [ ] Custom components
- [ ] Component variants
- [ ] Design tokens
- [ ] Advanced responsive controls
- [ ] Grid and Flexbox controls
- [ ] Keyboard shortcuts
- [ ] Copy and paste components
- [ ] Duplicate components
- [ ] Import existing HTML
- [ ] More export targets
- [ ] Export complete projects
- [ ] Download generated source files
- [ ] Cloud projects
- [ ] User accounts
- [ ] Collaboration
- [ ] Shared component libraries
- [ ] Community templates

 ## uiGuru

 **Build UI visually. Own the code.**

 Drag. Design. Preview. Export.

 **One UI. Multiple targets.**