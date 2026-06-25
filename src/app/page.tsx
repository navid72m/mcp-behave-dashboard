"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Shield,
  Search,
  ExternalLink,
  GitFork,
  AlertTriangle,
  CheckCircle2,
  Info,
  XCircle,
  ArrowUpDown,
  Star,
  Terminal,
  Eye,
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  Globe,
  Database,
  HardDrive,
  Layers,
  BarChart3,
  ArrowUpRight,
  Github,
  Package,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Finding {
  id: string;
  type: string;
  severity: string;
  description: string;
  detail: string;
  toolName: string;
}

interface Tool {
  name: string;
  description: string;
}

interface SubmittedBy {
  login: string;
  name: string | null;
  image: string | null;
}

interface Audit {
  id: string;
  version: string;
  status: string;
  exitCode: number;
  createdAt: string;
  manifestHash: string;
  submittedBy: SubmittedBy | null;
}

interface Server {
  id: string;
  name: string;
  description: string;
  githubUrl: string | null;
  author: string | null;
  transport: string;
  category: string;
  stars: number;
  toolCount: number;
  latestAudit: Audit | null;
  highFindings: number;
  infoFindings: number;
  totalFindings: number;
  findings: Finding[];
  tools: Tool[];
}

interface Stats {
  totalServers: number;
  cleanServers: number;
  serversWithFindings: number;
  totalFindings: number;
  highFindings: number;
  infoFindings: number;
  totalTools: number;
  categories: { name: string; count: number }[];
  findingTypes: { type: string; count: number }[];
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const severityConfig: Record<string, { label: string; color: string; icon: React.ElementType; dotClass: string }> = {
  high: {
    label: "HIGH",
    color: "text-red-500",
    icon: XCircle,
    dotClass: "bg-red-500",
  },
  info: {
    label: "INFO",
    color: "text-amber-500",
    icon: Info,
    dotClass: "bg-amber-500",
  },
};

const categoryIcons: Record<string, React.ElementType> = {
  network: Globe,
  local: HardDrive,
  database: Database,
  other: Layers,
};

const categoryLabels: Record<string, string> = {
  all: "All Categories",
  network: "Network",
  local: "Local / File",
  database: "Database",
  other: "Other",
};

function HeaderAuth() {
  const { data: session, status } = useSession();
  if (status === "loading") return null;
  const user = session?.user as
    | { name?: string | null; image?: string | null; login?: string }
    | undefined;
  if (!user) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="h-8 text-xs"
        onClick={() => signIn("github")}
      >
        <Github className="w-3.5 h-3.5 mr-1.5" />
        Sign in
      </Button>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <Link
        href="/settings"
        className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {user.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.image}
            alt=""
            className="w-6 h-6 rounded-full"
          />
        ) : (
          <Github className="w-4 h-4" />
        )}
        <span className="hidden sm:inline">@{user.login}</span>
      </Link>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 px-2 text-[11px] text-muted-foreground"
        onClick={() => signOut()}
      >
        Sign out
      </Button>
    </div>
  );
}

function SubmitterChip({
  submittedBy,
  size = "sm",
}: {
  submittedBy: SubmittedBy | null;
  size?: "sm" | "md";
}) {
  const avatarSize = size === "md" ? "w-5 h-5" : "w-4 h-4";
  const textSize = size === "md" ? "text-xs" : "text-[10px]";
  if (!submittedBy) {
    return (
      <span className={`inline-flex items-center gap-1 ${textSize} text-muted-foreground`}>
        <Shield className={avatarSize} />
        from seed
      </span>
    );
  }
  return (
    <a
      href={`https://github.com/${submittedBy.login}`}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className={`inline-flex items-center gap-1.5 ${textSize} text-muted-foreground hover:text-foreground transition-colors`}
    >
      {submittedBy.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={submittedBy.image}
          alt=""
          className={`${avatarSize} rounded-full`}
        />
      ) : (
        <Github className={avatarSize} />
      )}
      <span>by @{submittedBy.login}</span>
    </a>
  );
}

function typeLabel(type: string) {
  const map: Record<string, string> = {
    network_egress: "Network Egress",
    sensitive_file_read: "Sensitive File Read",
    rug_pull: "Rug Pull",
  };
  return map[type] || type;
}

/* ------------------------------------------------------------------ */
/*  Components                                                         */
/* ------------------------------------------------------------------ */

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
}) {
  return (
    <Card className="border-border/50">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center justify-center w-10 h-10 rounded-lg ${accent || "bg-muted"}`}
          >
            <Icon className="w-5 h-5 text-foreground" />
          </div>
          <div>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        </div>
        {sub && (
          <p className="text-[11px] text-muted-foreground mt-1 ml-[52px]">
            {sub}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status, highFindings, infoFindings }: { status: string; highFindings: number; infoFindings: number }) {
  if (status === "clean") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
        <CheckCircle2 className="w-3.5 h-3.5" />
        Clean
      </span>
    );
  }
  if (highFindings > 0) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-500 border border-red-500/20">
        <XCircle className="w-3.5 h-3.5" />
        {highFindings} high
        {infoFindings > 0 ? ` + ${infoFindings} info` : ""}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20">
      <AlertTriangle className="w-3.5 h-3.5" />
      {infoFindings} info
    </span>
  );
}

function ServerCard({
  server,
  onSelect,
  selected,
}: {
  server: Server;
  onSelect: (s: Server) => void;
  selected: boolean;
}) {
  const CatIcon = categoryIcons[server.category] || Layers;
  return (
    <Card
      className={`cursor-pointer transition-all duration-200 hover:shadow-md hover:border-foreground/20 ${
        selected ? "ring-2 ring-primary border-primary" : "border-border/50"
      }`}
      onClick={() => onSelect(server)}
    >
      <CardHeader className="pb-3 pt-4 px-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex items-center justify-center w-8 h-8 rounded-md bg-muted shrink-0">
              <CatIcon className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-sm font-semibold truncate">
                {server.name}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {server.author || "Unknown"}
              </p>
            </div>
          </div>
          <StatusBadge
            status={server.latestAudit?.status || "unknown"}
            highFindings={server.highFindings}
            infoFindings={server.infoFindings}
          />
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0 space-y-3">
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
          {server.description}
        </p>
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Star className="w-3 h-3" /> {server.stars}
          </span>
          <span className="flex items-center gap-1">
            <Package className="w-3 h-3" /> {server.toolCount} tools
          </span>
          <span className="flex items-center gap-1">
            <Terminal className="w-3 h-3" /> {server.transport}
          </span>
        </div>
        {server.latestAudit && (
          <div className="pt-0.5">
            <SubmitterChip submittedBy={server.latestAudit.submittedBy} />
          </div>
        )}
        {server.totalFindings > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {server.findings.slice(0, 3).map((f) => {
              const config = severityConfig[f.severity];
              return (
                <span
                  key={f.id}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium ${config.color} bg-muted`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${config.dotClass}`} />
                  {typeLabel(f.type)}
                </span>
              );
            })}
            {server.totalFindings > 3 && (
              <span className="text-[10px] text-muted-foreground">
                +{server.totalFindings - 3} more
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ServerDetailDialog({
  server,
  open,
  onClose,
}: {
  server: Server | null;
  open: boolean;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const badgeUrl = server
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/api/badge?server=${server.name}`
    : "";

  const copyBadge = useCallback(() => {
    const md = `[![mcp-behave](${badgeUrl})](https://github.com/navid72m/mcp-behave)`;
    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [badgeUrl]);

  if (!server) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <StatusBadge
              status={server.latestAudit?.status || "unknown"}
              highFindings={server.highFindings}
              infoFindings={server.infoFindings}
            />
            <DialogTitle className="text-lg">{server.name}</DialogTitle>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {server.description}
          </p>
          {server.latestAudit && (
            <div className="pt-1">
              <SubmitterChip
                submittedBy={server.latestAudit.submittedBy}
                size="md"
              />
            </div>
          )}
        </DialogHeader>

        <Tabs defaultValue="findings" className="mt-2">
          <TabsList className="w-full">
            <TabsTrigger value="findings" className="flex-1">
              Findings ({server.totalFindings})
            </TabsTrigger>
            <TabsTrigger value="tools" className="flex-1">
              Tools ({server.toolCount})
            </TabsTrigger>
            <TabsTrigger value="badge" className="flex-1">
              Badge
            </TabsTrigger>
          </TabsList>

          <TabsContent value="findings" className="mt-4 space-y-2">
            {server.totalFindings === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-2" />
                <p className="text-sm font-medium">No findings</p>
                <p className="text-xs">
                  This server passed all behavioral checks.
                </p>
              </div>
            ) : (
              server.findings.map((f) => {
                const config = severityConfig[f.severity];
                const Icon = config.icon;
                return (
                  <Card key={f.id} className="border-border/50">
                    <CardContent className="p-3">
                      <div className="flex items-start gap-3">
                        <Icon className={`w-4 h-4 mt-0.5 ${config.color} shrink-0`} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge
                              variant="outline"
                              className="text-[10px] h-5"
                            >
                              {typeLabel(f.type)}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={`text-[10px] h-5 ${config.color} border-current/30`}
                            >
                              {config.label}
                            </Badge>
                            {f.toolName && (
                              <code className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                {f.toolName}
                              </code>
                            )}
                          </div>
                          <p className="text-sm">{f.description}</p>
                          {f.detail && (
                            <p className="text-xs text-muted-foreground mt-1 font-mono bg-muted/50 px-2 py-1 rounded">
                              {f.detail}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>

          <TabsContent value="tools" className="mt-4 space-y-1.5">
            {server.tools.map((t, i) => (
              <div
                key={i}
                className="flex items-start gap-2.5 p-2 rounded-md hover:bg-muted/50"
              >
                <code className="text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded shrink-0">
                  {t.name}
                </code>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t.description}
                </p>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="badge" className="mt-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              Embed this trust badge in your MCP server&apos;s README to show
              your audit status:
            </p>
            <div className="flex items-center justify-center p-4 bg-muted/30 rounded-lg border border-border/50">
              {/* @ts-expect-error img is intentional for external SVG badge */}
              <img src={badgeUrl} alt="mcp-behave badge" />
            </div>
            <div className="relative">
              <code className="block text-xs bg-muted p-3 rounded-lg text-foreground break-all">
                [![mcp-behave]({badgeUrl})](https://github.com/navid72m/mcp-behave)
              </code>
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2 h-7 px-2"
                onClick={copyBadge}
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {server.githubUrl && (
          <div className="mt-4 pt-3 border-t border-border/50">
            <a
              href={server.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Github className="w-3.5 h-3.5" />
              View source on GitHub
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ComparisonPanel({ servers }: { servers: Server[] }) {
  const [a, setA] = useState<Server | null>(null);
  const [b, setB] = useState<Server | null>(null);
  const others = servers.filter(
    (s) => (!a || s.id !== a.id) && (!b || s.id !== b.id)
  );

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Select two servers to compare their behavioral audits side by side.
      </p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium mb-1.5 block">Server A</label>
          <Select
            value={a?.id || ""}
            onValueChange={(v) => setA(servers.find((s) => s.id === v) || null)}
          >
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder="Choose server..." />
            </SelectTrigger>
            <SelectContent>
              {others.map((s) => (
                <SelectItem key={s.id} value={s.id} className="text-xs">
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs font-medium mb-1.5 block">Server B</label>
          <Select
            value={b?.id || ""}
            onValueChange={(v) => setB(servers.find((s) => s.id === v) || null)}
          >
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder="Choose server..." />
            </SelectTrigger>
            <SelectContent>
              {others.map((s) => (
                <SelectItem key={s.id} value={s.id} className="text-xs">
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      {a && b && (
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-4">
              {[a, b].map((s) => (
                <div key={s.id} className="space-y-2">
                  <p className="font-semibold text-sm">{s.name}</p>
                  <StatusBadge
                    status={s.latestAudit?.status || "unknown"}
                    highFindings={s.highFindings}
                    infoFindings={s.infoFindings}
                  />
                  <div className="space-y-1 mt-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Tools</span>
                      <span>{s.toolCount}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">HIGH findings</span>
                      <span className={s.highFindings > 0 ? "text-red-500 font-medium" : ""}>
                        {s.highFindings}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">INFO findings</span>
                      <span className={s.infoFindings > 0 ? "text-amber-500" : ""}>
                        {s.infoFindings}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Separator className="my-3" />
            <div className="text-xs text-muted-foreground">
              {a.highFindings === 0 && b.highFindings === 0
                ? "Both servers passed behavioral audit with no high-severity findings."
                : a.highFindings > b.highFindings
                  ? `${a.name} has ${a.highFindings - b.highFindings} more HIGH finding(s) than ${b.name}.`
                  : b.highFindings > a.highFindings
                    ? `${b.name} has ${b.highFindings - a.highFindings} more HIGH finding(s) than ${a.name}.`
                    : "Both servers have the same number of HIGH findings."}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */

export default function Dashboard() {
  const [servers, setServers] = useState<Server[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("stars");
  const [selectedServer, setSelectedServer] = useState<Server | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [serversRes, statsRes] = await Promise.all([
          fetch("/api/servers"),
          fetch("/api/stats"),
        ]);
        const serversData = await serversRes.json();
        const statsData = await statsRes.json();
        setServers(serversData);
        setStats(statsData);
      } catch (e) {
        console.error("Failed to fetch data", e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const filteredServers = useMemo(() => {
    let result = [...servers];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          (s.author && s.author.toLowerCase().includes(q))
      );
    }
    if (category !== "all") {
      result = result.filter((s) => s.category === category);
    }
    if (sort === "stars") result.sort((a, b) => b.stars - a.stars);
    else if (sort === "name") result.sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === "findings")
      result.sort((a, b) => b.highFindings - a.highFindings || b.totalFindings - a.totalFindings);
    else if (sort === "tools") result.sort((a, b) => b.toolCount - a.toolCount);

    return result;
  }, [servers, search, category, sort]);

  const handleSelect = useCallback((server: Server) => {
    setSelectedServer(server);
    setDetailOpen(true);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      {/* ---- Header ---- */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/10">
              <Shield className="w-4.5 h-4.5 text-emerald-500" />
            </div>
            <span className="font-semibold text-sm tracking-tight">
              mcp-behave
            </span>
            <Badge variant="outline" className="text-[10px] h-5 font-normal">
              registry
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="https://github.com/navid72m/mcp-behave"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Github className="w-4 h-4" />
              <span className="hidden sm:inline">GitHub</span>
              <ArrowUpRight className="w-3 h-3" />
            </a>
            <HeaderAuth />
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8 w-full">
        {/* ---- Hero ---- */}
        <section className="text-center space-y-3 pt-4">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Behavioral Audit Registry
            <span className="text-muted-foreground"> for MCP Servers</span>
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Static scanners read tool descriptions.
            <br className="hidden sm:block" />
            <span className="font-medium text-foreground">
              mcp-behave watches behavior
            </span>{" "}
            — and now you can browse the results.
          </p>
          <div className="flex items-center justify-center gap-2 pt-2">
            <code className="text-xs bg-muted px-3 py-1.5 rounded-md font-mono">
              pip install mcp-behave
            </code>
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-8"
              onClick={() =>
                navigator.clipboard.writeText("pip install mcp-behave")
              }
            >
              <Copy className="w-3 h-3 mr-1" />
              Copy
            </Button>
          </div>
        </section>

        {/* ---- Stats ---- */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-lg" />
            ))}
          </div>
        ) : stats ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard
              icon={Layers}
              label="Servers Audited"
              value={stats.totalServers}
              sub={`${stats.cleanServers} clean, ${stats.serversWithFindings} with findings`}
              accent="bg-primary/10"
            />
            <StatCard
              icon={Package}
              label="Total Tools Probed"
              value={stats.totalTools}
              accent="bg-primary/10"
            />
            <StatCard
              icon={XCircle}
              label="HIGH Findings"
              value={stats.highFindings}
              sub="Undeclared / dangerous behavior"
              accent="bg-red-500/10"
            />
            <StatCard
              icon={Info}
              label="INFO Findings"
              value={stats.infoFindings}
              sub="Declared but observed"
              accent="bg-amber-500/10"
            />
          </div>
        ) : null}

        {/* ---- Filters ---- */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search servers by name, author, or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full sm:w-44 h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(categoryLabels).map(([k, v]) => (
                <SelectItem key={k} value={k} className="text-xs">
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-full sm:w-40 h-9 text-sm">
              <ArrowUpDown className="w-3.5 h-3.5 mr-1.5" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="stars" className="text-xs">
                Most Stars
              </SelectItem>
              <SelectItem value="findings" className="text-xs">
                Most Findings
              </SelectItem>
              <SelectItem value="tools" className="text-xs">
                Most Tools
              </SelectItem>
              <SelectItem value="name" className="text-xs">
                Name A-Z
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* ---- Category pills ---- */}
        {stats && (
          <div className="flex flex-wrap gap-2">
            {stats.categories.map((c) => (
              <button
                key={c.name}
                onClick={() =>
                  setCategory(category === c.name ? "all" : c.name)
                }
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  category === c.name
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {React.createElement(
                  categoryIcons[c.name] || Layers,
                  { className: "w-3 h-3" }
                )}
                {c.name}
                <span className="opacity-60">{c.count}</span>
              </button>
            ))}
          </div>
        )}

        {/* ---- Comparison toggle ---- */}
        <div className="flex items-center gap-2">
          <Button
            variant={showComparison ? "default" : "outline"}
            size="sm"
            className="text-xs h-8"
            onClick={() => setShowComparison(!showComparison)}
          >
            <BarChart3 className="w-3.5 h-3.5 mr-1.5" />
            Compare Servers
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-8"
            onClick={() => setShowComparison(false)}
          >
            <Eye className="w-3.5 h-3.5 mr-1.5" />
            View All
          </Button>
          {search && (
            <span className="text-xs text-muted-foreground">
              {filteredServers.length} result{filteredServers.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* ---- Comparison Panel ---- */}
        {showComparison && (
          <ComparisonPanel servers={servers} />
        )}

        {/* ---- Server Grid ---- */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-44 rounded-lg" />
            ))}
          </div>
        ) : showComparison ? null : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredServers.map((server) => (
              <ServerCard
                key={server.id}
                server={server}
                onSelect={handleSelect}
                selected={selectedServer?.id === server.id}
              />
            ))}
          </div>
        )}

        {filteredServers.length === 0 && !loading && (
          <div className="text-center py-12 text-muted-foreground">
            <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No servers match your search.</p>
            <Button
              variant="link"
              className="text-xs mt-1"
              onClick={() => {
                setSearch("");
                setCategory("all");
              }}
            >
              Clear filters
            </Button>
          </div>
        )}

        {/* ---- How It Works ---- */}
        <section className="border-t border-border/50 pt-8 space-y-6">
          <h2 className="text-lg font-semibold text-center">
            How mcp-behave Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-border/50">
              <CardContent className="p-5 text-center space-y-3">
                <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                  <Terminal className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-sm">1. Launch & Trace</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Runs the MCP server under{" "}
                  <code className="bg-muted px-1 rounded">strace</code>,
                  exercising every tool, resource, and prompt it advertises.
                  Captures syscalls at the kernel level.
                </p>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="p-5 text-center space-y-3">
                <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                  <Eye className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-sm">2. Compare & Detect</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Compares the declared manifest against actual runtime behavior.
                  Detects undeclared network egress, sensitive file access, and
                  manifest rug-pulls between runs.
                </p>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="p-5 text-center space-y-3">
                <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-sm">3. Report & Enforce</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Outputs structured findings with severity levels. Use{" "}
                  <code className="bg-muted px-1 rounded">--json --fail-on high</code>{" "}
                  in CI to enforce behavioral policies automatically.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      {/* ---- Footer ---- */}
      <footer className="border-t border-border/50 mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5" />
            <span>mcp-behave registry</span>
            <span className="opacity-50">·</span>
            <span>Runtime behavioral audits for MCP servers</span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/navid72m/mcp-behave"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              GitHub
            </a>
            <a
              href="https://pypi.org/project/mcp-behave/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              PyPI
            </a>
          </div>
        </div>
      </footer>

      {/* ---- Detail Dialog ---- */}
      <ServerDetailDialog
        server={selectedServer}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
      />
    </div>
  );
}