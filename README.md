# Chattermill plugin for AI agents

This plugin connects your AI agent to your Chattermill workspace. One install gives the agent two things:

- **The Chattermill MCP server** at `https://app.chattermill.com/mcp`. It has tools for feedback, themes, observations, metrics, NPS drivers and dashboards. You sign in with your Chattermill account, and the agent sees only the projects your account can see.
- **The `chattermill-best-practices` skill.** It shows the agent how to find theme and segment IDs before filtering, how to build filters the tools accept, and how to link back to the same view in the Chattermill app.

The same repo installs in Claude Code, Claude desktop and Cowork, Cursor, Codex, GitHub Copilot CLI and Gemini CLI. Install it once per agent. If you also add the MCP server to that agent by hand, remove the manual entry, or you'll end up with two copies and two sign-ins.

## Install

### Claude Code

```
/plugin marketplace add chattermill/cursor-plugin
/plugin install chattermill@chattermill-plugins
```

Then run `/mcp`, pick `plugin:chattermill:chattermill` and sign in.

### Claude desktop and Cowork

Add `chattermill/cursor-plugin` as a plugin marketplace in settings, then install `chattermill`.

### Cursor

Open Settings, go to Plugins, search for Chattermill and click Install.

### Codex

```bash
codex plugin marketplace add chattermill/cursor-plugin
codex plugin add chattermill@chattermill-plugins
```

### GitHub Copilot CLI

```bash
copilot plugin marketplace add chattermill/cursor-plugin
copilot plugin install chattermill@chattermill-plugins
```

### Gemini CLI

```bash
gemini extensions install https://github.com/chattermill/cursor-plugin
```

### Any other agent

For the skill alone, in any agent that reads Agent Skills:

```bash
npx skills add chattermill/cursor-plugin
```

Then add the MCP server through your client's own MCP settings, using the URL `https://app.chattermill.com/mcp` and HTTP transport. The server handles sign-in with OAuth.

## US workspaces

If your workspace is on the US instance, the server URL is `https://app-us.chattermill.com/mcp`.

- **Claude Code:** set `CHATTERMILL_MCP_URL=https://app-us.chattermill.com/mcp` in your environment before you start Claude.
- **Other agents:** the plugin connects to the EU/global URL. Add the US URL as a manual MCP server instead.

## Example prompts

- "What's dragging our NPS down this quarter?"
- "Show me comments about delivery delays from Germany last month."
- "Compare negative sentiment about onboarding in Q2 and Q3, and link me to the chart."

## How the repo is laid out

The skill lives once in `skills/`, and every agent reads it from there. Each agent has its own small manifest pointing at the same content:

| File | Read by |
|---|---|
| `plugin.json`, `mcp.json` | Codex, GitHub Copilot CLI, Cursor (Agent Plugins 1.0 format) |
| `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `.mcp.json` | Claude Code, Claude desktop, Cowork. Copilot CLI and Codex also accept the marketplace file. |
| `.cursor-plugin/plugin.json` | Cursor |
| `.agents/plugins/marketplace.json` | Codex |
| `gemini-extension.json` | Gemini CLI |
| `skills/chattermill-best-practices/` | All of the above, plus `npx skills` |

## Maintaining it

The skill's source of truth is the GitLab repo `chattermill/product/chattermill-mcp-skills`. To ship a new version:

```bash
./scripts/sync-skill.sh ../chattermill-mcp-skills
./scripts/bump-version.sh 1.2.0
git commit -am "Update chattermill-best-practices" && git push
```

`bump-version.sh` writes the version into all four manifests that carry one, so the agents stay in step.

## Support

Email [support@chattermill.com](mailto:support@chattermill.com) or see [help.chattermill.com](https://help.chattermill.com).
