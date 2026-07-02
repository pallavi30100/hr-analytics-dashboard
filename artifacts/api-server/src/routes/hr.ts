import { Router, type IRouter } from "express";
import {
  computeSummary,
  filterEmployees,
  computeAttritionByDept,
  computeAttritionByJobRole,
  computeAttritionByGender,
  computeAttritionByAgeGroup,
  computeSalaryByJobRole,
  computeSalaryDistribution,
  computeJobSatisfaction,
  computePerformanceDistribution,
  computeYearsAtCompany,
  computeOvertimeAttrition,
  computeDepartmentHeadcount,
  computeEducationAnalysis,
  computeFilterOptions,
} from "../data/hr-data.js";

const router: IRouter = Router();

router.get("/hr/summary", async (_req, res): Promise<void> => {
  res.json(computeSummary());
});

router.get("/hr/employees", async (req, res): Promise<void> => {
  const { department, gender, jobRole, attrition, overtime, education } = req.query as Record<string, string | undefined>;
  const result = filterEmployees({ department, gender, jobRole, attrition, overtime, education });
  res.json(result);
});

router.get("/hr/attrition-by-department", async (_req, res): Promise<void> => {
  res.json(computeAttritionByDept());
});

router.get("/hr/attrition-by-job-role", async (_req, res): Promise<void> => {
  res.json(computeAttritionByJobRole());
});

router.get("/hr/attrition-by-gender", async (_req, res): Promise<void> => {
  res.json(computeAttritionByGender());
});

router.get("/hr/attrition-by-age-group", async (_req, res): Promise<void> => {
  res.json(computeAttritionByAgeGroup());
});

router.get("/hr/salary-by-job-role", async (_req, res): Promise<void> => {
  res.json(computeSalaryByJobRole());
});

router.get("/hr/salary-distribution", async (_req, res): Promise<void> => {
  res.json(computeSalaryDistribution());
});

router.get("/hr/job-satisfaction", async (_req, res): Promise<void> => {
  res.json(computeJobSatisfaction());
});

router.get("/hr/performance-distribution", async (_req, res): Promise<void> => {
  res.json(computePerformanceDistribution());
});

router.get("/hr/years-at-company", async (_req, res): Promise<void> => {
  res.json(computeYearsAtCompany());
});

router.get("/hr/overtime-attrition", async (_req, res): Promise<void> => {
  res.json(computeOvertimeAttrition());
});

router.get("/hr/department-headcount", async (_req, res): Promise<void> => {
  res.json(computeDepartmentHeadcount());
});

router.get("/hr/education-analysis", async (_req, res): Promise<void> => {
  res.json(computeEducationAnalysis());
});

router.get("/hr/filters", async (_req, res): Promise<void> => {
  res.json(computeFilterOptions());
});

export default router;
