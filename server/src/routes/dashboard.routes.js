import { Router } from "express";
import { getDashboard } from "../controllers/dashboard.controller.js";
import { getDataQualityReport } from "../services/dataQuality.js";

const dashboardRouter = Router();

dashboardRouter.get("/dashboard", getDashboard);
dashboardRouter.get("/ai-insights", getDataQualityReport);

export default dashboardRouter;
