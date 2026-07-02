import { z } from "zod";
import {
  profileAgeRanges,
  profileEmploymentTypes,
  profileInvestmentExperience,
  profileRiskProfiles,
} from "./types";

export const decisionProfileSchema = z.object({
  ageRange: z.enum(profileAgeRanges).optional(),
  city: z.string().trim().min(1).max(120).optional(),
  state: z.string().trim().min(1).max(120).optional(),
  country: z.string().trim().min(1).max(120).optional(),
  dependents: z.number().int().min(0).optional(),
  occupation: z.string().trim().min(1).max(120).optional(),
  employmentType: z.enum(profileEmploymentTypes).optional(),
  monthlyIncome: z.number().min(0).optional(),
  monthlyExpenses: z.number().min(0).optional(),
  emergencyFund: z.number().min(0).optional(),
  assets: z.number().min(0).optional(),
  liabilities: z.number().min(0).optional(),
  activeLoans: z.number().min(0).optional(),
  monthlyEmis: z.number().min(0).optional(),
  goals: z.array(z.string().trim().min(1).max(120)).max(20).optional(),
  riskProfile: z.enum(profileRiskProfiles).optional(),
  investmentExperience: z.enum(profileInvestmentExperience).optional(),
  preferredCurrency: z.string().trim().min(1).max(8).optional(),
  preferredLanguage: z.string().trim().min(1).max(16).optional(),
  source: z.enum(["anonymous", "local", "cloud"]).optional(),
  cloudHistoryCount: z.number().int().min(0).optional(),
  updatedAt: z.string().optional(),
}).strict();

export const decisionProfileEnvelopeSchema = z.object({
  profile: decisionProfileSchema.optional(),
  lastOpenedWorkflow: z.object({
    workflowId: z.string(),
    pluginId: z.string(),
    slug: z.string(),
    openedAt: z.string(),
  }).optional(),
  updatedAt: z.string().optional(),
}).passthrough();
