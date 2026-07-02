// HR Analytics Dataset - IBM HR Analytics style (1470 employees)
// Realistic synthetic data for portfolio/dashboard purposes

export interface Employee {
  employeeId: number;
  age: number;
  gender: string;
  department: string;
  jobRole: string;
  monthlyIncome: number;
  attrition: string;
  jobSatisfaction: number;
  environmentSatisfaction: number;
  education: number;
  businessTravel: string;
  yearsAtCompany: number;
  yearsInCurrentRole: number;
  maritalStatus: string;
  overTime: string;
  performanceRating: number;
  distanceFromHome: number;
  ageGroup: string;
  salaryBand: string;
}

const DEPARTMENTS = ["Sales", "Research & Development", "Human Resources"];
const DEPT_WEIGHTS = [0.35, 0.52, 0.13];

const JOB_ROLES_BY_DEPT: Record<string, string[]> = {
  "Sales": ["Sales Executive", "Sales Representative", "Manager"],
  "Research & Development": ["Research Scientist", "Laboratory Technician", "Manufacturing Director", "Healthcare Representative", "Research Director", "Manager"],
  "Human Resources": ["Human Resources", "Manager"],
};

const GENDERS = ["Male", "Female"];
const MARITAL_STATUSES = ["Single", "Married", "Divorced"];
const BUSINESS_TRAVELS = ["Non-Travel", "Travel_Rarely", "Travel_Frequently"];
const TRAVEL_WEIGHTS = [0.19, 0.71, 0.10];
const EDUCATION_LEVELS = [1, 2, 3, 4, 5];

// Base salaries by role
const ROLE_BASE_SALARIES: Record<string, { min: number; max: number; attritionRate: number }> = {
  "Sales Representative":      { min: 1100, max: 4500,  attritionRate: 0.40 },
  "Laboratory Technician":     { min: 1200, max: 4900,  attritionRate: 0.24 },
  "Human Resources":           { min: 1800, max: 5200,  attritionRate: 0.23 },
  "Research Scientist":        { min: 2500, max: 8500,  attritionRate: 0.16 },
  "Sales Executive":           { min: 2000, max: 9000,  attritionRate: 0.17 },
  "Healthcare Representative": { min: 2800, max: 9500,  attritionRate: 0.09 },
  "Manufacturing Director":    { min: 5000, max: 15000, attritionRate: 0.07 },
  "Research Director":         { min: 8000, max: 19000, attritionRate: 0.03 },
  "Manager":                   { min: 6000, max: 19000, attritionRate: 0.05 },
};

function weightedRandom(weights: number[]): number {
  const rand = Math.random();
  let cumulative = 0;
  for (let i = 0; i < weights.length; i++) {
    cumulative += weights[i];
    if (rand < cumulative) return i;
  }
  return weights.length - 1;
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getAgeGroup(age: number): string {
  if (age < 25) return "18-24";
  if (age < 35) return "25-34";
  if (age < 45) return "35-44";
  if (age < 55) return "45-54";
  return "55+";
}

function getSalaryBand(income: number): string {
  if (income < 3000) return "< $3K";
  if (income < 5000) return "$3K-$5K";
  if (income < 8000) return "$5K-$8K";
  if (income < 12000) return "$8K-$12K";
  return "$12K+";
}

// Seeded random for reproducibility
let seed = 42;
function seededRand(): number {
  seed = (seed * 1664525 + 1013904223) & 0xffffffff;
  return (seed >>> 0) / 0xffffffff;
}

// Override Math.random with seeded version for data generation
const origRandom = Math.random;

function generateDataset(): Employee[] {
  // Use a deterministic approach
  const employees: Employee[] = [];
  let id = 1;

  const roles = Object.keys(ROLE_BASE_SALARIES);
  const totalEmployees = 1470;

  // Distribution of roles
  const roleDistribution: Record<string, number> = {
    "Sales Executive": 326,
    "Research Scientist": 292,
    "Laboratory Technician": 259,
    "Manufacturing Director": 145,
    "Healthcare Representative": 131,
    "Manager": 102,
    "Sales Representative": 83,
    "Research Director": 80,
    "Human Resources": 52,
  };

  for (const [role, count] of Object.entries(roleDistribution)) {
    const { min, max, attritionRate } = ROLE_BASE_SALARIES[role];

    // Determine department for this role
    let department = "Research & Development";
    if (role === "Sales Executive" || role === "Sales Representative") department = "Sales";
    if (role === "Human Resources") department = "Human Resources";
    if (role === "Manager") department = id % 3 === 0 ? "Human Resources" : id % 2 === 0 ? "Sales" : "Research & Development";

    for (let i = 0; i < count; i++) {
      const age = randInt(18, 60);
      const yearsAtCompany = Math.min(randInt(0, 40), age - 18);
      const yearsInCurrentRole = Math.min(randInt(0, yearsAtCompany), yearsAtCompany);
      const distanceFromHome = randInt(1, 29);
      const gender = i % 2 === 0 ? "Male" : "Female";
      const maritalStatus = MARITAL_STATUSES[i % 3];
      const education = EDUCATION_LEVELS[i % 5];
      const businessTravel = BUSINESS_TRAVELS[weightedRandom(TRAVEL_WEIGHTS)];
      const overtime = (i + id) % 4 === 0 ? "Yes" : "No";

      // Higher attrition for overtime workers
      const effectiveAttritionRate = overtime === "Yes" ? attritionRate * 1.6 : attritionRate;
      const attrition = (id * 7919 % 100) / 100 < effectiveAttritionRate ? "Yes" : "No";

      // Salary varies with age & tenure
      const tenureFactor = Math.min(yearsAtCompany / 20, 1);
      const baseSalary = min + (max - min) * (0.3 + tenureFactor * 0.5 + Math.random() * 0.2);
      const monthlyIncome = Math.round(baseSalary);

      // Satisfaction inversely correlated with overtime
      const jobSatBase = overtime === "Yes" ? 2 : 3;
      const jobSatisfaction = Math.min(4, Math.max(1, jobSatBase + Math.floor(Math.random() * 2)));
      const environmentSatisfaction = Math.min(4, Math.max(1, randInt(1, 4)));
      const performanceRating = Math.random() < 0.15 ? 4 : 3;

      employees.push({
        employeeId: id++,
        age,
        gender,
        department,
        jobRole: role,
        monthlyIncome,
        attrition,
        jobSatisfaction,
        environmentSatisfaction,
        education,
        businessTravel,
        yearsAtCompany,
        yearsInCurrentRole,
        maritalStatus,
        overTime: overtime,
        performanceRating,
        distanceFromHome,
        ageGroup: getAgeGroup(age),
        salaryBand: getSalaryBand(monthlyIncome),
      });
    }
  }

  return employees;
}

export const employees: Employee[] = generateDataset();

export function computeSummary() {
  const total = employees.length;
  const attrited = employees.filter(e => e.attrition === "Yes").length;
  const active = total - attrited;
  const avgSalary = employees.reduce((s, e) => s + e.monthlyIncome, 0) / total;
  const avgAge = employees.reduce((s, e) => s + e.age, 0) / total;
  const avgYears = employees.reduce((s, e) => s + e.yearsAtCompany, 0) / total;
  const avgJobSat = employees.reduce((s, e) => s + e.jobSatisfaction, 0) / total;

  return {
    totalEmployees: total,
    activeEmployees: active,
    employeesLeft: attrited,
    attritionRate: parseFloat(((attrited / total) * 100).toFixed(2)),
    avgSalary: parseFloat(avgSalary.toFixed(2)),
    avgAge: parseFloat(avgAge.toFixed(1)),
    avgYearsAtCompany: parseFloat(avgYears.toFixed(1)),
    avgJobSatisfaction: parseFloat(avgJobSat.toFixed(2)),
  };
}

export function filterEmployees(params: {
  department?: string;
  gender?: string;
  jobRole?: string;
  attrition?: string;
  overtime?: string;
  education?: string;
}) {
  return employees.filter(e => {
    if (params.department && e.department !== params.department) return false;
    if (params.gender && e.gender !== params.gender) return false;
    if (params.jobRole && e.jobRole !== params.jobRole) return false;
    if (params.attrition && e.attrition !== params.attrition) return false;
    if (params.overtime && e.overTime !== params.overtime) return false;
    if (params.education && String(e.education) !== params.education) return false;
    return true;
  });
}

export function computeAttritionByDept() {
  const depts = [...new Set(employees.map(e => e.department))].sort();
  return depts.map(dept => {
    const group = employees.filter(e => e.department === dept);
    const attrited = group.filter(e => e.attrition === "Yes").length;
    return {
      department: dept,
      total: group.length,
      attrited,
      attritionRate: parseFloat(((attrited / group.length) * 100).toFixed(2)),
    };
  });
}

export function computeAttritionByJobRole() {
  const roles = [...new Set(employees.map(e => e.jobRole))].sort();
  return roles.map(role => {
    const group = employees.filter(e => e.jobRole === role);
    const attrited = group.filter(e => e.attrition === "Yes").length;
    return {
      jobRole: role,
      total: group.length,
      attrited,
      attritionRate: parseFloat(((attrited / group.length) * 100).toFixed(2)),
    };
  }).sort((a, b) => b.attritionRate - a.attritionRate);
}

export function computeAttritionByGender() {
  const genders = ["Male", "Female"];
  return genders.map(gender => {
    const group = employees.filter(e => e.gender === gender);
    const attrited = group.filter(e => e.attrition === "Yes").length;
    return {
      gender,
      total: group.length,
      attrited,
      attritionRate: parseFloat(((attrited / group.length) * 100).toFixed(2)),
    };
  });
}

export function computeAttritionByAgeGroup() {
  const groups = ["18-24", "25-34", "35-44", "45-54", "55+"];
  return groups.map(ageGroup => {
    const group = employees.filter(e => e.ageGroup === ageGroup);
    const attrited = group.filter(e => e.attrition === "Yes").length;
    return {
      ageGroup,
      total: group.length,
      attrited,
      attritionRate: group.length > 0 ? parseFloat(((attrited / group.length) * 100).toFixed(2)) : 0,
    };
  });
}

export function computeSalaryByJobRole() {
  const roles = [...new Set(employees.map(e => e.jobRole))].sort();
  return roles.map(role => {
    const group = employees.filter(e => e.jobRole === role);
    const salaries = group.map(e => e.monthlyIncome);
    const avg = salaries.reduce((s, v) => s + v, 0) / salaries.length;
    return {
      jobRole: role,
      avgSalary: parseFloat(avg.toFixed(0)),
      minSalary: Math.min(...salaries),
      maxSalary: Math.max(...salaries),
      count: group.length,
    };
  }).sort((a, b) => b.avgSalary - a.avgSalary);
}

export function computeSalaryDistribution() {
  const bands = ["< $3K", "$3K-$5K", "$5K-$8K", "$8K-$12K", "$12K+"];
  return bands.map(band => {
    const group = employees.filter(e => e.salaryBand === band);
    const attrited = group.filter(e => e.attrition === "Yes").length;
    return { band, count: group.length, attrited };
  });
}

export function computeJobSatisfaction() {
  const labels: Record<number, string> = { 1: "Low", 2: "Medium", 3: "High", 4: "Very High" };
  return [1, 2, 3, 4].map(score => {
    const group = employees.filter(e => e.jobSatisfaction === score);
    return {
      label: labels[score],
      score,
      count: group.length,
      percentage: parseFloat(((group.length / employees.length) * 100).toFixed(1)),
    };
  });
}

export function computePerformanceDistribution() {
  const labels: Record<number, string> = { 3: "Excellent", 4: "Outstanding" };
  return [3, 4].map(rating => {
    const group = employees.filter(e => e.performanceRating === rating);
    return {
      label: labels[rating],
      rating,
      count: group.length,
      percentage: parseFloat(((group.length / employees.length) * 100).toFixed(1)),
    };
  });
}

export function computeYearsAtCompany() {
  const bands = [
    { label: "0-1 years", min: 0, max: 1 },
    { label: "2-5 years", min: 2, max: 5 },
    { label: "6-10 years", min: 6, max: 10 },
    { label: "11-20 years", min: 11, max: 20 },
    { label: "20+ years", min: 21, max: 999 },
  ];
  return bands.map(({ label, min, max }) => {
    const group = employees.filter(e => e.yearsAtCompany >= min && e.yearsAtCompany <= max);
    const attrited = group.filter(e => e.attrition === "Yes").length;
    const avgSalary = group.length > 0 ? group.reduce((s, e) => s + e.monthlyIncome, 0) / group.length : 0;
    return {
      band: label,
      count: group.length,
      avgSalary: parseFloat(avgSalary.toFixed(0)),
      attritionRate: group.length > 0 ? parseFloat(((attrited / group.length) * 100).toFixed(2)) : 0,
    };
  });
}

export function computeOvertimeAttrition() {
  return ["Yes", "No"].map(overtime => {
    const group = employees.filter(e => e.overTime === overtime);
    const attrited = group.filter(e => e.attrition === "Yes").length;
    return {
      overtime,
      total: group.length,
      attrited,
      attritionRate: parseFloat(((attrited / group.length) * 100).toFixed(2)),
    };
  });
}

export function computeDepartmentHeadcount() {
  const depts = [...new Set(employees.map(e => e.department))].sort();
  return depts.map(dept => {
    const group = employees.filter(e => e.department === dept);
    return {
      department: dept,
      total: group.length,
      male: group.filter(e => e.gender === "Male").length,
      female: group.filter(e => e.gender === "Female").length,
    };
  });
}

export function computeEducationAnalysis() {
  const labels: Record<number, string> = {
    1: "Below College",
    2: "College",
    3: "Bachelor",
    4: "Master",
    5: "Doctor",
  };
  return [1, 2, 3, 4, 5].map(level => {
    const group = employees.filter(e => e.education === level);
    const attrited = group.filter(e => e.attrition === "Yes").length;
    return {
      level,
      label: labels[level],
      count: group.length,
      attritionRate: group.length > 0 ? parseFloat(((attrited / group.length) * 100).toFixed(2)) : 0,
    };
  });
}

export function computeFilterOptions() {
  return {
    departments: [...new Set(employees.map(e => e.department))].sort(),
    genders: [...new Set(employees.map(e => e.gender))].sort(),
    jobRoles: [...new Set(employees.map(e => e.jobRole))].sort(),
    educationLevels: ["1", "2", "3", "4", "5"],
  };
}
