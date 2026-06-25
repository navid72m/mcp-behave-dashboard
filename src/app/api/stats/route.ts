import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  const totalServers = await db.mcpServer.count();
  const cleanServers = await db.mcpServer.count({
    where: {
      audits: {
        some: { status: 'clean' },
      },
    },
  });
  const totalFindings = await db.finding.count();
  const highFindings = await db.finding.count({
    where: { severity: 'high' },
  });
  const infoFindings = await db.finding.count({
    where: { severity: 'info' },
  });
  const totalTools = await db.toolManifest.count();

  const categories = await db.mcpServer.groupBy({
    by: ['category'],
    _count: true,
  });

  const findingTypes = await db.finding.groupBy({
    by: ['type'],
    _count: true,
  });

  return NextResponse.json({
    totalServers,
    cleanServers,
    serversWithFindings: totalServers - cleanServers,
    totalFindings,
    highFindings,
    infoFindings,
    totalTools,
    categories: categories.map((c) => ({
      name: c.category,
      count: c._count,
    })),
    findingTypes: findingTypes.map((f) => ({
      type: f.type,
      count: f._count,
    })),
  });
}