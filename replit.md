# HR Analytics Dashboard

A professional workforce intelligence dashboard analyzing 1,470 employee records. Tracks attrition, salary trends, department headcount, job satisfaction, and HR performance metrics — styled like a Bloomberg terminal for HR leaders.

## Run & Operate

- `pnpm --filter @workspace/hr-analytics run dev` — run the dashboard (port auto-assigned)
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Recharts, TanStack Table, react-csv
- API: Express 5 (shared api-server artifact)
- Validation: Zod, Orval codegen from OpenAPI spec
- Data: In-memory generated dataset (1,470 IBM-style HR employees)

## Where things live

- `lib/api-spec/openapi.yaml` — API contract source of truth (all HR endpoints defined here)
- `artifacts/api-server/src/data/hr-data.ts` — HR dataset generator + all analytics computation functions
- `artifacts/api-server/src/routes/hr.ts` — all 15 HR API route handlers
- `artifacts/hr-analytics/src/pages/Dashboard.tsx` — the entire dashboard UI
- `artifacts/hr-analytics/src/index.css` — Tailwind v4 theme (IBM Plex Sans, corporate blue/slate palette)

## Architecture decisions

- Static in-memory dataset: all 1,470 employee records generated deterministically at server startup; no database needed for this analytics use case
- Contract-first: OpenAPI spec defines all endpoints; Orval generates React Query hooks and Zod validators
- All analytics computed server-side (aggregation functions in hr-data.ts), not in the browser
- Global chart data is unfiltered; the employee table and KPI cards react to the filter bar (department, gender, job role, attrition, overtime, education)

## Product

- 6 KPI cards: Total Employees, Active Employees, Employees Left, Attrition Rate, Avg Monthly Salary, Avg Age
- 11 charts: Department Headcount, Attrition by Dept/Role/Gender/Age Group, Salary by Role/Distribution, Job Satisfaction, Overtime vs Attrition, Years at Company, Education Analysis
- Interactive filter bar (6 slicers) with clear-all button
- Sortable, paginated employee data table with CSV export
- CSV export per chart card, PDF print export, dark mode toggle, split refresh with 5-min auto-refresh floor

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Do not use `pnpm run dev` at workspace root; run individual artifact workflows
- After any OpenAPI spec change, run codegen before using updated hooks: `pnpm --filter @workspace/api-spec run codegen`
- The HR dataset is generated deterministically in memory — changes to hr-data.ts re-generate on server restart

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
