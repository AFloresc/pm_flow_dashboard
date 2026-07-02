import { useState, useMemo } from "react";
import { 
  Box, 
  Paper, 
  Typography, 
  Button, 
  CircularProgress, 
  Card, 
  CardContent, 
  Grid, 
  Divider,
  Alert,
  Chip
} from "@mui/material";
import { Project, Task, Resource } from "../types";
import { jsPDF } from "jspdf";
import { FileDown, Brain, TrendingUp, DollarSign, Clock, ShieldCheck, FileJson } from "lucide-react";

interface AutomatedReportingProps {
  project: Project;
  tasks: Task[];
  resources: Resource[];
}

export default function AutomatedReporting({ project, tasks, resources }: AutomatedReportingProps) {
  const [loading, setLoading] = useState(false);
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 1. Calculate project cost statistics
  const costStats = useMemo(() => {
    let plannedTotal = 0;
    let actualTotal = 0;

    tasks.forEach(t => {
      t.allocatedResources?.forEach(alloc => {
        const res = resources.find(r => r.id === alloc.resourceId);
        if (res) {
          const cost = alloc.allocatedHoursOrUnits * res.costRate;
          plannedTotal += cost;
          // If task has started, accumulate to actual total cost
          if (t.realStart) {
            actualTotal += cost;
          }
        }
      });
    });

    const budgetVariance = project.budget - actualTotal;

    return {
      plannedTotal,
      actualTotal,
      budgetVariance,
      isUnderBudget: budgetVariance >= 0
    };
  }, [project, tasks, resources]);

  // 2. Fetch Automated AI report from Server-side Gemini API
  const generateAiReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project, tasks, resources })
      });
      const data = await response.json();
      if (response.ok) {
        setAiReport(data.report);
      } else {
        throw new Error(data.error || "Failed to generate report");
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong generating AI optimizations.");
    } finally {
      setLoading(false);
    }
  };

  // 3. Export all data to JSON Format
  const handleExportJson = () => {
    const dataToExport = {
      exportedAt: new Date().toISOString(),
      project,
      resources,
      tasks
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dataToExport, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${project.name.toLowerCase().replace(/\s+/g, "_")}_report.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // 4. Export report to PDF Format
  const handleExportPdf = () => {
    const doc = new jsPDF();
    
    // Header styling
    doc.setFillColor(26, 115, 232); // Primary blue
    doc.rect(0, 0, 210, 40, "F");
    
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("PRO-FLOW PROJECT REPORT", 14, 18);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);
    doc.text(`Project Target: ${project.name}`, 14, 34);

    // Section 1: Overview
    doc.setTextColor(33, 33, 33);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("1. Executive Financial Summary", 14, 52);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(`Total Allocated Project Budget: $${project.budget.toLocaleString()}`, 14, 60);
    doc.text(`Estimated Resource Cost Plan: $${costStats.plannedTotal.toLocaleString()}`, 14, 66);
    doc.text(`Accrued Real Expenditures: $${costStats.actualTotal.toLocaleString()}`, 14, 72);
    
    const budgetStatusText = costStats.isUnderBudget 
      ? `Under Budget (Surplus of $${costStats.budgetVariance.toLocaleString()})`
      : `Budget Overrun (Deficit of $${Math.abs(costStats.budgetVariance).toLocaleString()})`;
    doc.text(`Financial Status: ${budgetStatusText}`, 14, 78);

    // Section 2: Resources List
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("2. Resource Cost Registry", 14, 92);

    let yOffset = 100;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    
    resources.forEach((r, idx) => {
      if (yOffset > 270) { doc.addPage(); yOffset = 20; }
      doc.text(`- [${r.type.toUpperCase()}] ${r.name} - Billing rate: $${r.costRate}/${r.unit}`, 16, yOffset);
      yOffset += 7;
    });

    // Section 3: Tasks and Progress
    yOffset += 5;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("3. Work Task Timelines & Progress", 14, yOffset);
    yOffset += 8;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    
    tasks.forEach((t) => {
      if (yOffset > 260) { doc.addPage(); yOffset = 20; }
      doc.setFont("helvetica", "bold");
      doc.text(`${t.title} (${t.status.toUpperCase()}) - ${t.progress}% completed`, 14, yOffset);
      doc.setFont("helvetica", "normal");
      doc.text(`Planned: ${t.expectedStart} to ${t.expectedFinish} | Real: ${t.realStart || "Pending"} to ${t.realFinish || "Pending"}`, 14, yOffset + 5);
      
      const allocatedNames = t.allocatedResources.map(a => {
        const resObj = resources.find(r => r.id === a.resourceId);
        return resObj ? `${resObj.name} (${a.allocatedHoursOrUnits} ${resObj.unit})` : "";
      }).filter(Boolean).join(", ");
      
      doc.text(`Allocated: ${allocatedNames || "None"}`, 14, yOffset + 10);
      yOffset += 16;
    });

    // Save File
    doc.save(`${project.name.toLowerCase().replace(/\s+/g, "_")}_report.pdf`);
  };

  // 5. Export Gemini AI optimization report to PDF Format
  const handleExportAiReportPdf = () => {
    if (!aiReport) return;

    const doc = new jsPDF();
    
    // Header styling
    doc.setFillColor(99, 102, 241); // Indigo primary color matching Bento Grid theme
    doc.rect(0, 0, 210, 40, "F");
    
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("GEMINI AI PROJECT AUDIT & INSIGHTS", 14, 18);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);
    doc.text(`Target Campaign: ${project.name}`, 14, 34);

    let yOffset = 52;
    doc.setTextColor(33, 33, 33);

    const lines = aiReport.split("\n");
    
    lines.forEach((line) => {
      let trimmed = line.trim();
      if (!trimmed) {
        yOffset += 4; // Spacing for empty lines
        return;
      }

      let fontSize = 10;
      let fontStyle = "normal";
      let text = trimmed;

      if (trimmed.startsWith("###")) {
        fontSize = 12;
        fontStyle = "bold";
        text = trimmed.replace("###", "").trim();
        yOffset += 4;
      } else if (trimmed.startsWith("##")) {
        fontSize = 14;
        fontStyle = "bold";
        text = trimmed.replace("##", "").trim();
        yOffset += 6;
      } else if (trimmed.startsWith("#")) {
        fontSize = 16;
        fontStyle = "bold";
        text = trimmed.replace("#", "").trim();
        yOffset += 8;
      } else if (trimmed.startsWith("-") || trimmed.startsWith("*")) {
        fontSize = 10;
        fontStyle = "normal";
        text = `• ${trimmed.substring(1).trim()}`;
      }

      doc.setFont("helvetica", fontStyle);
      doc.setFontSize(fontSize);

      const splitLines = doc.splitTextToSize(text, 182);
      splitLines.forEach((splitLine: string) => {
        if (yOffset > 275) {
          doc.addPage();
          yOffset = 20;
        }
        doc.text(splitLine, 14, yOffset);
        yOffset += fontSize * 0.5 + 3; // line height spacing
      });
    });

    doc.save(`${project.name.toLowerCase().replace(/\s+/g, "_")}_ai_analysis_report.pdf`);
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h5" fontWeight="bold">Automated Productivity & Audit Reports</Typography>
          <Typography variant="body2" color="text.secondary">
            Analyze time/budget variations, optimization advice, and compile exportable packages.
          </Typography>
        </Box>
        <Box display="flex" gap={1.5}>
          <Button
            variant="outlined"
            startIcon={<FileJson size={16} />}
            onClick={handleExportJson}
            sx={{ textTransform: "none" }}
          >
            Export JSON
          </Button>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<FileDown size={16} />}
            onClick={handleExportPdf}
            sx={{ textTransform: "none" }}
          >
            Export PDF Report
          </Button>
        </Box>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, borderRadius: 2, textAlign: "center", boxShadow: 1 }}>
            <Typography variant="caption" color="text.secondary">Project Budget</Typography>
            <Typography variant="h5" fontWeight="bold" mt={0.5}>
              ${project.budget.toLocaleString()}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, borderRadius: 2, textAlign: "center", boxShadow: 1 }}>
            <Typography variant="caption" color="text.secondary">Resource Spend Plan</Typography>
            <Typography variant="h5" fontWeight="bold" color="primary.main" mt={0.5}>
              ${costStats.plannedTotal.toLocaleString()}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, borderRadius: 2, textAlign: "center", boxShadow: 1 }}>
            <Typography variant="caption" color="text.secondary">Accrued Spend</Typography>
            <Typography variant="h5" fontWeight="bold" color="secondary.main" mt={0.5}>
              ${costStats.actualTotal.toLocaleString()}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, borderRadius: 2, textAlign: "center", boxShadow: 1 }}>
            <Typography variant="caption" color="text.secondary">Budget Surplus</Typography>
            <Typography 
              variant="h5" 
              fontWeight="bold" 
              color={costStats.isUnderBudget ? "success.main" : "error.main"}
              mt={0.5}
            >
              ${costStats.budgetVariance.toLocaleString()}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Gemini AI Optimization section */}
      <Card sx={{ boxShadow: 3, borderRadius: 2, overflow: "hidden" }}>
        <Box sx={{ bgcolor: "primary.main", color: "primary.contrastText", p: 2.5, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1.5 }}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <Brain size={24} />
            <Box>
              <Typography variant="subtitle1" fontWeight="bold">Gemini AI Project Optimization Insights</Typography>
              <Typography variant="caption" sx={{ opacity: 0.85 }}>
                Intelligently audit project velocity, budget overruns, resource bottlenecks, and team optimization plans.
              </Typography>
            </Box>
          </Box>
          {aiReport && (
            <Button
              variant="contained"
              color="secondary"
              startIcon={<FileDown size={16} />}
              onClick={handleExportAiReportPdf}
              sx={{ textTransform: "none", color: "white" }}
            >
              Export AI PDF
            </Button>
          )}
        </Box>

        <CardContent sx={{ p: 3, display: "flex", flexDirection: "column", gap: 3 }}>
          {error && <Alert severity="error">{error}</Alert>}

          {loading ? (
            <Box display="flex" flexDirection="column" alignItems="center" py={6} gap={2}>
              <CircularProgress color="primary" />
              <Typography variant="body2" color="text.secondary">
                Analyzing project logs, allocations, and timeline deviations...
              </Typography>
              <Typography variant="caption" color="text.disabled" sx={{ fontStyle: "italic" }}>
                "Auditing critical path sequential dependency chains..."
              </Typography>
            </Box>
          ) : aiReport ? (
            <Box>
              <Box className="markdown-body text-slate-200 leading-relaxed bg-slate-900/50 p-4 rounded-xl border border-slate-800" style={{ fontSize: "0.95rem" }}>
                {/* Visual markdown rendering helper */}
                {aiReport.split("\n").map((line, idx) => {
                  if (line.startsWith("###")) {
                    return <Typography key={idx} variant="h6" sx={{ fontWeight: "bold", mt: 2, mb: 1 }}>{line.replace("###", "")}</Typography>;
                  }
                  if (line.startsWith("##")) {
                    return <Typography key={idx} variant="subtitle1" sx={{ fontWeight: "bold", color: "primary.main", mt: 3, mb: 1 }}>{line.replace("##", "")}</Typography>;
                  }
                  if (line.startsWith("#")) {
                    return <Typography key={idx} variant="h5" sx={{ fontWeight: "bold", color: "primary.light", mt: 3, mb: 1 }}>{line.replace("#", "")}</Typography>;
                  }
                  if (line.startsWith("-") || line.startsWith("*")) {
                    return <Typography key={idx} variant="body2" sx={{ ml: 2, display: "list-item" }}>{line.substring(2)}</Typography>;
                  }
                  return <Typography key={idx} variant="body2" sx={{ mb: 1 }}>{line}</Typography>;
                })}
              </Box>
              <Box display="flex" gap={1.5} sx={{ mt: 3 }}>
                <Button 
                  variant="outlined" 
                  color="primary" 
                  onClick={generateAiReport} 
                  sx={{ textTransform: "none" }}
                  startIcon={<Brain size={16} />}
                >
                  Regenerate AI Analysis
                </Button>
                <Button 
                  variant="contained" 
                  color="secondary" 
                  onClick={handleExportAiReportPdf} 
                  sx={{ textTransform: "none", color: "white" }}
                  startIcon={<FileDown size={16} />}
                >
                  Export AI PDF
                </Button>
              </Box>
            </Box>
          ) : (
            <Box py={4} textAlign="center">
              <Typography variant="body2" color="text.secondary" mb={2}>
                No AI Analysis compiled yet. Run the Gemini Audit to instantly generate optimized team capacity recommendations.
              </Typography>
              <Button
                variant="contained"
                onClick={generateAiReport}
                startIcon={<Brain size={18} />}
                sx={{ textTransform: "none" }}
              >
                Generate Gemini Audit
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
