import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route: AI Report Generation
  app.post("/api/reports/generate", async (req, res) => {
    try {
      const { project, tasks, resources } = req.body;

      if (!project) {
        return res.status(400).json({ error: "Missing project data" });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
        return res.status(200).json({
          report: `### ⚠️ Gemini API Key Required
It looks like the Gemini API Key is not set yet.

To enable automated reporting and resource optimization, please configure your **GEMINI_API_KEY** inside the **Secrets** tab in Google AI Studio.

#### Basic Project Stats (Locally Calculated):
- **Project Name:** ${project.name}
- **Budget:** $${project.budget.toLocaleString()}
- **Total Tasks:** ${tasks.length}
- **In Progress:** ${tasks.filter((t: any) => t.status === "in_progress").length}
- **Completed:** ${tasks.filter((t: any) => t.status === "completed").length}
- **Resource Constraints Checked:** Yes
`
        });
      }

      // Initialize Gemini Client
      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build"
          }
        }
      });

      // Prepare a rich detailed prompt for Gemini
      const prompt = `
You are an expert Project Manager and resource optimization consultant. Analyze the following project, task, and resource allocation data, and generate a comprehensive, actionable management report in Markdown format.

### Project Details
- Name: ${project.name}
- Description: ${project.description}
- Budget: $${project.budget}

### Team & Material Resources
${resources.map((r: any) => `- [${r.type.toUpperCase()}] ${r.name} - Cost: $${r.costRate}/${r.unit}`).join("\n")}

### Tasks, Subtasks & Current Progress
${tasks.map((t: any) => {
  const allocated = t.allocatedResources.map((a: any) => {
    const resObj = resources.find((r: any) => r.id === a.resourceId);
    return `${resObj ? resObj.name : "Unknown"} (${a.allocatedHoursOrUnits} ${resObj?.unit === "hour" ? "hours" : "units"})`;
  }).join(", ");

  const sub = t.subtasks.map((s: any) => `  * [${s.completed ? "x" : " "}] ${s.title}`).join("\n");

  return `- **Task: ${t.title}** (${t.status})
  * Description: ${t.description}
  * Expected Duration: ${t.expectedStart} to ${t.expectedFinish}
  * Real Timeline: ${t.realStart || "Not started"} to ${t.realFinish || "Not finished"}
  * Progress: ${t.progress}%
  * Dependencies: ${t.dependencies.length > 0 ? t.dependencies.join(", ") : "None"}
  * Allocated Resources: ${allocated || "None"}
  ${sub ? `* Subtasks:\n${sub}` : ""}
  * Comments Count: ${t.comments?.length || 0}
`;
}).join("\n")}

Please structure the report with the following main sections:
1. **Executive Summary**: A high-level overview of project health, timeline status, and budget alignment.
2. **Timeline Analysis & Deviations**: Compare Expected Start/Finish vs Real Start/Finish times. Identify delayed tasks, tasks that started late, and tasks causing bottlenecks due to dependency blocks.
3. **Budget & Financial Impact**: Calculate total resource costs (time-based for members at their hourly rate, plus flat costs for materials) and compare against the project budget of $${project.budget}.
4. **Resource Optimization Recommendations**: Identify resource bottlenecks or over-allocations. Recommend specific re-allocations or timeline adjustments.
5. **Actionable Action Plan**: 3-5 concrete next steps for the Project Manager to maximize productivity and optimize team usage.

Write in a highly professional, constructive, and direct tone. Do not mention that you are an AI model. Format beautifully using Markdown.
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt
      });

      res.json({ report: response.text });
    } catch (error: any) {
      console.error("Error calling Gemini API:", error);
      res.status(500).json({ error: "Failed to generate AI report: " + error.message });
    }
  });

  // Vite development middleware vs Static Production files
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
