import { injectGlobal } from '@emotion/css';

injectGlobal`
  :root {
    color-scheme: dark;

    --color-bg: #000000;
    --color-bg-elevated: #0a0a0a;
    --color-surface: #111111;
    --color-surface-hover: #1a1a1a;
    --color-surface-active: #242424;
    --color-border: #262626;
    --color-border-strong: #3d3d3d;
    --color-fg: #ededed;
    --color-fg-muted: #a1a1a1;
    --color-fg-subtle: #6f6f6f;
    --color-accent: #0070f3;
    --color-accent-muted: rgba(0, 112, 243, 0.45);
    --color-accent-faint: rgba(0, 112, 243, 0.12);
    --color-danger: #e5484d;
    --color-danger-faint: rgba(229, 72, 77, 0.12);
    --color-ink: #000000;

    --radius-sm: 6px;
    --radius-md: 8px;
    --radius-lg: 12px;

    --shadow-floating: 0 0 0 1px var(--color-border),
      0 16px 48px rgba(0, 0, 0, 0.65);
    --shadow-page: 0 0 0 1px var(--color-border), 0 24px 64px rgba(0, 0, 0, 0.6);

    --font-sans: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto,
      Helvetica, Arial, sans-serif;
    --font-mono: ui-monospace, 'SF Mono', Menlo, Consolas, monospace;

    --header-height: 56px;
    --panel-width: 288px;
  }

  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  html,
  body,
  #root {
    height: 100%;
  }

  body {
    margin: 0;
    background: var(--color-bg);
    color: var(--color-fg);
    font-family: var(--font-sans);
    font-size: 14px;
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
  }

  button {
    font: inherit;
    color: inherit;
    background: none;
    border: 0;
    padding: 0;
    margin: 0;
    cursor: pointer;
  }

  input {
    font: inherit;
    color: inherit;
  }

  h1,
  h2,
  p,
  ul {
    margin: 0;
  }

  ul {
    padding: 0;
    list-style: none;
  }

  :focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
  }

  ::selection {
    background: var(--color-accent-muted);
  }

  ::-webkit-scrollbar {
    width: 10px;
    height: 10px;
  }

  ::-webkit-scrollbar-thumb {
    background: var(--color-border-strong);
    border-radius: 999px;
    border: 2px solid transparent;
    background-clip: padding-box;
  }

  ::-webkit-scrollbar-track {
    background: transparent;
  }
`;
