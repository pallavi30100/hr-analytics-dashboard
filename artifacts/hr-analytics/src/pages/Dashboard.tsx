import { useState, useEffect, useRef, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useGetHrSummary, useGetEmployees, useGetAttritionByDepartment, 
  useGetAttritionByJobRole, useGetAttritionByGender, useGetAttritionByAgeGroup, 
  useGetSalaryByJobRole, useGetSalaryDistribution, useGetJobSatisfaction, 
  useGetYearsAtCompany, useGetOvertimeAttrition, useGetDepartmentHeadcount, 
  useGetEducationAnalysis, useGetFilterOptions,
  type Employee 
} from "@workspace/api-client-react";
import { CSVLink } from "react-csv";
import {
  BarChart, Bar, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Area
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  RefreshCw, ChevronDown, Check, Sun, Moon, Download, Printer, ArrowUp, ArrowDown
} from "lucide-react";
import {
  useReactTable, getCoreRowModel, getSortedRowModel, getFilteredRowModel, 
  getPaginationRowModel, flexRender, type ColumnDef, type SortingState
} from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const CHART_COLORS = { blue: "#0079F2", purple: "#795EFF", green: "#009118", red: "#A60808", pink: "#ec4899" };
const CHART_COLOR_LIST = [CHART_COLORS.blue, CHART_COLORS.purple, CHART_COLORS.green, CHART_COLORS.red, CHART_COLORS.pink];
const DATA_SOURCES = ["HRIS Core", "Workday"];

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div style={{ backgroundColor: "#fff", borderRadius: "6px", padding: "10px 14px", border: "1px solid #e0e0e0", color: "#1a1a1a", fontSize: "13px", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}>
      <div style={{ marginBottom: "6px", fontWeight: 500, display: "flex", alignItems: "center", gap: "6px" }}>
        {payload.length === 1 && payload[0].color && payload[0].color !== "#ffffff" && (
          <span style={{ display: "inline-block", width: "10px", height: "10px", borderRadius: "2px", backgroundColor: payload[0].color, flexShrink: 0 }} />
        )}
        {label}
      </div>
      {payload.map((entry: any, index: number) => {
        let formattedValue = entry.value;
        if (typeof entry.value === "number") {
          const nameLower = (entry.name || "").toLowerCase();
          if (nameLower.includes("rate") || nameLower.includes("%") || nameLower.includes("percentage")) {
            formattedValue = entry.value.toFixed(1) + "%";
          } else if (nameLower.includes("salary") || nameLower.includes("income")) {
            formattedValue = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(entry.value);
          } else {
            formattedValue = entry.value.toLocaleString();
          }
        }
        return (
          <div key={index} style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "3px" }}>
            {payload.length > 1 && entry.color && entry.color !== "#ffffff" && (
              <span style={{ display: "inline-block", width: "10px", height: "10px", borderRadius: "2px", backgroundColor: entry.color, flexShrink: 0 }} />
            )}
            <span style={{ color: "#444" }}>{entry.name}</span>
            <span style={{ marginLeft: "auto", fontWeight: 600 }}>{formattedValue}</span>
          </div>
        );
      })}
    </div>
  );
}

function CustomLegend({ payload }: any) {
  if (!payload || payload.length === 0) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "8px 16px", fontSize: "13px", marginTop: "12px" }}>
      {payload.map((entry: any, index: number) => (
        <div key={index} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ display: "inline-block", width: "10px", height: "10px", borderRadius: "2px", backgroundColor: entry.color, flexShrink: 0 }} />
          <span className="text-muted-foreground">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

function KPICard({ title, value, loading }: { title: string; value: string | number; loading: boolean }) {
  return (
    <Card className="shadcn-card">
      <CardContent className="p-5">
        {loading ? (
          <>
            <Skeleton className="h-4 w-24 mb-3" />
            <Skeleton className="h-8 w-32" />
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground font-medium">{title}</p>
            <p className="text-[28px] font-bold mt-2 tracking-tight" style={{ color: CHART_COLORS.blue, lineHeight: 1.1 }}>{value}</p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function ChartCard({ title, data, filename, loading, isDark, children }: any) {
  return (
    <Card className="flex flex-col shadcn-card h-full">
      <CardHeader className="px-5 pt-5 pb-2 flex-row items-center justify-between space-y-0">
        <CardTitle className="text-[15px] font-semibold tracking-tight">{title}</CardTitle>
        {!loading && data && data.length > 0 && (
          <CSVLink 
            data={data} 
            filename={filename} 
            className="print:hidden flex items-center justify-center w-[26px] h-[26px] rounded-[6px] transition-colors hover:opacity-80" 
            style={{ backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "#F0F1F2", color: isDark ? "#c8c9cc" : "#4b5563" }} 
            aria-label={`Export ${title} data as CSV`}
          >
            <Download className="w-3.5 h-3.5" />
          </CSVLink>
        )}
      </CardHeader>
      <CardContent className="p-5 pt-3 flex-1 flex flex-col justify-end">
        {loading ? (
          <Skeleton className="w-full h-[280px]" />
        ) : data && data.length > 0 ? (
          children
        ) : (
          <div className="w-full h-[280px] flex items-center justify-center text-muted-foreground text-sm">
            No data available
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TableExportButton({ table }: { table: any }) {
  const data = table.getFilteredRowModel().rows.map((row: any) => row.original);
  if (!data || data.length === 0) return null;
  return (
    <CSVLink
      data={data}
      filename="employees.csv"
      className="flex items-center gap-1.5 px-3 h-9 rounded-md text-[13px] font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
    >
      <Download className="w-4 h-4" />
      Export CSV
    </CSVLink>
  );
}

export default function Dashboard() {
  const queryClient = useQueryClient();
  const [isDark, setIsDark] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [selectedIntervalMs, setSelectedIntervalMs] = useState(5 * 60 * 1000);
  const [isSpinning, setIsSpinning] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  
  const [filters, setFilters] = useState({
    department: "", gender: "", jobRole: "", attrition: "", overtime: "", education: ""
  });

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => { document.documentElement.classList.toggle("dark", isDark); }, [isDark]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const hrSummaryQuery = useGetHrSummary();
  const employeesQuery = useGetEmployees({
    department: filters.department || undefined,
    gender: filters.gender || undefined,
    jobRole: filters.jobRole || undefined,
    attrition: filters.attrition || undefined,
    overtime: filters.overtime || undefined,
    education: filters.education || undefined,
  });
  const attrByDeptQuery = useGetAttritionByDepartment();
  const attrByRoleQuery = useGetAttritionByJobRole();
  const attrByGenderQuery = useGetAttritionByGender();
  const attrByAgeQuery = useGetAttritionByAgeGroup();
  const salaryByRoleQuery = useGetSalaryByJobRole();
  const salaryDistQuery = useGetSalaryDistribution();
  const satisfactionQuery = useGetJobSatisfaction();
  const yearsAtCompanyQuery = useGetYearsAtCompany();
  const overtimeAttrQuery = useGetOvertimeAttrition();
  const deptHeadcountQuery = useGetDepartmentHeadcount();
  const educationQuery = useGetEducationAnalysis();
  const filterOptionsQuery = useGetFilterOptions();

  const isAnyFetching = hrSummaryQuery.isFetching || employeesQuery.isFetching || attrByDeptQuery.isFetching || attrByRoleQuery.isFetching || attrByGenderQuery.isFetching;

  useEffect(() => {
    if (isAnyFetching) {
      setIsSpinning(true);
      return;
    }
    const t = setTimeout(() => setIsSpinning(false), 600);
    return () => clearTimeout(t);
  }, [isAnyFetching]);

  const handleRefresh = () => {
    queryClient.invalidateQueries();
  };

  useEffect(() => {
    if (!autoRefresh) return;
    const t = setInterval(() => { handleRefresh(); }, selectedIntervalMs);
    return () => clearInterval(t);
  }, [autoRefresh, selectedIntervalMs, queryClient]);

  const handleClearFilters = () => setFilters({ department: "", gender: "", jobRole: "", attrition: "", overtime: "", education: "" });

  const columns = useMemo<ColumnDef<Employee>[]>(() => [
    { accessorKey: "employeeId", header: "ID", cell: ({ row }) => <span className="font-mono text-[13px] text-muted-foreground">{row.original.employeeId}</span> },
    { accessorKey: "age", header: "Age" },
    { accessorKey: "gender", header: "Gender" },
    { accessorKey: "department", header: "Department" },
    { accessorKey: "jobRole", header: "Role" },
    { accessorKey: "monthlyIncome", header: "Income", cell: ({ row }) => <span className="font-medium">{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(row.original.monthlyIncome)}</span> },
    { 
      accessorKey: "attrition", 
      header: "Attrition", 
      cell: ({ row }) => {
        const isYes = row.original.attrition === "Yes";
        return <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${isYes ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"}`}>{row.original.attrition}</span>;
      }
    },
    { accessorKey: "jobSatisfaction", header: "Satisfaction" },
    { accessorKey: "performanceRating", header: "Performance" },
    { accessorKey: "yearsAtCompany", header: "Years at Co." },
    { accessorKey: "overTime", header: "Overtime" },
    { accessorKey: "businessTravel", header: "Travel" },
  ], []);

  const table = useReactTable({
    data: employeesQuery.data || [],
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 20 } },
  });

  const gridColor = isDark ? "rgba(255,255,255,0.06)" : "#f1f2f4";
  const tickColor = isDark ? "#828387" : "#71717a";

  const INTERVAL_OPTIONS = [
    { label: "Every 5 min", ms: 5 * 60 * 1000 },
    { label: "Every 15 min", ms: 15 * 60 * 1000 },
    { label: "Every 1 hour", ms: 60 * 60 * 1000 },
    { label: "Every 24 hours", ms: 24 * 60 * 60 * 1000 },
  ];

  const lastRefreshed = hrSummaryQuery.dataUpdatedAt
    ? (() => {
        const d = new Date(hrSummaryQuery.dataUpdatedAt);
        return `${d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }).toLowerCase()} on ${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
      })()
    : null;

  const summary = hrSummaryQuery.data;
  const summaryLoading = hrSummaryQuery.isLoading || hrSummaryQuery.isFetching;

  return (
    <div className="min-h-screen bg-background px-5 py-4 pt-[32px] pb-[48px] pl-[24px] pr-[24px]">
      <svg width="0" height="0" className="absolute pointer-events-none">
        <defs>
          <linearGradient id="gradientBlue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART_COLORS.blue} stopOpacity={0.35} />
            <stop offset="100%" stopColor={CHART_COLORS.blue} stopOpacity={0.0} />
          </linearGradient>
        </defs>
      </svg>

      <div className="max-w-[1440px] mx-auto">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
          <div className="pt-2">
            <h1 className="font-bold text-[32px] tracking-tight">HR Analytics Dashboard</h1>
            <p className="text-muted-foreground mt-1 text-[15px]">Workforce intelligence and attrition monitoring</p>
            {DATA_SOURCES.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                <span className="text-[12px] text-muted-foreground shrink-0 font-medium">Data Sources:</span>
                {DATA_SOURCES.map((source) => (
                  <span key={source} className="text-[11px] font-bold rounded px-2 py-[2px] truncate print:!bg-[rgb(229,231,235)] print:!text-[rgb(75,85,99)]" style={{ maxWidth: "20ch", backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "#f1f2f4", color: isDark ? "#c8c9cc" : "rgb(75, 85, 99)" }}>
                    {source}
                  </span>
                ))}
              </div>
            )}
            {lastRefreshed && <p className="text-[12px] text-muted-foreground/80 mt-1">Last refresh: {lastRefreshed}</p>}
          </div>
          <div className="flex items-center gap-3 pt-2 print:hidden relative">
            <button onClick={() => window.print()} className="flex items-center justify-center w-[26px] h-[26px] rounded-[6px] transition-colors" style={{ backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "#F0F1F2", color: isDark ? "#c8c9cc" : "#4b5563" }} aria-label="Export as PDF">
              <Printer className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setIsDark((d) => !d)} className="flex items-center justify-center w-[26px] h-[26px] rounded-[6px] transition-colors" style={{ backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "#F0F1F2", color: isDark ? "#c8c9cc" : "#4b5563" }}>
              {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
            <div className="relative" ref={dropdownRef}>
              <div className="flex items-center rounded-[6px] overflow-hidden h-[26px] text-[12px]" style={{ backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "#F0F1F2", color: isDark ? "#c8c9cc" : "#4b5563" }}>
                <button onClick={handleRefresh} disabled={isAnyFetching} className="flex items-center gap-1.5 px-2.5 h-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors disabled:opacity-50 font-medium">
                  <RefreshCw className={`w-3.5 h-3.5 ${isSpinning ? "animate-spin" : ""}`} />
                  Refresh
                </button>
                <div className="w-px h-[14px] shrink-0" style={{ backgroundColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)" }} />
                <button onClick={() => setDropdownOpen((o) => !o)} className="flex items-center justify-center px-2 h-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>
              {dropdownOpen && (
                <div className="absolute top-[32px] right-0 w-[220px] bg-popover border border-border rounded-lg shadow-lg z-50 p-1.5 text-sm">
                  <div className="flex items-center justify-between px-2 py-2 border-b border-border/50 mb-1">
                    <span className="font-medium">Auto-refresh</span>
                    <button onClick={() => setAutoRefresh(!autoRefresh)} className={`w-8 h-4 rounded-full transition-colors relative ${autoRefresh ? "bg-primary" : "bg-muted"}`}>
                      <span className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${autoRefresh ? "translate-x-4" : ""}`} />
                    </button>
                  </div>
                  {INTERVAL_OPTIONS.map((opt) => (
                    <button key={opt.ms} onClick={() => { setSelectedIntervalMs(opt.ms); setAutoRefresh(true); setDropdownOpen(false); }} className="w-full flex items-center justify-between px-2 py-2 hover:bg-muted/50 rounded-md transition-colors text-left text-[13px]">
                      <span>{opt.label}</span>
                      {selectedIntervalMs === opt.ms && autoRefresh && <Check className="w-3.5 h-3.5 text-primary" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <KPICard title="Total Employees" value={summary?.totalEmployees.toLocaleString() ?? "--"} loading={summaryLoading} />
          <KPICard title="Active Employees" value={summary?.activeEmployees.toLocaleString() ?? "--"} loading={summaryLoading} />
          <KPICard title="Employees Left" value={summary?.employeesLeft.toLocaleString() ?? "--"} loading={summaryLoading} />
          <KPICard title="Attrition Rate" value={summary ? `${summary.attritionRate.toFixed(1)}%` : "--"} loading={summaryLoading} />
          <KPICard title="Avg Monthly Salary" value={summary ? new Intl.NumberFormat('en-US', {style: 'currency', currency: 'USD', maximumFractionDigits: 0}).format(summary.avgSalary) : "--"} loading={summaryLoading} />
          <KPICard title="Avg Age" value={summary ? summary.avgAge.toFixed(1) : "--"} loading={summaryLoading} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
          <ChartCard title="Department Headcount" data={deptHeadcountQuery.data} filename="department-headcount.csv" loading={deptHeadcountQuery.isLoading || deptHeadcountQuery.isFetching} isDark={isDark}>
            <ResponsiveContainer width="100%" height={280} debounce={0}>
              <BarChart data={deptHeadcountQuery.data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="department" stroke={tickColor} tick={{ fill: tickColor, fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis stroke={tickColor} tick={{ fill: tickColor, fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} isAnimationActive={false} cursor={false} />
                <Legend content={<CustomLegend />} />
                <Bar dataKey="male" name="Male" stackId="a" fill={CHART_COLORS.blue} fillOpacity={0.9} isAnimationActive={false} />
                <Bar dataKey="female" name="Female" stackId="a" fill={CHART_COLORS.purple} fillOpacity={0.9} isAnimationActive={false} radius={[2,2,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Attrition by Department" data={attrByDeptQuery.data} filename="attrition-by-department.csv" loading={attrByDeptQuery.isLoading || attrByDeptQuery.isFetching} isDark={isDark}>
            <ResponsiveContainer width="100%" height={280} debounce={0}>
              <BarChart data={attrByDeptQuery.data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="department" stroke={tickColor} tick={{ fill: tickColor, fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis stroke={tickColor} tick={{ fill: tickColor, fontSize: 12 }} tickFormatter={v => `${v}%`} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} isAnimationActive={false} cursor={false} />
                <Bar dataKey="attritionRate" name="Attrition Rate" fill={CHART_COLORS.red} fillOpacity={0.85} isAnimationActive={false} radius={[2,2,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Attrition by Job Role" data={attrByRoleQuery.data} filename="attrition-by-job-role.csv" loading={attrByRoleQuery.isLoading || attrByRoleQuery.isFetching} isDark={isDark}>
            <ResponsiveContainer width="100%" height={280} debounce={0}>
              <BarChart data={attrByRoleQuery.data} layout="vertical" margin={{ top: 10, right: 10, left: 60, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
                <XAxis type="number" stroke={tickColor} tick={{ fill: tickColor, fontSize: 12 }} tickFormatter={v => `${v}%`} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="jobRole" stroke={tickColor} tick={{ fill: tickColor, fontSize: 11 }} axisLine={false} tickLine={false} width={100} />
                <Tooltip content={<CustomTooltip />} isAnimationActive={false} cursor={false} />
                <Bar dataKey="attritionRate" name="Attrition Rate" fill={CHART_COLORS.red} fillOpacity={0.85} isAnimationActive={false} radius={[0,2,2,0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
          <ChartCard title="Attrition by Gender" data={attrByGenderQuery.data} filename="attrition-by-gender.csv" loading={attrByGenderQuery.isLoading || attrByGenderQuery.isFetching} isDark={isDark}>
            <ResponsiveContainer width="100%" height={280} debounce={0}>
              <PieChart margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <Pie data={attrByGenderQuery.data} dataKey="attrited" nameKey="gender" cx="50%" cy="45%" outerRadius={90} innerRadius={55} cornerRadius={2} paddingAngle={2} isAnimationActive={false} stroke="none">
                  {attrByGenderQuery.data?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLOR_LIST[index % CHART_COLOR_LIST.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} isAnimationActive={false} />
                <Legend content={<CustomLegend />} verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Attrition by Age Group" data={attrByAgeQuery.data} filename="attrition-by-age-group.csv" loading={attrByAgeQuery.isLoading || attrByAgeQuery.isFetching} isDark={isDark}>
            <ResponsiveContainer width="100%" height={280} debounce={0}>
              <BarChart data={attrByAgeQuery.data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="ageGroup" stroke={tickColor} tick={{ fill: tickColor, fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis stroke={tickColor} tick={{ fill: tickColor, fontSize: 12 }} tickFormatter={v => `${v}%`} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} isAnimationActive={false} cursor={false} />
                <Bar dataKey="attritionRate" name="Attrition Rate" fill={CHART_COLORS.purple} fillOpacity={0.85} isAnimationActive={false} radius={[2,2,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Overtime vs Attrition" data={overtimeAttrQuery.data} filename="overtime-attrition.csv" loading={overtimeAttrQuery.isLoading || overtimeAttrQuery.isFetching} isDark={isDark}>
            <ResponsiveContainer width="100%" height={280} debounce={0}>
              <BarChart data={overtimeAttrQuery.data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="overtime" stroke={tickColor} tick={{ fill: tickColor, fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis stroke={tickColor} tick={{ fill: tickColor, fontSize: 12 }} tickFormatter={v => `${v}%`} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} isAnimationActive={false} cursor={false} />
                <Bar dataKey="attritionRate" name="Attrition Rate" fill={CHART_COLORS.red} fillOpacity={0.85} isAnimationActive={false} radius={[2,2,0,0]} maxBarSize={60} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
          <ChartCard title="Salary by Job Role" data={salaryByRoleQuery.data} filename="salary-by-job-role.csv" loading={salaryByRoleQuery.isLoading || salaryByRoleQuery.isFetching} isDark={isDark}>
            <ResponsiveContainer width="100%" height={280} debounce={0}>
              <BarChart data={salaryByRoleQuery.data} layout="vertical" margin={{ top: 10, right: 30, left: 60, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
                <XAxis type="number" stroke={tickColor} tick={{ fill: tickColor, fontSize: 12 }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="jobRole" stroke={tickColor} tick={{ fill: tickColor, fontSize: 11 }} axisLine={false} tickLine={false} width={100} />
                <Tooltip content={<CustomTooltip />} isAnimationActive={false} cursor={false} />
                <Bar dataKey="avgSalary" name="Avg Salary" fill={CHART_COLORS.blue} fillOpacity={0.85} isAnimationActive={false} radius={[0,2,2,0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Salary Distribution" data={salaryDistQuery.data} filename="salary-distribution.csv" loading={salaryDistQuery.isLoading || salaryDistQuery.isFetching} isDark={isDark}>
            <ResponsiveContainer width="100%" height={280} debounce={0}>
              <BarChart data={salaryDistQuery.data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="band" stroke={tickColor} tick={{ fill: tickColor, fontSize: 11 }} axisLine={false} tickLine={false} angle={-35} textAnchor="end" height={50} />
                <YAxis stroke={tickColor} tick={{ fill: tickColor, fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} isAnimationActive={false} cursor={false} />
                <Bar dataKey="count" name="Employee Count" fill={CHART_COLORS.blue} fillOpacity={0.85} isAnimationActive={false} radius={[2,2,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8">
          <ChartCard title="Job Satisfaction Distribution" data={satisfactionQuery.data} filename="job-satisfaction.csv" loading={satisfactionQuery.isLoading || satisfactionQuery.isFetching} isDark={isDark}>
            <ResponsiveContainer width="100%" height={280} debounce={0}>
              <BarChart data={satisfactionQuery.data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="label" stroke={tickColor} tick={{ fill: tickColor, fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis stroke={tickColor} tick={{ fill: tickColor, fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} isAnimationActive={false} cursor={false} />
                <Bar dataKey="count" name="Count" fill={CHART_COLORS.green} fillOpacity={0.85} isAnimationActive={false} radius={[2,2,0,0]} maxBarSize={60}/>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Education Analysis" data={educationQuery.data} filename="education-analysis.csv" loading={educationQuery.isLoading || educationQuery.isFetching} isDark={isDark}>
            <ResponsiveContainer width="100%" height={280} debounce={0}>
              <BarChart data={educationQuery.data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="label" stroke={tickColor} tick={{ fill: tickColor, fontSize: 11 }} axisLine={false} tickLine={false} angle={-35} textAnchor="end" height={50} />
                <YAxis stroke={tickColor} tick={{ fill: tickColor, fontSize: 12 }} tickFormatter={v => `${v}%`} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} isAnimationActive={false} cursor={false} />
                <Bar dataKey="attritionRate" name="Attrition Rate" fill={CHART_COLORS.purple} fillOpacity={0.85} isAnimationActive={false} radius={[2,2,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Years at Company Analysis" data={yearsAtCompanyQuery.data} filename="years-at-company.csv" loading={yearsAtCompanyQuery.isLoading || yearsAtCompanyQuery.isFetching} isDark={isDark}>
            <ResponsiveContainer width="100%" height={280} debounce={0}>
              <ComposedChart data={yearsAtCompanyQuery.data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="band" stroke={tickColor} tick={{ fill: tickColor, fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" stroke={tickColor} tick={{ fill: tickColor, fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" stroke={tickColor} tick={{ fill: tickColor, fontSize: 12 }} tickFormatter={v => `${v}%`} axisLine={false} tickLine={false} width={40}/>
                <Tooltip content={<CustomTooltip />} isAnimationActive={false} cursor={{ fill: 'rgba(0,0,0,0.05)', stroke: 'none' }} />
                <Legend content={<CustomLegend />} />
                <Area yAxisId="left" type="monotone" dataKey="count" name="Employee Count" fill="url(#gradientBlue)" stroke={CHART_COLORS.blue} strokeWidth={2} fillOpacity={1} isAnimationActive={false} />
                <Line yAxisId="right" type="monotone" dataKey="attritionRate" name="Attrition Rate" stroke={CHART_COLORS.red} strokeWidth={2} dot={{ r: 3, fill: CHART_COLORS.red }} activeDot={{ r: 5 }} isAnimationActive={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <Card className="mb-8 shadcn-card overflow-hidden">
          <CardHeader className="px-6 py-5 flex-row items-center justify-between border-b border-border/50 bg-muted/20">
            <div>
              <CardTitle className="text-lg font-semibold tracking-tight">Employee Directory</CardTitle>
              <p className="text-[13px] text-muted-foreground mt-1">Filter and export detailed employee records</p>
            </div>
            <div className="flex items-center gap-3 print:hidden">
              <div className="relative">
                <Input
                  placeholder="Search employees..."
                  value={globalFilter}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  className="w-[240px] h-9 text-[13px] pl-8 bg-background border-input"
                />
                <svg className="w-4 h-4 absolute left-2.5 top-2.5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <TableExportButton table={table} />
            </div>
          </CardHeader>
          
          <div className="px-6 py-4 border-b border-border/50 bg-background flex flex-wrap items-end gap-4">
            <div className="w-[170px]">
              <Label className="text-[12px] mb-1.5 block text-muted-foreground font-semibold uppercase tracking-wider">Department</Label>
              <select value={filters.department} onChange={e => setFilters({...filters, department: e.target.value})} className="w-full h-9 rounded-md border border-input bg-background px-3 text-[13px] outline-none focus:ring-1 focus:ring-primary transition-shadow">
                <option value="">All Departments</option>
                {filterOptionsQuery.data?.departments?.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="w-[170px]">
              <Label className="text-[12px] mb-1.5 block text-muted-foreground font-semibold uppercase tracking-wider">Gender</Label>
              <select value={filters.gender} onChange={e => setFilters({...filters, gender: e.target.value})} className="w-full h-9 rounded-md border border-input bg-background px-3 text-[13px] outline-none focus:ring-1 focus:ring-primary transition-shadow">
                <option value="">All Genders</option>
                {filterOptionsQuery.data?.genders?.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div className="w-[170px]">
              <Label className="text-[12px] mb-1.5 block text-muted-foreground font-semibold uppercase tracking-wider">Job Role</Label>
              <select value={filters.jobRole} onChange={e => setFilters({...filters, jobRole: e.target.value})} className="w-full h-9 rounded-md border border-input bg-background px-3 text-[13px] outline-none focus:ring-1 focus:ring-primary transition-shadow">
                <option value="">All Roles</option>
                {filterOptionsQuery.data?.jobRoles?.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="w-[150px]">
              <Label className="text-[12px] mb-1.5 block text-muted-foreground font-semibold uppercase tracking-wider">Attrition</Label>
              <select value={filters.attrition} onChange={e => setFilters({...filters, attrition: e.target.value})} className="w-full h-9 rounded-md border border-input bg-background px-3 text-[13px] outline-none focus:ring-1 focus:ring-primary transition-shadow">
                <option value="">All</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
            <div className="w-[150px]">
              <Label className="text-[12px] mb-1.5 block text-muted-foreground font-semibold uppercase tracking-wider">Overtime</Label>
              <select value={filters.overtime} onChange={e => setFilters({...filters, overtime: e.target.value})} className="w-full h-9 rounded-md border border-input bg-background px-3 text-[13px] outline-none focus:ring-1 focus:ring-primary transition-shadow">
                <option value="">All</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
            <Button variant="ghost" className="h-9 ml-auto text-[13px] hover:bg-muted/50" onClick={handleClearFilters}>
              Clear Filters
            </Button>
          </div>

          <CardContent className="p-0">
            {employeesQuery.isLoading || employeesQuery.isFetching ? (
              <div className="p-6 space-y-4">
                <Skeleton className="h-10 w-full rounded-md" />
                {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-md" />)}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/30 hover:bg-muted/30">
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id} className="border-border/50">
                        {headerGroup.headers.map((header) => (
                          <TableHead key={header.id} onClick={header.column.getToggleSortingHandler()} className="cursor-pointer select-none whitespace-nowrap text-[12px] font-semibold text-muted-foreground uppercase tracking-wider h-11">
                            <div className="flex items-center gap-1.5">
                              {flexRender(header.column.columnDef.header, header.getContext())}
                              {header.column.getIsSorted() === "asc" ? <ArrowUp className="w-3 h-3 text-primary" /> : header.column.getIsSorted() === "desc" ? <ArrowDown className="w-3 h-3 text-primary" /> : null}
                            </div>
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {table.getRowModel().rows.length > 0 ? (
                      table.getRowModel().rows.map((row) => (
                        <TableRow key={row.id} className={`border-border/40 transition-colors ${row.original.attrition === "Yes" ? "bg-red-50/20 hover:bg-red-50/40 dark:bg-red-950/10 dark:hover:bg-red-950/20" : "hover:bg-muted/30"}`}>
                          {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id} className={`whitespace-nowrap text-[13px] py-3 ${cell.column.id === "attrition" && row.original.attrition === "Yes" ? "bg-red-50/40 dark:bg-red-900/10" : ""}`}>
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={columns.length} className="h-[200px] text-center text-muted-foreground">
                          No employees found matching the current filters.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
          
          {employeesQuery.data && employeesQuery.data.length > 0 && !employeesQuery.isLoading && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-border/50 bg-background/50">
              <div className="text-[13px] text-muted-foreground font-medium">
                Showing <span className="text-foreground">{table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}</span> to{" "}
                <span className="text-foreground">{Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, table.getFilteredRowModel().rows.length)}</span>{" "}
                of <span className="text-foreground">{table.getFilteredRowModel().rows.length}</span> records
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="h-8 px-3 text-[13px] bg-background" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>Previous</Button>
                <Button variant="outline" size="sm" className="h-8 px-3 text-[13px] bg-background" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>Next</Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
