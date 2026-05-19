import { Router } from "express";
import { config } from "../config/env.js";

const healthRouter = Router();

healthRouter.get("/", (_req, res) => {
  res.json({
    status: "ok",
    app: "DataPulse IQ API",
    database: config.dbType,
    timestamp: new Date().toISOString(),
  });
});

export default healthRouter;
