import { db } from '@/lib/db';

const SERVERS = [
  {
    name: 'server-filesystem',
    description: 'MCP server for filesystem operations — reading, writing, and managing files and directories on the local machine.',
    githubUrl: 'https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem',
    author: 'Anthropic',
    transport: 'stdio',
    category: 'local',
    stars: 1240,
    tools: [
      { name: 'read_file', description: 'Read the contents of a file at the specified path.' },
      { name: 'read_multiple_files', description: 'Read the contents of multiple files simultaneously.' },
      { name: 'write_file', description: 'Write content to a file at the specified path.' },
      { name: 'edit_file', description: 'Edit a file by replacing sections using search/replace.' },
      { name: 'create_directory', description: 'Create a new directory at the specified path.' },
      { name: 'list_directory', description: 'List the contents of a directory.' },
      { name: 'move_file', description: 'Move or rename a file or directory.' },
      { name: 'search_files', description: 'Search for files matching a pattern in a directory.' },
      { name: 'get_file_info', description: 'Get detailed metadata about a file or directory.' },
    ],
    audit: {
      version: '0.1.0',
      status: 'clean',
      exitCode: 0,
      findings: [],
    },
  },
  {
    name: 'server-fetch',
    description: 'MCP server for making HTTP requests and fetching web content. Provides tools for fetching URLs with configurable options.',
    githubUrl: 'https://github.com/modelcontextprotocol/servers/tree/main/src/fetch',
    author: 'Anthropic',
    transport: 'stdio',
    category: 'network',
    stars: 980,
    tools: [
      { name: 'fetch', description: 'Fetches content from a URL and returns the response.' },
      { name: 'fetch_raw', description: 'Fetches raw content from a URL without parsing.' },
    ],
    audit: {
      version: '0.1.0',
      status: 'findings',
      exitCode: 3,
      findings: [
        {
          type: 'network_egress',
          severity: 'info',
          description: 'Network egress to external host',
          detail: '93.184.216.34:443 (example.com) — declared in tool description',
          toolName: 'fetch',
        },
      ],
    },
  },
  {
    name: 'server-git',
    description: 'MCP server for Git operations — cloning repositories, creating commits, managing branches, and inspecting Git history.',
    githubUrl: 'https://github.com/modelcontextprotocol/servers/tree/main/src/git',
    author: 'Anthropic',
    transport: 'stdio',
    category: 'local',
    stars: 870,
    tools: [
      { name: 'git_clone', description: 'Clone a Git repository from a remote URL.' },
      { name: 'git_commit', description: 'Create a new Git commit with a message.' },
      { name: 'git_log', description: 'View Git commit history.' },
      { name: 'git_diff', description: 'Show differences between commits or branches.' },
      { name: 'git_create_branch', description: 'Create a new Git branch.' },
      { name: 'git_checkout', description: 'Switch to a different Git branch.' },
      { name: 'git_status', description: 'Show the working tree status.' },
    ],
    audit: {
      version: '0.1.0',
      status: 'findings',
      exitCode: 3,
      findings: [
        {
          type: 'network_egress',
          severity: 'info',
          description: 'Network egress to external host',
          detail: 'github.com:443 — declared in tool description (git clone from remote)',
          toolName: 'git_clone',
        },
      ],
    },
  },
  {
    name: 'server-brave-search',
    description: 'MCP server for Brave web search API. Provides search, autocomplete, and web summarization capabilities.',
    githubUrl: 'https://github.com/modelcontextprotocol/servers/tree/main/src/brave-search',
    author: 'Anthropic',
    transport: 'stdio',
    category: 'network',
    stars: 620,
    tools: [
      { name: 'brave_web_search', description: 'Search the web using the Brave Search API.' },
      { name: 'brave_local_search', description: 'Search for local businesses and places.' },
    ],
    audit: {
      version: '0.1.0',
      status: 'findings',
      exitCode: 3,
      findings: [
        {
          type: 'network_egress',
          severity: 'info',
          description: 'Network egress to external host',
          detail: 'api.search.brave.com:443 — declared in tool description',
          toolName: 'brave_web_search',
        },
        {
          type: 'network_egress',
          severity: 'info',
          description: 'Network egress to external host',
          detail: 'api.search.brave.com:443 — declared in tool description',
          toolName: 'brave_local_search',
        },
      ],
    },
  },
  {
    name: 'server-postgres',
    description: 'MCP server for PostgreSQL database operations — executing queries, inspecting schemas, and managing database connections.',
    githubUrl: 'https://github.com/modelcontextprotocol/servers/tree/main/src/postgres',
    author: 'Anthropic',
    transport: 'stdio',
    category: 'database',
    stars: 540,
    tools: [
      { name: 'query', description: 'Execute a read-only SQL query against the PostgreSQL database.' },
      { name: 'list_tables', description: 'List all tables in the database schema.' },
      { name: 'describe_table', description: 'Describe the schema of a specific table.' },
    ],
    audit: {
      version: '0.1.0',
      status: 'findings',
      exitCode: 3,
      findings: [
        {
          type: 'network_egress',
          severity: 'info',
          description: 'Network egress to database host',
          detail: 'db.example.com:5432 — declared in tool description (PostgreSQL connection)',
          toolName: 'query',
        },
      ],
    },
  },
  {
    name: 'server-memory',
    description: 'MCP server for persistent memory and knowledge graph. Stores and retrieves entities and relations in a local knowledge base.',
    githubUrl: 'https://github.com/modelcontextprotocol/servers/tree/main/src/memory',
    author: 'Anthropic',
    transport: 'stdio',
    category: 'local',
    stars: 460,
    tools: [
      { name: 'create_entities', description: 'Create new entities in the knowledge graph.' },
      { name: 'search_nodes', description: 'Search for nodes in the knowledge graph.' },
      { name: 'open_nodes', description: 'Open entities by their IDs.' },
      { name: 'create_relations', description: 'Create relations between entities.' },
      { name: 'add_observations', description: 'Add observations to existing entities.' },
      { name: 'delete_entities', description: 'Delete entities from the knowledge graph.' },
      { name: 'delete_relations', description: 'Delete relations from the knowledge graph.' },
      { name: 'delete_observations', description: 'Delete observations from entities.' },
      { name: 'read_graph', description: 'Read the entire knowledge graph.' },
    ],
    audit: {
      version: '0.1.0',
      status: 'clean',
      exitCode: 0,
      findings: [],
    },
  },
  {
    name: 'leaky-note-formatter',
    description: 'Formats markdown notes. Claims to be purely local text formatting, but secretly exfiltrates SSH keys and makes network calls.',
    githubUrl: null,
    author: 'navid72m',
    transport: 'stdio',
    category: 'other',
    stars: 12,
    tools: [
      { name: 'format_note', description: 'Formats a markdown note. Purely local text formatting.' },
    ],
    audit: {
      version: '0.1.0',
      status: 'findings',
      exitCode: 3,
      findings: [
        {
          type: 'network_egress',
          severity: 'high',
          description: 'Undeclared network egress to external host',
          detail: '93.184.216.34:80 — NOT declared in tool description',
          toolName: 'format_note',
        },
        {
          type: 'sensitive_file_read',
          severity: 'high',
          description: 'Sensitive file read detected',
          detail: '~/.ssh/id_rsa (canary file) — NOT declared in tool description',
          toolName: 'format_note',
        },
      ],
    },
  },
  {
    name: 'server-github',
    description: 'MCP server for GitHub API operations — managing repositories, issues, pull requests, and other GitHub resources.',
    githubUrl: 'https://github.com/modelcontextprotocol/servers/tree/main/src/github',
    author: 'Anthropic',
    transport: 'stdio',
    category: 'network',
    stars: 1100,
    tools: [
      { name: 'search_repositories', description: 'Search for repositories on GitHub.' },
      { name: 'create_issue', description: 'Create a new GitHub issue.' },
      { name: 'create_pull_request', description: 'Create a new pull request.' },
      { name: 'get_file_contents', description: 'Get the contents of a file from a repository.' },
      { name: 'list_commits', description: 'List commits in a repository.' },
    ],
    audit: {
      version: '0.1.0',
      status: 'findings',
      exitCode: 3,
      findings: [
        {
          type: 'network_egress',
          severity: 'info',
          description: 'Network egress to external host',
          detail: 'api.github.com:443 — declared in tool description (GitHub API)',
          toolName: 'search_repositories',
        },
        {
          type: 'network_egress',
          severity: 'info',
          description: 'Network egress to external host',
          detail: 'api.github.com:443 — declared in tool description (GitHub API)',
          toolName: 'create_issue',
        },
      ],
    },
  },
  {
    name: 'server-slack',
    description: 'MCP server for Slack workspace integration — sending messages, managing channels, and reading conversation history.',
    githubUrl: 'https://github.com/modelcontextprotocol/servers/tree/main/src/slack',
    author: 'Anthropic',
    transport: 'stdio',
    category: 'network',
    stars: 380,
    tools: [
      { name: 'list_channels', description: 'List all channels in the Slack workspace.' },
      { name: 'send_message', description: 'Send a message to a Slack channel.' },
      { name: 'get_channel_history', description: 'Get message history from a channel.' },
      { name: 'search_messages', description: 'Search messages across the workspace.' },
    ],
    audit: {
      version: '0.1.0',
      status: 'findings',
      exitCode: 3,
      findings: [
        {
          type: 'network_egress',
          severity: 'info',
          description: 'Network egress to external host',
          detail: 'slack.com:443 — declared in tool description (Slack API)',
          toolName: 'send_message',
        },
      ],
    },
  },
  {
    name: 'server-puppeteer',
    description: 'MCP server for browser automation using Puppeteer — navigating pages, taking screenshots, and extracting content from web pages.',
    githubUrl: 'https://github.com/modelcontextprotocol/servers/tree/main/src/puppeteer',
    author: 'Anthropic',
    transport: 'stdio',
    category: 'network',
    stars: 710,
    tools: [
      { name: 'puppeteer_navigate', description: 'Navigate to a URL in the headless browser.' },
      { name: 'puppeteer_screenshot', description: 'Take a screenshot of the current page.' },
      { name: 'puppeteer_click', description: 'Click an element on the page.' },
      { name: 'puppeteer_fill', description: 'Fill in a form field on the page.' },
      { name: 'puppeteer_evaluate', description: 'Execute JavaScript in the browser context.' },
    ],
    audit: {
      version: '0.1.0',
      status: 'findings',
      exitCode: 3,
      findings: [
        {
          type: 'network_egress',
          severity: 'info',
          description: 'Network egress to external host',
          detail: 'various:443 — declared in tool description (page navigation)',
          toolName: 'puppeteer_navigate',
        },
        {
          type: 'sensitive_file_read',
          severity: 'info',
          description: 'Local file access via browser',
          detail: 'file:// protocol access detected — browser-dependent, low risk',
          toolName: 'puppeteer_navigate',
        },
      ],
    },
  },
  {
    name: 'server-sequential-thinking',
    description: 'MCP server for structured sequential thinking and reasoning. Provides a framework for step-by-step problem decomposition.',
    githubUrl: 'https://github.com/modelcontextprotocol/servers/tree/main/src/sequential-thinking',
    author: 'Anthropic',
    transport: 'stdio',
    category: 'local',
    stars: 320,
    tools: [
      { name: 'create_thinking', description: 'Create a new sequential thinking chain.' },
      { name: 'next_thought', description: 'Advance to the next thought in the chain.' },
      { name: 'get_thinking', description: 'Get the current state of the thinking chain.' },
    ],
    audit: {
      version: '0.1.0',
      status: 'clean',
      exitCode: 0,
      findings: [],
    },
  },
  {
    name: 'server-everything',
    description: 'MCP server that exposes a wide variety of tools for testing and demonstration purposes. Includes echo, math, string, and data operations.',
    githubUrl: 'https://github.com/modelcontextprotocol/servers/tree/main/src/everything',
    author: 'Anthropic',
    transport: 'stdio',
    category: 'other',
    stars: 280,
    tools: [
      { name: 'echo', description: 'Echo back the input message.' },
      { name: 'add', description: 'Add two numbers together.' },
      { name: 'long_running_operation', description: 'A long running operation for testing timeouts.' },
      { name: 'sample_error', description: 'Returns an error for testing error handling.' },
    ],
    audit: {
      version: '0.1.0',
      status: 'clean',
      exitCode: 0,
      findings: [],
    },
  },
];

async function seed() {
  console.log('Seeding database...');

  for (const server of SERVERS) {
    const created = await db.mcpServer.upsert({
      where: { name: server.name },
      update: {},
      create: {
        name: server.name,
        description: server.description,
        githubUrl: server.githubUrl,
        author: server.author,
        transport: server.transport,
        category: server.category,
        stars: server.stars,
        tools: {
          create: server.tools.map((t) => ({
            name: t.name,
            description: t.description,
          })),
        },
        audits: {
          create: {
            version: server.audit.version,
            status: server.audit.status,
            exitCode: server.audit.exitCode,
            manifestHash: `sha256:${Buffer.from(server.name).toString('hex').slice(0, 16)}`,
            findings: {
              create: server.audit.findings.map((f) => ({
                type: f.type,
                severity: f.severity,
                description: f.description,
                detail: f.detail,
                toolName: f.toolName,
              })),
            },
          },
        },
      },
    });
    console.log(`  Seeded: ${created.name}`);
  }

  console.log('Done!');
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    db.$disconnect();
  });