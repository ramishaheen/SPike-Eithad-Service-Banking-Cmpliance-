import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  Building2,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileSearch,
  Filter,
  Gavel,
  Globe2,
  LayoutDashboard,
  MapPin,
  Newspaper,
  Search,
  Settings,
  Shield,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
  Zap,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip as UTooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  accounts,
  detectionTrend,
  riskDistribution,
  type ChangeType,
  type CorporateAccount,
  type KycStatus,
  type RiskLevel,
} from "@/lib/kyc-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sentinel KYC — AI Change Detection for Corporate Accounts" },
      {
        name: "description",
        content:
          "AI-powered KYC monitoring that detects significant changes in corporate accounts and triggers timely refresh cycles.",
      },
      { property: "og:title", content: "Sentinel KYC" },
      {
        property: "og:description",
        content:
          "Detect ownership, sanctions, and adverse-media changes across your corporate book in real time.",
      },
    ],
  }),
  component: Dashboard,
});

/* ---------------- helpers ---------------- */

const riskTone: Record<RiskLevel, string> = {
  low: "bg-success/15 text-success border-success/30",
  medium: "bg-warning/15 text-[oklch(0.55_0.16_75)] border-warning/30",
  high: "bg-[oklch(0.7_0.18_35)]/15 text-[oklch(0.55_0.2_35)] border-[oklch(0.7_0.18_35)]/30",
  critical: "bg-danger/15 text-danger border-danger/40",
};

const statusTone: Record<KycStatus, string> = {
  current: "bg-success/15 text-success border-success/30",
  due_soon: "bg-warning/15 text-[oklch(0.55_0.16_75)] border-warning/30",
  overdue: "bg-danger/15 text-danger border-danger/40",
  in_review: "bg-info/15 text-info border-info/30",
};

const statusLabel: Record<KycStatus, string> = {
  current: "Current",
  due_soon: "Due Soon",
  overdue: "Overdue",
  in_review: "In Review",
};

const changeIcon: Record<ChangeType, React.ElementType> = {
  ownership: Users,
  directors: Users,
  address: MapPin,
  sanctions: ShieldAlert,
  litigation: Gavel,
  financials: TrendingUp,
  industry: Building2,
  media: Newspaper,
};

const fmtMoney = (n: number) =>
  n >= 1e9 ? `$${(n / 1e9).toFixed(1)}B` : n >= 1e6 ? `$${(n / 1e6).toFixed(1)}M` : `$${n.toLocaleString()}`;

/* ---------------- main ---------------- */

function Dashboard() {
  const [selected, setSelected] = useState<CorporateAccount | null>(null);
  const [query, setQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState<"all" | RiskLevel>("all");

  const filtered = useMemo(() => {
    return accounts.filter((a) => {
      const q = query.toLowerCase();
      const matchQ =
        !q ||
        a.legalName.toLowerCase().includes(q) ||
        a.id.toLowerCase().includes(q) ||
        a.industry.toLowerCase().includes(q);
      const matchR = riskFilter === "all" || a.riskLevel === riskFilter;
      return matchQ && matchR;
    });
  }, [query, riskFilter]);

  const stats = useMemo(() => {
    const totalChanges = accounts.reduce((s, a) => s + a.changes.length, 0);
    const critical = accounts.filter((a) => a.riskLevel === "critical").length;
    const overdue = accounts.filter((a) => a.kycStatus === "overdue").length;
    const exposure = accounts.reduce((s, a) => s + a.exposureUSD, 0);
    return { totalChanges, critical, overdue, exposure };
  }, []);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-h-screen bg-background text-foreground flex">
        <SideNav />
        <main className="flex-1 min-w-0">
          <TopBar />
          <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
            <Hero stats={stats} />

            <div className="grid grid-cols-12 gap-6">
              <DetectionTrendCard />
              <RiskMixCard />
              <AIInsightCard />
            </div>

            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-12 xl:col-span-8 space-y-6">
                <AccountsTable
                  data={filtered}
                  query={query}
                  setQuery={setQuery}
                  riskFilter={riskFilter}
                  setRiskFilter={setRiskFilter}
                  onSelect={setSelected}
                />
              </div>
              <div className="col-span-12 xl:col-span-4 space-y-6">
                <LiveFeed onSelect={setSelected} />
                <ReviewQueue onSelect={setSelected} />
              </div>
            </div>

            <footer className="text-xs text-muted-foreground text-center py-4">
              Sentinel KYC · AI-assisted monitoring · Decisions remain with the compliance officer.
            </footer>
          </div>
        </main>

        <AccountDrawer account={selected} onClose={() => setSelected(null)} />
      </div>
    </TooltipProvider>
  );
}

/* ---------------- nav ---------------- */

function SideNav() {
  const items = [
    { icon: LayoutDashboard, label: "Overview", active: true },
    { icon: Building2, label: "Accounts" },
    { icon: ShieldAlert, label: "Alerts", badge: 12 },
    { icon: FileSearch, label: "Reviews", badge: 4 },
    { icon: Activity, label: "Detections" },
    { icon: Globe2, label: "Sources" },
    { icon: Settings, label: "Settings" },
  ];
  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      <div className="px-5 py-5 flex items-center gap-2.5 border-b border-sidebar-border">
        <div
          className="w-9 h-9 rounded-lg grid place-items-center text-sidebar-primary-foreground"
          style={{ background: "var(--gradient-accent)" }}
        >
          <Shield className="w-5 h-5" />
        </div>
        <div>
          <div className="font-semibold leading-tight">Sentinel KYC</div>
          <div className="text-[11px] text-sidebar-foreground/60">Northbridge Bank · Risk</div>
        </div>
      </div>
      <nav className="p-3 space-y-1">
        {items.map((it) => (
          <button
            key={it.label}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
              it.active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
            )}
          >
            <it.icon className="w-4 h-4" />
            <span className="flex-1 text-left">{it.label}</span>
            {it.badge && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-sidebar-primary text-sidebar-primary-foreground font-semibold">
                {it.badge}
              </span>
            )}
          </button>
        ))}
      </nav>
      <div className="mt-auto p-4">
        <div className="rounded-lg p-3 bg-sidebar-accent/50 border border-sidebar-border">
          <div className="flex items-center gap-2 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5 text-sidebar-primary" />
            AI Engine: Nano-Banana v3
          </div>
          <div className="mt-1 text-[11px] text-sidebar-foreground/60">
            247 sources monitored · last sync 2 min ago
          </div>
          <div className="mt-2 h-1 rounded-full bg-sidebar-border overflow-hidden">
            <div className="h-full w-[82%]" style={{ background: "var(--gradient-accent)" }} />
          </div>
        </div>
      </div>
    </aside>
  );
}

function TopBar() {
  return (
    <header className="sticky top-0 z-20 backdrop-blur bg-background/80 border-b border-border">
      <div className="max-w-[1600px] mx-auto px-6 h-14 flex items-center gap-3">
        <div className="md:hidden flex items-center gap-2">
          <Shield className="w-5 h-5 text-accent" />
          <span className="font-semibold">Sentinel</span>
        </div>
        <div className="hidden md:block text-sm text-muted-foreground">
          <span className="text-foreground font-medium">Overview</span>
          <ChevronRight className="inline w-3.5 h-3.5 mx-1 opacity-50" />
          Corporate accounts
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="hidden md:flex items-center gap-2 text-xs px-2.5 py-1.5 rounded-md bg-success/10 text-success border border-success/30">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            Live · monitoring 682 accounts
          </div>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-danger" />
          </Button>
          <div className="w-8 h-8 rounded-full grid place-items-center text-xs font-semibold text-primary-foreground"
               style={{ background: "var(--gradient-primary)" }}>
            AO
          </div>
        </div>
      </div>
    </header>
  );
}

/* ---------------- hero / KPIs ---------------- */

function Hero({ stats }: { stats: { totalChanges: number; critical: number; overdue: number; exposure: number } }) {
  return (
    <section className="grid grid-cols-12 gap-6">
      <Card className="col-span-12 lg:col-span-5 p-6 relative overflow-hidden border-0 text-primary-foreground"
            style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-elegant)" }}>
        <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full opacity-20"
             style={{ background: "var(--gradient-accent)" }} />
        <Badge className="bg-white/15 text-white border-white/20 hover:bg-white/15">
          <Sparkles className="w-3 h-3 mr-1" /> AI Briefing · Today
        </Badge>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">
          3 corporate accounts need attention before EOD
        </h1>
        <p className="mt-2 text-sm text-white/75 leading-relaxed">
          Nano-Banana detected ownership and sanctions deltas across Meridian Logistics, BlueRock Maritime, and Halcyon Capital.
          Estimated review effort: <span className="font-medium text-white">2h 40m</span>.
        </p>
        <div className="mt-5 flex items-center gap-2">
          <Button className="bg-white text-primary hover:bg-white/90">Start triage</Button>
          <Button variant="ghost" className="text-white hover:bg-white/10">View report</Button>
        </div>
      </Card>

      <div className="col-span-12 lg:col-span-7 grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={Zap} label="Detections (7d)" value={stats.totalChanges.toString()} delta="+18%" up tint="accent" />
        <KpiCard icon={ShieldAlert} label="Critical accounts" value={stats.critical.toString()} delta="+1" up tint="danger" />
        <KpiCard icon={Clock} label="KYC overdue" value={stats.overdue.toString()} delta="-2" up={false} tint="warning" />
        <KpiCard icon={Wallet} label="Exposure monitored" value={fmtMoney(stats.exposure)} delta="+3.4%" up tint="info" />
      </div>
    </section>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  delta,
  up,
  tint,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  delta: string;
  up: boolean;
  tint: "accent" | "danger" | "warning" | "info";
}) {
  const bg: Record<typeof tint, string> = {
    accent: "bg-accent/15 text-accent",
    danger: "bg-danger/15 text-danger",
    warning: "bg-warning/20 text-[oklch(0.55_0.16_75)]",
    info: "bg-info/15 text-info",
  };
  return (
    <Card className="p-4 border-border/60 hover:shadow-[var(--shadow-soft)] transition-shadow">
      <div className="flex items-start justify-between">
        <div className={cn("w-9 h-9 rounded-lg grid place-items-center", bg[tint])}>
          <Icon className="w-4 h-4" />
        </div>
        <span className={cn(
          "text-xs flex items-center gap-0.5 font-medium",
          up ? "text-success" : "text-danger",
        )}>
          {up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {delta}
        </span>
      </div>
      <div className="mt-3 text-2xl font-semibold tracking-tight">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </Card>
  );
}

/* ---------------- charts ---------------- */

function DetectionTrendCard() {
  return (
    <Card className="col-span-12 lg:col-span-7 p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="text-sm font-semibold">Change detections — last 7 days</div>
          <div className="text-xs text-muted-foreground">
            Stacked by severity. AI confidence avg <span className="text-foreground font-medium">87%</span>.
          </div>
        </div>
        <Tabs defaultValue="7d">
          <TabsList className="h-8">
            <TabsTrigger value="7d" className="text-xs h-6">7D</TabsTrigger>
            <TabsTrigger value="30d" className="text-xs h-6">30D</TabsTrigger>
            <TabsTrigger value="90d" className="text-xs h-6">90D</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <div className="h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={detectionTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="g-crit" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--danger)" stopOpacity={0.7} />
                <stop offset="100%" stopColor="var(--danger)" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="g-high" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="oklch(0.7 0.18 35)" stopOpacity={0.6} />
                <stop offset="100%" stopColor="oklch(0.7 0.18 35)" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="g-med" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--warning)" stopOpacity={0.6} />
                <stop offset="100%" stopColor="var(--warning)" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="g-low" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.5} />
                <stop offset="100%" stopColor="var(--accent)" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                background: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Area type="monotone" dataKey="low" stackId="1" stroke="var(--accent)" fill="url(#g-low)" />
            <Area type="monotone" dataKey="medium" stackId="1" stroke="var(--warning)" fill="url(#g-med)" />
            <Area type="monotone" dataKey="high" stackId="1" stroke="oklch(0.7 0.18 35)" fill="url(#g-high)" />
            <Area type="monotone" dataKey="critical" stackId="1" stroke="var(--danger)" fill="url(#g-crit)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

function RiskMixCard() {
  const total = riskDistribution.reduce((s, r) => s + r.value, 0);
  return (
    <Card className="col-span-12 md:col-span-6 lg:col-span-5 xl:col-span-3 p-5">
      <div className="text-sm font-semibold">Portfolio risk mix</div>
      <div className="text-xs text-muted-foreground mb-2">{total} corporate accounts</div>
      <div className="h-[150px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={riskDistribution} dataKey="value" innerRadius={42} outerRadius={60} paddingAngle={3}>
              {riskDistribution.map((e, i) => (
                <Cell key={i} fill={e.color} stroke="var(--card)" strokeWidth={2} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="space-y-1.5">
        {riskDistribution.map((r) => (
          <div key={r.name} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-sm" style={{ background: r.color }} />
              <span className="text-muted-foreground">{r.name}</span>
            </div>
            <span className="font-medium tabular-nums">{r.value}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function AIInsightCard() {
  const insights = [
    { icon: ShieldAlert, tone: "danger", text: "Sanctions exposure rose 12% in Maritime portfolio (AIS anomalies)." },
    { icon: Users, tone: "warning", text: "4 UBOs crossed 25% threshold this week — refresh required." },
    { icon: Newspaper, tone: "info", text: "Adverse media spike in EU pharma — 9 accounts under watch." },
  ];
  return (
    <Card className="col-span-12 md:col-span-6 lg:col-span-12 xl:col-span-2 p-5 relative overflow-hidden">
      <div className="absolute inset-0 opacity-50 pointer-events-none" style={{ background: "var(--gradient-surface)" }} />
      <div className="relative">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Sparkles className="w-4 h-4 text-accent" />
          AI insights
        </div>
        <div className="text-[11px] text-muted-foreground mb-3">Synthesized from 7d signals</div>
        <ul className="space-y-2.5">
          {insights.map((i, idx) => (
            <li key={idx} className="flex gap-2 text-xs leading-snug">
              <i.icon className={cn(
                "w-3.5 h-3.5 shrink-0 mt-0.5",
                i.tone === "danger" && "text-danger",
                i.tone === "warning" && "text-[oklch(0.55_0.16_75)]",
                i.tone === "info" && "text-info",
              )} />
              <span>{i.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}

/* ---------------- accounts table ---------------- */

function AccountsTable({
  data,
  query,
  setQuery,
  riskFilter,
  setRiskFilter,
  onSelect,
}: {
  data: CorporateAccount[];
  query: string;
  setQuery: (s: string) => void;
  riskFilter: "all" | RiskLevel;
  setRiskFilter: (r: "all" | RiskLevel) => void;
  onSelect: (a: CorporateAccount) => void;
}) {
  const filters: Array<{ key: "all" | RiskLevel; label: string }> = [
    { key: "all", label: "All" },
    { key: "critical", label: "Critical" },
    { key: "high", label: "High" },
    { key: "medium", label: "Medium" },
    { key: "low", label: "Low" },
  ];

  return (
    <Card className="overflow-hidden">
      <div className="p-5 flex flex-wrap items-center gap-3 border-b border-border">
        <div>
          <div className="text-sm font-semibold">Corporate accounts</div>
          <div className="text-xs text-muted-foreground">
            {data.length} of {accounts.length} shown · sorted by risk
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, ID, industry"
              className="h-9 pl-8 w-64"
            />
          </div>
          <Button variant="outline" size="sm" className="h-9">
            <Filter className="w-3.5 h-3.5 mr-1.5" /> Filters
          </Button>
        </div>
      </div>

      <div className="px-5 py-2.5 flex items-center gap-1.5 border-b border-border bg-muted/30">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setRiskFilter(f.key)}
            className={cn(
              "text-xs px-2.5 py-1 rounded-full border transition-colors",
              riskFilter === f.key
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs text-muted-foreground bg-muted/20">
            <tr>
              <th className="text-left font-medium px-5 py-2.5">Account</th>
              <th className="text-left font-medium px-3 py-2.5">Risk</th>
              <th className="text-left font-medium px-3 py-2.5">KYC</th>
              <th className="text-left font-medium px-3 py-2.5">Next review</th>
              <th className="text-left font-medium px-3 py-2.5">Changes</th>
              <th className="text-right font-medium px-5 py-2.5">Exposure</th>
            </tr>
          </thead>
          <tbody>
            {[...data].sort((a, b) => b.riskScore - a.riskScore).map((a) => (
              <tr
                key={a.id}
                onClick={() => onSelect(a)}
                className="border-t border-border hover:bg-muted/40 cursor-pointer transition-colors"
              >
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-md grid place-items-center text-xs font-semibold text-primary-foreground"
                         style={{ background: "var(--gradient-primary)" }}>
                      {a.legalName.split(" ").slice(0, 2).map((w) => w[0]).join("")}
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium truncate">{a.legalName}</div>
                      <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                        <span>{a.id}</span>·<span>{a.industry}</span>·
                        <Globe2 className="w-3 h-3" />{a.country}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <RiskMeter score={a.riskScore} level={a.riskLevel} />
                  </div>
                </td>
                <td className="px-3 py-3">
                  <Badge variant="outline" className={cn("text-[10px] font-medium", statusTone[a.kycStatus])}>
                    {statusLabel[a.kycStatus]}
                  </Badge>
                </td>
                <td className="px-3 py-3 text-xs">
                  <div className={cn(a.kycStatus === "overdue" && "text-danger font-medium")}>
                    {a.nextReview}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    Last: {a.lastReview}
                  </div>
                </td>
                <td className="px-3 py-3">
                  {a.changes.length === 0 ? (
                    <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-success" /> No deltas
                    </span>
                  ) : (
                    <div className="flex items-center gap-1">
                      {a.changes.slice(0, 3).map((c) => {
                        const Icon = changeIcon[c.type];
                        return (
                          <UTooltip key={c.id}>
                            <TooltipTrigger asChild>
                              <span className={cn(
                                "w-6 h-6 rounded grid place-items-center border",
                                riskTone[c.severity],
                              )}>
                                <Icon className="w-3 h-3" />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                              <div className="text-xs font-medium capitalize">{c.type} · {c.severity}</div>
                              <div className="text-[11px] opacity-80">{c.summary}</div>
                            </TooltipContent>
                          </UTooltip>
                        );
                      })}
                      {a.changes.length > 3 && (
                        <span className="text-[10px] text-muted-foreground ml-1">+{a.changes.length - 3}</span>
                      )}
                    </div>
                  )}
                </td>
                <td className="px-5 py-3 text-right tabular-nums font-medium">{fmtMoney(a.exposureUSD)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function RiskMeter({ score, level }: { score: number; level: RiskLevel }) {
  const color =
    level === "critical" ? "var(--danger)"
    : level === "high" ? "oklch(0.7 0.18 35)"
    : level === "medium" ? "var(--warning)"
    : "var(--success)";
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${score}%`, background: color }} />
      </div>
      <span className="text-xs font-semibold tabular-nums w-8">{score}</span>
      <Badge variant="outline" className={cn("text-[10px] capitalize", riskTone[level])}>
        {level}
      </Badge>
    </div>
  );
}

/* ---------------- live feed + queue ---------------- */

function LiveFeed({ onSelect }: { onSelect: (a: CorporateAccount) => void }) {
  const items = accounts
    .flatMap((a) => a.changes.map((c) => ({ a, c })))
    .sort((x, y) => (y.c.detectedAt > x.c.detectedAt ? 1 : -1))
    .slice(0, 6);

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-sm font-semibold flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            Live detection feed
          </div>
          <div className="text-xs text-muted-foreground">AI-flagged events across your book</div>
        </div>
        <Button variant="ghost" size="sm" className="h-7 text-xs">View all</Button>
      </div>
      <ScrollArea className="h-[300px] pr-3">
        <ul className="space-y-2.5">
          {items.map(({ a, c }) => {
            const Icon = changeIcon[c.type];
            return (
              <li key={c.id}>
                <button
                  onClick={() => onSelect(a)}
                  className="w-full text-left p-3 rounded-lg border border-border hover:border-accent/50 hover:bg-accent/5 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <span className={cn("w-8 h-8 rounded-md grid place-items-center border shrink-0", riskTone[c.severity])}>
                      <Icon className="w-3.5 h-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium truncate">{a.legalName}</span>
                        <span className="text-[10px] text-muted-foreground shrink-0">{c.detectedAt}</span>
                      </div>
                      <div className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{c.summary}</div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <Badge variant="outline" className={cn("text-[10px] capitalize", riskTone[c.severity])}>
                          {c.type}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          confidence {c.confidence}%
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </ScrollArea>
    </Card>
  );
}

function ReviewQueue({ onSelect }: { onSelect: (a: CorporateAccount) => void }) {
  const queue = [...accounts]
    .filter((a) => a.kycStatus !== "current")
    .sort((a, b) => (a.nextReview > b.nextReview ? 1 : -1));
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-sm font-semibold">KYC review queue</div>
          <div className="text-xs text-muted-foreground">Sorted by due date</div>
        </div>
        <Badge variant="outline" className="text-[10px]">{queue.length} pending</Badge>
      </div>
      <ul className="space-y-2">
        {queue.map((a) => (
          <li key={a.id}>
            <button
              onClick={() => onSelect(a)}
              className="w-full flex items-center gap-3 p-2.5 rounded-md hover:bg-muted/60 transition-colors text-left"
            >
              <div className={cn("w-1 h-8 rounded-full",
                a.kycStatus === "overdue" ? "bg-danger" :
                a.kycStatus === "in_review" ? "bg-info" : "bg-warning",
              )} />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium truncate">{a.legalName}</div>
                <div className="text-[10px] text-muted-foreground">
                  Due {a.nextReview} · RM {a.relationshipManager}
                </div>
              </div>
              <Badge variant="outline" className={cn("text-[10px]", statusTone[a.kycStatus])}>
                {statusLabel[a.kycStatus]}
              </Badge>
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}

/* ---------------- drawer ---------------- */

function AccountDrawer({ account, onClose }: { account: CorporateAccount | null; onClose: () => void }) {
  return (
    <Sheet open={!!account} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-[560px] overflow-y-auto">
        {account && (
          <>
            <SheetHeader>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-md grid place-items-center text-sm font-semibold text-primary-foreground"
                     style={{ background: "var(--gradient-primary)" }}>
                  {account.legalName.split(" ").slice(0, 2).map((w) => w[0]).join("")}
                </div>
                <div className="min-w-0">
                  <SheetTitle className="truncate">{account.legalName}</SheetTitle>
                  <SheetDescription className="text-xs">
                    {account.id} · {account.industry} · {account.jurisdiction}
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <StatTile label="Risk score" value={account.riskScore.toString()} sub={account.riskLevel} tone="primary" />
              <StatTile label="AI confidence" value={`${account.aiConfidence}%`} sub="Nano-Banana" tone="accent" />
              <StatTile label="Exposure" value={fmtMoney(account.exposureUSD)} sub={`${account.accountsHeld} accounts`} />
              <StatTile label="UBOs" value={account.uboCount.toString()} sub="beneficial owners" />
            </div>

            <div className="mt-5">
              <div className="text-xs font-semibold mb-2 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-accent" />
                AI-generated review summary
              </div>
              <div className="text-xs leading-relaxed p-3.5 rounded-lg border border-border bg-muted/30">
                {account.changes.length === 0
                  ? "No material changes detected since last review. Risk posture remains stable across monitored signals."
                  : `Detected ${account.changes.length} significant change${account.changes.length > 1 ? "s" : ""} across ${
                      new Set(account.changes.map((c) => c.type)).size
                    } categor${account.changes.length > 1 ? "ies" : "y"}. ${
                      account.changes.some((c) => c.severity === "critical")
                        ? "Recommend immediate enhanced due diligence and SAR consideration."
                        : "Recommend refreshed KYC packet within the next review window."
                    }`}
              </div>
            </div>

            <div className="mt-5">
              <div className="text-xs font-semibold mb-2">KYC refresh progress</div>
              <Progress value={account.kycStatus === "current" ? 100 : account.kycStatus === "in_review" ? 60 : account.kycStatus === "due_soon" ? 30 : 10}
                        className="h-2" />
              <div className="flex justify-between mt-1.5 text-[10px] text-muted-foreground">
                <span>Identification</span><span>Verification</span><span>Risk assessment</span><span>Approval</span>
              </div>
            </div>

            <div className="mt-5">
              <div className="text-xs font-semibold mb-2">Detected changes</div>
              {account.changes.length === 0 ? (
                <div className="text-xs text-muted-foreground p-3 rounded-md border border-dashed border-border">
                  No changes detected.
                </div>
              ) : (
                <ul className="space-y-2.5">
                  {account.changes.map((c) => {
                    const Icon = changeIcon[c.type];
                    return (
                      <li key={c.id} className="p-3 rounded-lg border border-border">
                        <div className="flex items-start gap-2.5">
                          <span className={cn("w-7 h-7 rounded-md grid place-items-center border shrink-0", riskTone[c.severity])}>
                            <Icon className="w-3.5 h-3.5" />
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-medium capitalize">{c.type}</span>
                              <Badge variant="outline" className={cn("text-[10px] capitalize", riskTone[c.severity])}>
                                {c.severity}
                              </Badge>
                              <span className="text-[10px] text-muted-foreground ml-auto">
                                {c.detectedAt} · {c.confidence}%
                              </span>
                            </div>
                            <div className="text-xs mt-1 leading-snug">{c.summary}</div>
                            {(c.before || c.after) && (
                              <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
                                <div className="p-2 rounded bg-muted/50">
                                  <div className="text-[9px] uppercase text-muted-foreground tracking-wide mb-0.5">Before</div>
                                  {c.before}
                                </div>
                                <div className="p-2 rounded bg-accent/10 border border-accent/30">
                                  <div className="text-[9px] uppercase text-accent tracking-wide mb-0.5">After</div>
                                  {c.after}
                                </div>
                              </div>
                            )}
                            <div className="text-[10px] text-muted-foreground mt-1.5">Source: {c.source}</div>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="mt-5 flex gap-2 sticky bottom-0 bg-background pt-3 pb-1 -mx-6 px-6 border-t border-border">
              <Button className="flex-1" style={{ background: "var(--gradient-primary)" }}>
                <FileSearch className="w-4 h-4 mr-1.5" /> Start KYC refresh
              </Button>
              <Button variant="outline">
                <AlertTriangle className="w-4 h-4 mr-1.5" /> Escalate
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function StatTile({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "primary" | "accent";
}) {
  return (
    <div className="p-3 rounded-lg border border-border">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={cn(
        "text-xl font-semibold mt-0.5",
        tone === "accent" && "text-accent",
      )}>
        {value}
      </div>
      {sub && <div className="text-[11px] text-muted-foreground capitalize">{sub}</div>}
    </div>
  );
}
