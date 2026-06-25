import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const server = await db.mcpServer.findUnique({
    where: { id },
    include: {
      audits: {
        orderBy: { createdAt: 'desc' },
        include: { findings: true },
      },
      tools: true,
    },
  });

  if (!server) {
    return NextResponse.json({ error: 'Server not found' }, { status: 404 });
  }

  const enriched = {
    id: server.id,
    name: server.name,
    description: server.description,
    githubUrl: server.githubUrl,
    npmPackage: server.npmPackage,
    author: server.author,
    transport: server.transport,
    category: server.category,
    stars: server.stars,
    createdAt: server.createdAt,
    tools: server.tools.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema,
    })),
    audits: server.audits.map((a) => ({
      id: a.id,
      version: a.version,
      status: a.status,
      exitCode: a.exitCode,
      manifestHash: a.manifestHash,
      createdAt: a.createdAt,
      findings: a.findings.map((f) => ({
        id: f.id,
        type: f.type,
        severity: f.severity,
        description: f.description,
        detail: f.detail,
        toolName: f.toolName,
      })),
    })),
  };

  return NextResponse.json(enriched);
}