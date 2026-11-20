# Stone Literary LLC Editor

A focused, standalone editing tool for writers. Paste your text, get a structured pass for mechanical errors, and step through each flagged issue one at a time — keeping your author voice intact.

## Philosophy

Most editing tools flag everything inline while you write, interrupting your flow. This tool respects the separation between drafting and editing. You finish your passage, come here, run a pass, and make deliberate decisions. Suggestions are candidates — not corrections. The writer always decides.

No rewrites are suggested. Ever.

## Features

- **Genre modes** — Fiction, Non-fiction, Academic, Business. Adjusts how strictly rules are applied (Fiction respects fragments and stylistic voice; Academic applies strict standards)
- **Pass types** — Errors Only (spelling, grammar, punctuation) or Full Pass (also flags clarity, word choice, style)
- **Model picker**: choose which Claude model runs the pass. Options are Haiku 5.5 (fastest, cheapest), Sonnet 5.5, Sonnet 4.6 (the default), Opus 5.5 (most thorough), or any model ID you type in. Your choice is remembered
- **Ignore List** — Add character names, invented words, or proper nouns you never want flagged. Saved permanently
- **Context snippet** — Each issue shows just the surrounding sentences, not the entire document
- **Prev / Next navigation** — Step through issues one at a time
- **New Session** — Clear and start fresh without restarting the app

## Requirements

- Your own Anthropic API key. The app shows these steps the first time it opens, and again from the "Here's how to get one" link under the key box:
  1. Create an account or sign in at the [Claude Console](https://platform.claude.com)
  2. Add credit under **Settings → Billing**. The API is pay-as-you-go and billed separately from a Claude.ai subscription
  3. Open [**Settings → API Keys**](https://platform.claude.com/settings/keys), click **Create Key**, and copy it. It starts with `sk-ant-` and is shown only once
  4. Paste the key into the app. It is stored only on your computer
- Usage is billed directly to your Anthropic account. Cost depends on the model you pick: Haiku is the cheapest and Opus costs the most (see [anthropic.com/pricing](https://www.anthropic.com/pricing))

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
| v2.1.0  | Model picker, built-in API key guide, fresh installs start with no saved key |

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
