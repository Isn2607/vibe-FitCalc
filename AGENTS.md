# AGENTS.md - AI Coding Guidelines

This file provides system instructions, technical guidelines, and commands for all AI coding agents (like Cursor, GitHub Copilot, or CLI agents) operating within this repository. Read this entirely before proposing or executing code changes.

## 1. Tech Stack & Environment

- **Markup**: HTML5 (Semantic and Accessible)
- **Styling**: Vanilla CSS3 (Custom Properties, Flexbox/Grid, Mobile-first)
- **Scripting**: Vanilla JavaScript (ES6+ Modules, DOM API)
- **Tooling**: Node.js/npm for scripts, Prettier for formatting, ESLint/Stylelint for linting.
- **Visuals**: Chart.js via CDN for data visualization.

## 2. Build, Lint, and Test Commands

Agents should verify changes before finalizing any task by running the following commands:

### Development Server

- **Start local server**: `npm run dev`
  _(Usually served via a lightweight server like `serve` or `http-server` to test HTML/CSS/JS changes)_

### Linting & Formatting

- **Check formatting**: `npm run format:check`
- **Fix formatting**: `npm run format:write` (Runs Prettier on all HTML, CSS, and JS files)
- **Lint Codebase**: `npm run lint` (Runs ESLint for JS and Stylelint for CSS)
- **Fix Lint Errors**: `npm run lint:fix`

### Testing

If JavaScript unit tests exist (e.g., via Vitest or Jest), run them to ensure logic is intact.

- **Run all tests**: `npm run test`
- **Run tests in watch mode**: `npm run test:watch`
- **Run a SINGLE test file**: `npm run test -- path/to/file.test.js`
  _(Crucial for isolating failures. Always run the single test related to your changes before running the full suite)._
- **Run a specific test case within a file**: `npm run test -- -t "Test Name"`

## 3. Code Style Guidelines

### 3.1. HTML Best Practices

- **Semantics**: Use proper semantic tags (`<header>`, `<nav>`, `<main>`, `<article>`, `<section>`, `<footer>`, `<aside>`). Avoid excessive `<div>` nesting ("divitis").
- **Accessibility (a11y)**:
  - Provide meaningful `alt` text for all `<img>` tags. Use `alt=""` for purely decorative images.
  - Use `aria-*` attributes and `role` only when native semantic tags fall short.
  - Ensure interactive elements are keyboard accessible (e.g., buttons, links, form inputs).
  - Include `<label for="inputId">` for all form inputs.
- **Structure**:
  - Keep `<style>` and `<script>` tags out of the HTML body.
  - Link CSS in the `<head>`.
  - Load JavaScript using `<script src="app.js" defer></script>` in the `<head>`.
- **Formatting**: Use 2 spaces for indentation. Quote all attributes consistently with double quotes. Avoid inline styling (`style="..."`).

### 3.2. Vanilla CSS Best Practices

- **Methodology**: Use the BEM (Block Element Modifier) naming convention for classes to prevent specificity clashes.
  - Block: `.card`
  - Element: `.card__title`
  - Modifier: `.card--highlighted`
- **Variables**: Use CSS Custom Properties (variables) defined in `:root` for colors, typography, spacing, and theming. Avoid hardcoding repetitive hex codes or pixel values.
- **Layouts**: Prefer CSS Grid for overarching page structures and Flexbox for 1-dimensional component layouts (like navbars or button groups).
- **Responsiveness**: Use a mobile-first approach. Write base styles for small screens, then use `min-width` media queries for larger viewports.
- **Units**: Prefer relative units (`rem`, `em`, `%`, `vh/vw`) over absolute units (`px`) for better accessibility and scaling.
- **State Classes**: Use `.is-active`, `.has-error`, `.is-hidden` for JavaScript-toggled states. Do not attach styles to generic IDs unless absolutely necessary.
- **Avoid**: `!important` declarations, inline styles, and deep nesting of selectors (keep specificity flat, max 2-3 levels deep).

### 3.3. Vanilla JavaScript Best Practices

- **Modern Syntax**: Rely on `const` for immutable variables and `let` for mutable ones (never use `var`). Use arrow functions, destructuring, template literals, optional chaining (`?.`), and nullish coalescing (`??`).
- **Modules & Architecture**:
  - Keep files focused on a single responsibility.
  - Separate state management from DOM manipulation logic.
- **Naming Conventions**:
  - Variables, functions, methods: `camelCase` (e.g., `calculateBMR`)
  - Classes, constructors: `PascalCase` (e.g., `FitnessChart`)
  - Constants (global/configuration): `UPPER_SNAKE_CASE` (e.g., `MALE_BMR_CONSTANT`)
  - Boolean variables: Prefix with `is`, `has`, or `should` (e.g., `isMetric`)
  - DOM Elements: Suffix with `El` or `Btn` (e.g., `calculateBtn`, `resultsSectionEl`) to distinguish them from standard variables.
- **DOM Manipulation**:
  - Cache DOM elements in variables if accessed multiple times to reduce layout thrashing.
  - Prefer `document.getElementById` or `document.querySelector` for single elements.
  - Prefer `document.querySelectorAll` for multiple elements.
  - Use event delegation for dynamically added elements (attach listener to the parent).
- **Control Flow & Error Handling**:
  - Use early returns to reduce nesting and improve readability.
  - Gracefully handle missing DOM nodes or invalid inputs (e.g., `if (!inputEl.value) return;`).
- **Avoid**:
  - Polluting the global `window` object unnecessarily.
  - Introducing heavy third-party libraries (like jQuery) for operations natively supported by modern browsers.

## 4. Agent-Specific Directives (Cursor & Copilot Rules)

When generating code, analyzing tasks, or proposing changes, AI agents must rigorously adhere to the following rules:

1. **Context First**: Always use tools (`glob`, `grep`, `read`) to analyze surrounding code and imported files before making any modifications. Never guess the structure of an unseen file.
2. **Do Not Hallucinate Dependencies**: Ensure all suggested libraries or imports are present in the project before using them.
3. **Idiomatic Integration**: Mimic the style (formatting, naming), structure, and typing of existing code. Ensure your changes integrate naturally.
4. **Self-Documenting Code**: Write clear, readable code. Add comments _only_ to explain the "why" behind complex logic, not the "what".
5. **Iterative Changes**: Make small, incremental edits. Run the single relevant test and lint checks after each logical step before proceeding.
6. **Security & Safety**: Never hardcode API keys or secrets in front-end HTML/JS files. Ensure all user inputs are sanitized before rendering to the DOM. Use `textContent` instead of `innerHTML` when inserting user data to prevent XSS.
7. **No Reverting Unprompted**: Do not revert changes unless explicitly asked to do so by the user, or if a change you just made immediately caused a failing test/build error.
8. **Proactiveness**: Fulfill the request thoroughly, including directly implied follow-up actions (like updating CSS when changing an HTML structure).

## 5. Git & Commit Guidelines

- **Commit Messages**: Follow the Conventional Commits specification (e.g., `feat: add metric toggle`, `style: update dark theme colors`).
- **Scope**: Keep commits focused on a single logical change.
- **Agent Note**: Never automatically commit changes unless explicitly requested by the user. Always use the `bash` tool to present a `git status` and `git diff` before asking for permission to commit.
