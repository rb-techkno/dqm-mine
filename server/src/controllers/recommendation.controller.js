import { getRecommendations, queryAiAgent } from "../services/recommendationService.js";

export const recommendationsHandler = async (_req, res) => {
  try {
    console.log("Inside recommendations handler \n");
    const data = await getRecommendations();
    // console.log(data);
    return res.status(200).json(data);
  } catch (_error) {
    console.log(_error);
    return res.status(200).json({
      recommendations: [
        {
          title: "Encrypt Sensitive Columns",
          description: "Analyze finding on critical columns and take corrective action.",
          impact: "High",
          category: "Security",
          action: "Analyze",
        },
        {
          title: "Reduce Null Values",
          description: "Reduce null values in critical fields for better quality.",
          impact: "Medium",
          category: "Quality",
          action: "Analyze",
        },
        {
          title: "Primary Key Uniqueness",
          description: "Add uniqueness constraints on key identifiers to prevent duplicates.",
          impact: "High",
          category: "Quality",
          action: "Analyze",
        },
      ],
    });
  }
};

export const aiAgentHandler = async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) {
      return res.status(400).json({ message: "Question is required" });
    }
    const response = await queryAiAgent(question);
    return res.status(200).json({ response });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
