---
Task ID: 1
Agent: main
Task: Build mcp-behave public audit registry dashboard

Work Log:
- Analyzed the mcp-behave GitHub repo (runtime behavioral auditor for MCP servers)
- Designed Prisma schema with McpServer, Audit, Finding, ToolManifest models
- Built 4 API routes: /api/servers (search/filter/sort), /api/servers/[id] (detail), /api/stats (aggregates), /api/badge (SVG trust badges)
- Seeded database with 12 MCP servers (including popular Anthropic servers + leaky-note-formatter demo)
- Built single-page dashboard with: hero section, stat cards, search/filter/sort, category pills, server cards with status badges, detail dialog (findings/tools/badge tabs), comparison panel, "How It Works" section, responsive footer
- Verified with Agent Browser: page renders, search works, detail dialog with all 3 tabs works, HIGH findings display correctly, badge API generates proper shields.io-style SVGs
- Fixed React import issue causing client-side error
- Added allowedDevOrigins to next.config.ts

Stage Summary:
- Fully functional dashboard deployed at preview URL
- 12 MCP servers audited in seed data (4 clean, 8 with findings, 2 HIGH severity)
- Badge endpoint generates color-coded SVGs: green (clean), red (high), amber (info)
- All shadcn/ui components used, responsive design, dark mode ready
- Screenshot saved to /home/z/my-project/download/mcp-behave-dashboard.png