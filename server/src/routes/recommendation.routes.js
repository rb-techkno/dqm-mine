import { Router } from "express";
import { recommendationsHandler, aiAgentHandler } from "../controllers/recommendation.controller.js";

const recommendationRouter = Router();

recommendationRouter.get("/recommendations", recommendationsHandler);
recommendationRouter.post("/ai-agent", aiAgentHandler);

export default recommendationRouter;
