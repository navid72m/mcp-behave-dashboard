import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get('server') || '';

  if (!name) {
    return new Response('Missing server parameter', { status: 400 });
  }

  const server = await db.mcpServer.findUnique({
    where: { name },
    include: {
      audits: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: { findings: true },
      },
    },
  });

  if (!server || !server.audits[0]) {
    return new Response('Server or audit not found', { status: 404 });
  }

  const audit = server.audits[0];
  const highCount = audit.findings.filter((f) => f.severity === 'high').length;
  const infoCount = audit.findings.filter((f) => f.severity === 'info').length;

  let status: string;
  let color: string;
  let statusColor: string;

  if (audit.status === 'clean') {
    status = 'clean';
    color = '#00e676';
    statusColor = '#00e676';
  } else if (highCount > 0) {
    status = `${highCount} high + ${infoCount} info`;
    color = '#ff5252';
    statusColor = '#ff5252';
  } else {
    status = `${infoCount} info`;
    color = '#ffc107';
    statusColor = '#ffc107';
  }

  const label = 'mcp-behave';
  const labelWidth = label.length * 6.5 + 16;
  const statusWidth = status.length * 6.5 + 16;
  const totalWidth = labelWidth + statusWidth;
  const height = 20;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${height}">
  <linearGradient id="a" x2="0" y2="1">
    <stop offset="0" stop-opacity=".1" stop-color="#000"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <rect rx="3" width="${totalWidth}" height="${height}" fill="#333"/>
  <rect rx="3" x="${labelWidth}" width="${statusWidth}" height="${height}" fill="${color}"/>
  <rect x="1" y="1" width="${labelWidth - 2}" height="${height - 2}" rx="2" fill="url(#a)"/>
  <g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="11">
    <text x="${labelWidth / 2}" y="14">${label}</text>
    <text x="${labelWidth + statusWidth / 2}" y="14" fill="#000">${status}</text>
  </g>
</svg>`;

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}