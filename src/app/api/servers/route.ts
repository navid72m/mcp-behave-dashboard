import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || 'all';
  const sort = searchParams.get('sort') || 'stars';

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { description: { contains: search } },
      { author: { contains: search } },
    ];
  }
  if (category && category !== 'all') {
    where.category = category;
  }

  const orderBy: Record<string, string> = {};
  if (sort === 'stars') orderBy.stars = 'desc';
  else if (sort === 'name') orderBy.name = 'asc';
  else if (sort === 'findings') orderBy.createdAt = 'desc';
  else orderBy.stars = 'desc';

  const servers = await db.mcpServer.findMany({
    where,
    orderBy,
    include: {
      audits: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: {
          findings: true,
          submittedBy: {
            select: { login: true, name: true, image: true },
          },
        },
      },
      tools: true,
    },
  });

  const enriched = servers.map((s) => {
    const latestAudit = s.audits[0];
    const findings = latestAudit?.findings || [];
    const highFindings = findings.filter((f) => f.severity === 'high');
    const infoFindings = findings.filter((f) => f.severity === 'info');

    return {
      id: s.id,
      name: s.name,
      description: s.description,
      githubUrl: s.githubUrl,
      author: s.author,
      transport: s.transport,
      category: s.category,
      stars: s.stars,
      toolCount: s.tools.length,
      latestAudit: latestAudit
        ? {
            id: latestAudit.id,
            version: latestAudit.version,
            status: latestAudit.status,
            exitCode: latestAudit.exitCode,
            createdAt: latestAudit.createdAt,
            manifestHash: latestAudit.manifestHash,
            submittedBy: latestAudit.submittedBy
              ? {
                  login: latestAudit.submittedBy.login,
                  name: latestAudit.submittedBy.name,
                  image: latestAudit.submittedBy.image,
                }
              : null,
          }
        : null,
      highFindings: highFindings.length,
      infoFindings: infoFindings.length,
      totalFindings: findings.length,
      findings: findings.map((f) => ({
        id: f.id,
        type: f.type,
        severity: f.severity,
        description: f.description,
        detail: f.detail,
        toolName: f.toolName,
      })),
      tools: s.tools.map((t) => ({
        name: t.name,
        description: t.description,
      })),
    };
  });

  return NextResponse.json(enriched);
}