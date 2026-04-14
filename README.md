# Stone Literary LLC Editor

A focused, standalone editing tool for writers. Paste your text, get a structured pass for mechanical errors, and step through each flagged issue one at a time — keeping your author voice intact.

## Philosophy

Most editing tools flag everything inline while you write, interrupting your flow. This tool respects the separation between drafting and editing. You finish your passage, come here, run a pass, and make deliberate decisions. Suggestions are candidates — not corrections. The writer always decides.

No rewrites are suggested. Ever.

## Features

- **Genre modes** — Fiction, Non-fiction, Academic, Business. Adjusts how strictly rules are applied (Fiction respects fragments and stylistic voice; Academic applies strict standards)
- **Pass types** — Errors Only (spelling, grammar, punctuation) or Full Pass (also flags clarity, word choice, style)
- **Ignore List** — Add character names, invented words, or proper nouns you never want flagged. Saved permanently
- **Context snippet** — Each issue shows just the surrounding sentences, not the entire document
- **Prev / Next navigation** — Step through issues one at a time
- **New Session** — Clear and start fresh without restarting the app

## Requirements

- An [Anthropic API key](https://console.anthropic.com) — create a free account, navigate to API Keys, and generate one
- Each analysis costs roughly **$0.01–$0.03** per 10,000 words, billed directly to your Anthropic account

## Installation

Download the latest installer from the [Releases](../../releases) page and run it. No other setup required.

To uninstall, use Add/Remove Programs. All saved settings including your API key are removed automatically.

## Running from Source

Requires Node.js 18 or higher.

```bash
git clone https://github.com/msmith110660/stone-literary-editor.git
cd stone-literary-editor
npm install
npm start
```

To build the Windows installer:

```bash
npm run build
```

The installer will be output to the `dist/` folder.

## Versions

| Version | Description |
|---------|-------------|
| v1.0.0  | Intermediate — errors only, no genre or pass type controls |
| v2.0.0  | Advanced — genre selector, pass type, ignore list, dark theme |

To build a specific version:

```bash
git checkout v1.0.0
npm install
npm run build
```

## Tech Stack

- [Electron](https://electronjs.org) — desktop app wrapper
- [Express](https://expressjs.com) — local server
- [Anthropic API](https://docs.anthropic.com) — Claude powers the editing pass
