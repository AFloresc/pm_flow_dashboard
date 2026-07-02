import { useMemo } from "react";
import { 
  Box, 
  Paper, 
  Typography, 
  Tooltip, 
  Card, 
  CardContent, 
  Chip, 
  Divider,
  Alert
} from "@mui/material";
import { Task } from "../types";
import { Clock, Info, AlertTriangle, ArrowRight } from "lucide-react";

interface GanttChartProps {
  tasks: Task[];
  onSelectTask?: (task: Task) => void;
}

export default function GanttChart({ tasks, onSelectTask }: GanttChartProps) {
  // Sort tasks by expected start date to make Gantt logical
  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => a.expectedStart.localeCompare(b.expectedStart));
  }, [tasks]);

  // Determine timeline boundary dates
  const bounds = useMemo(() => {
    if (tasks.length === 0) {
      const today = new Date();
      const thirtyDays = new Date();
      thirtyDays.setDate(today.getDate() + 30);
      return {
        minDate: today.toISOString().split("T")[0],
        maxDate: thirtyDays.toISOString().split("T")[0],
        totalDays: 30
      };
    }

    let min = "9999-12-31";
    let max = "0000-01-01";

    tasks.forEach(t => {
      if (t.expectedStart < min) min = t.expectedStart;
      if (t.realStart && t.realStart < min) min = t.realStart;

      if (t.expectedFinish > max) max = t.expectedFinish;
      if (t.realFinish && t.realFinish > max) max = t.realFinish;
    });

    // Pad 2 days on each end for layout buffer
    const minD = new Date(min);
    minD.setDate(minD.getDate() - 2);
    const maxD = new Date(max);
    maxD.setDate(maxD.getDate() + 4);

    const padMin = minD.toISOString().split("T")[0];
    const padMax = maxD.toISOString().split("T")[0];

    const diffTime = Math.abs(maxD.getTime() - minD.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return {
      minDate: padMin,
      maxDate: padMax,
      totalDays: diffDays || 30
    };
  }, [tasks]);

  // Grid headers/dates helper
  const dateGrid = useMemo(() => {
    const dates = [];
    const current = new Date(bounds.minDate);
    const end = new Date(bounds.maxDate);

    while (current <= end) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return dates;
  }, [bounds]);

  // Calculate pixel positions based on standard grid cell width (e.g., 40px per day)
  const cellWidth = 45;
  const rowHeight = 75;
  const listWidth = 240;
  const gridWidth = dateGrid.length * cellWidth;

  const dateToX = (dateStr: string) => {
    const d = new Date(dateStr);
    const minD = new Date(bounds.minDate);
    const diffTime = d.getTime() - minD.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return diffDays * cellWidth;
  };

  // Difference calculator for timelines
  const getTimelineDeviation = (task: Task) => {
    const expStart = new Date(task.expectedStart);
    const expFinish = new Date(task.expectedFinish);
    const expDuration = Math.ceil((expFinish.getTime() - expStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    if (!task.realStart) return { text: "Not started", status: "planning", days: 0 };

    const realStart = new Date(task.realStart);
    const realFinish = task.realFinish ? new Date(task.realFinish) : new Date(); // use today if ongoing
    const realDuration = Math.ceil((realFinish.getTime() - realStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const diff = realDuration - expDuration;

    if (task.status === "completed") {
      if (diff > 0) return { text: `${diff} day(s) delayed`, status: "delayed", days: diff };
      if (diff < 0) return { text: `${Math.abs(diff)} day(s) early`, status: "early", days: diff };
      return { text: "On schedule", status: "on_schedule", days: 0 };
    } else {
      // ongoing
      const startDiff = Math.ceil((realStart.getTime() - expStart.getTime()) / (1000 * 60 * 60 * 24));
      if (startDiff > 0) return { text: `Started ${startDiff} day(s) late`, status: "delayed", days: startDiff };
      return { text: "In progress", status: "in_progress", days: 0 };
    }
  };

  return (
    <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Box>
          <Typography variant="h6" fontWeight="bold">Interactive SVG Gantt Chart</Typography>
          <Typography variant="caption" color="text.secondary">
            Visualizing Expected (blue) vs Real (orange/green) workflows and sequential dependencies.
          </Typography>
        </Box>
        <Box display="flex" gap={2} flexWrap="wrap">
          <Box display="flex" alignItems="center" gap={0.5}>
            <Box width={16} height={10} bgcolor="primary.light" borderRadius={0.5} />
            <Typography variant="caption">Expected Plan</Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={0.5}>
            <Box width={16} height={10} bgcolor="success.light" borderRadius={0.5} />
            <Typography variant="caption">Completed Work</Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={0.5}>
            <Box width={16} height={10} bgcolor="warning.light" borderRadius={0.5} />
            <Typography variant="caption">Delayed/In Progress</Typography>
          </Box>
        </Box>
      </Box>

      {tasks.length === 0 ? (
        <Alert severity="info">No tasks registered. Create a task to populate the Gantt Chart timeline.</Alert>
      ) : (
        <Box sx={{ overflowX: "auto", border: 1, borderColor: "divider", borderRadius: 1 }}>
          <Box sx={{ display: "flex", width: listWidth + gridWidth }}>
            
            {/* Task Names List Column */}
            <Box sx={{ width: listWidth, flexShrink: 0, borderRight: 1, borderColor: "divider", bgcolor: "background.default" }}>
              <Box sx={{ height: 45, display: "flex", alignItems: "center", px: 2, borderBottom: 1, borderColor: "divider", fontWeight: "bold" }}>
                Task Name
              </Box>
              {sortedTasks.map((t, idx) => {
                const dev = getTimelineDeviation(t);
                return (
                  <Box 
                    key={t.id} 
                    onClick={() => onSelectTask?.(t)}
                    sx={{ 
                      height: rowHeight, 
                      display: "flex", 
                      flexDirection: "column",
                      justifyContent: "center",
                      px: 2, 
                      borderBottom: 1, 
                      borderColor: "divider",
                      cursor: "pointer",
                      "&:hover": { bgcolor: "action.hover" }
                    }}
                  >
                    <Typography variant="body2" fontWeight="medium" noWrap sx={{ maxWidth: listWidth - 25 }}>
                      {t.title}
                    </Typography>
                    
                    <Box display="flex" alignItems="center" gap={0.5} mt={0.5}>
                      <Chip 
                        size="small" 
                        label={dev.text} 
                        color={
                          dev.status === "delayed" ? "warning" : 
                          dev.status === "early" ? "success" : 
                          dev.status === "completed" ? "success" : "default"
                        }
                        sx={{ fontSize: "0.65rem", height: 16 }}
                      />
                    </Box>
                  </Box>
                );
              })}
            </Box>

            {/* Timeline Cells & Gantt SVG Blocks */}
            <Box sx={{ position: "relative", width: gridWidth }}>
              {/* Day dates row */}
              <Box sx={{ height: 45, display: "flex", borderBottom: 1, borderColor: "divider", bgcolor: "background.paper" }}>
                {dateGrid.map((date, idx) => {
                  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                  return (
                    <Box 
                      key={idx} 
                      sx={{ 
                        width: cellWidth, 
                        flexShrink: 0, 
                        borderRight: 1, 
                        borderColor: "divider",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.7rem",
                        bgcolor: isWeekend ? "rgba(255, 255, 255, 0.05)" : "transparent"
                      }}
                    >
                      <span className="font-semibold">{date.getDate()}</span>
                      <span className="text-[0.6rem] text-gray-400">
                        {date.toLocaleDateString("en", { weekday: "short" }).substring(0, 1)}
                      </span>
                    </Box>
                  );
                })}
              </Box>

              {/* Grid Background Lines & Task Rows */}
              <Box sx={{ position: "relative", height: sortedTasks.length * rowHeight }}>
                {/* Vertical columns */}
                <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex", pointerEvents: "none" }}>
                  {dateGrid.map((date, idx) => {
                    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                    return (
                      <Box 
                        key={idx} 
                        sx={{ 
                          width: cellWidth, 
                          height: "100%", 
                          flexShrink: 0, 
                          borderRight: 1, 
                          borderColor: "divider",
                          bgcolor: isWeekend ? "rgba(255, 255, 255, 0.02)" : "transparent"
                        }}
                      />
                    );
                  })}
                </Box>

                {/* SVG for Dependencies & Connectors */}
                <svg 
                  style={{ 
                    position: "absolute", 
                    top: 0, 
                    left: 0, 
                    width: "100%", 
                    height: "100%", 
                    pointerEvents: "none",
                    zIndex: 10
                  }}
                >
                  <defs>
                    <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 1 L 10 5 L 0 9 z" fill="#64748b" />
                    </marker>
                  </defs>

                  {/* Draw dependency links */}
                  {sortedTasks.map((t, idx) => {
                    if (!t.dependencies || t.dependencies.length === 0) return null;
                    
                    const rowY = idx * rowHeight + rowHeight / 2;
                    const endX = dateToX(t.expectedStart);

                    return t.dependencies.map(depId => {
                      const predecessorIdx = sortedTasks.findIndex(st => st.id === depId);
                      if (predecessorIdx === -1) return null;

                      const predTask = sortedTasks[predecessorIdx];
                      const predY = predecessorIdx * rowHeight + rowHeight / 2;
                      const predEndX = dateToX(predTask.expectedFinish) + cellWidth; // finish block

                      // Create a clean orthogonal path arrow
                      const midX = predEndX + (endX - predEndX) / 2;
                      return (
                        <path
                          key={`${predTask.id}-${t.id}`}
                          d={`M ${predEndX} ${predY - 5} L ${midX} ${predY - 5} L ${midX} ${rowY} L ${endX} ${rowY}`}
                          fill="none"
                          stroke="#64748b"
                          strokeWidth={1.5}
                          strokeDasharray="4 2"
                          markerEnd="url(#arrow)"
                        />
                      );
                    });
                  })}
                </svg>

                {/* Task Bars Overlay */}
                {sortedTasks.map((t, idx) => {
                  const topOffset = idx * rowHeight;
                  
                  // 1. Calculate Expected Plan Position
                  const expStartX = dateToX(t.expectedStart);
                  const expEndX = dateToX(t.expectedFinish) + cellWidth;
                  const expWidth = Math.max(expEndX - expStartX, cellWidth);

                  // 2. Calculate Real Progress Position (if started)
                  const hasStarted = !!t.realStart;
                  const realStartX = hasStarted ? dateToX(t.realStart!) : 0;
                  const realEndX = hasStarted 
                    ? (t.realFinish ? dateToX(t.realFinish) + cellWidth : dateToX(new Date().toISOString().split("T")[0]) + cellWidth)
                    : 0;
                  const realWidth = hasStarted ? Math.max(realEndX - realStartX, cellWidth) : 0;

                  return (
                    <Box 
                      key={t.id} 
                      onClick={() => onSelectTask?.(t)}
                      sx={{ 
                        position: "absolute", 
                        top: topOffset, 
                        left: 0, 
                        right: 0, 
                        height: rowHeight, 
                        borderBottom: 1, 
                        borderColor: "divider",
                        display: "flex",
                        alignItems: "center",
                        cursor: "pointer"
                      }}
                    >
                      {/* Plan / Expected Task Bar (Upper Thin Bar) */}
                      <Tooltip 
                        title={`Plan: ${t.expectedStart} to ${t.expectedFinish}`} 
                        arrow
                      >
                        <Box 
                          sx={{ 
                            position: "absolute",
                            left: expStartX,
                            width: expWidth,
                            height: 14,
                            bgcolor: "primary.light",
                            borderRadius: 1,
                            top: 14,
                            opacity: 0.85,
                            display: "flex",
                            alignItems: "center",
                            px: 1,
                            boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                            zIndex: 5
                          }}
                        >
                          <Typography variant="caption" sx={{ fontSize: "0.6rem", color: "primary.dark", fontWeight: "bold" }}>
                            Plan
                          </Typography>
                        </Box>
                      </Tooltip>

                      {/* Actual / Real Work Bar (Lower Thick Progress Bar) */}
                      {hasStarted ? (
                        <Tooltip 
                          title={`Actual/Current: ${t.realStart} to ${t.realFinish || "Ongoing"} (${t.progress}% Progress)`}
                          arrow
                        >
                          <Box 
                            sx={{ 
                              position: "absolute",
                              left: realStartX,
                              width: realWidth,
                              height: 22,
                              bgcolor: t.status === "completed" ? "success.light" : "warning.light",
                              borderRadius: 1,
                              top: 34,
                              display: "flex",
                              alignItems: "center",
                              overflow: "hidden",
                              boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
                              zIndex: 6
                            }}
                          >
                            {/* Visual Progress Sub-Bar */}
                            <Box 
                              sx={{ 
                                width: `${t.progress}%`, 
                                height: "100%", 
                                bgcolor: t.status === "completed" ? "success.main" : "warning.main",
                                transition: "width 0.5s ease"
                              }} 
                            />
                            {/* Percentage overlay */}
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                position: "absolute", 
                                left: 8, 
                                fontWeight: "bold", 
                                color: "common.white",
                                textShadow: "0 1px 1px rgba(0,0,0,0.4)",
                                fontSize: "0.65rem"
                              }}
                            >
                              {t.progress}%
                            </Typography>
                          </Box>
                        </Tooltip>
                      ) : (
                        <Box 
                          sx={{ 
                            position: "absolute",
                            left: expStartX,
                            height: 20,
                            top: 34,
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                            color: "text.disabled",
                            zIndex: 4
                          }}
                        >
                          <Clock size={12} />
                          <Typography variant="caption" sx={{ fontSize: "0.65rem", fontStyle: "italic" }}>
                            Waiting to start
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  );
                })}
              </Box>
            </Box>

          </Box>
        </Box>
      )}
    </Paper>
  );
}
