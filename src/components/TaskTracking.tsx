import { useState } from "react";
import { 
  Box, 
  Paper, 
  Typography, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemSecondaryAction,
  Button, 
  TextField, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel,
  Checkbox,
  Slider,
  IconButton,
  Chip,
  Grid,
  Divider,
  Card,
  CardContent,
  Tab,
  Tabs,
  Alert,
  Tooltip
} from "@mui/material";
import { Task, Resource, SubTask, Comment, AppUser } from "../types";
import { 
  Plus, 
  CheckSquare, 
  Clock, 
  User, 
  MessageSquare, 
  PlusCircle, 
  Trash2, 
  Edit, 
  AlertTriangle,
  Play,
  CheckCircle,
  HelpCircle,
  Check,
  Calendar,
  Layers
} from "lucide-react";

interface TaskTrackingProps {
  tasks: Task[];
  resources: Resource[];
  currentUser: AppUser;
  onAddTask: (t: Task) => void;
  onUpdateTask: (t: Task) => void;
  onDeleteTask: (id: string) => void;
  selectedTaskFromDashboard?: Task | null;
  onClearSelectedTask?: () => void;
}

export default function TaskTracking({
  tasks,
  resources,
  currentUser,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  selectedTaskFromDashboard,
  onClearSelectedTask
}: TaskTrackingProps) {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  // Dialog controls
  const [open, setOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [expectedStart, setExpectedStart] = useState("");
  const [expectedFinish, setExpectedFinish] = useState("");
  const [realStart, setRealStart] = useState("");
  const [realFinish, setRealFinish] = useState("");
  const [progress, setProgress] = useState<number>(0);
  const [status, setStatus] = useState<Task["status"]>("planning");
  const [dependencies, setDependencies] = useState<string[]>([]);
  const [allocatedResources, setAllocatedResources] = useState<{ resourceId: string; allocatedHoursOrUnits: number }[]>([]);

  // Subtask form
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");

  // Comment input
  const [commentText, setCommentText] = useState("");

  const activeTaskId = selectedTaskFromDashboard?.id || selectedTaskId || (tasks.length > 0 ? tasks[0].id : null);
  const activeTask = tasks.find(t => t.id === activeTaskId);

  // Filter tasks
  const filteredTasks = tasks.filter(t => {
    const matchSearch = t.title.toLowerCase().includes(search.toLowerCase()) || 
                        t.description.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const isManager = currentUser.role === "manager";

  // Check if dependencies are completed
  const checkDependenciesCompleted = (task: Task) => {
    if (!task.dependencies || task.dependencies.length === 0) return { ok: true, blockers: [] };
    
    const uncompletedBlockers = task.dependencies
      .map(depId => tasks.find(t => t.id === depId))
      .filter(depTask => depTask && depTask.status !== "completed");

    return {
      ok: uncompletedBlockers.length === 0,
      blockers: uncompletedBlockers.map(b => b?.title || "Unknown Task")
    };
  };

  const handleOpenDialog = (t?: Task) => {
    if (t) {
      setEditingTask(t);
      setTitle(t.title);
      setDescription(t.description);
      setExpectedStart(t.expectedStart);
      setExpectedFinish(t.expectedFinish);
      setRealStart(t.realStart || "");
      setRealFinish(t.realFinish || "");
      setProgress(t.progress);
      setStatus(t.status);
      setDependencies(t.dependencies || []);
      setAllocatedResources(t.allocatedResources || []);
    } else {
      setEditingTask(null);
      setTitle("");
      setDescription("");
      setExpectedStart(new Date().toISOString().split("T")[0]);
      setExpectedFinish(new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString().split("T")[0]);
      setRealStart("");
      setRealFinish("");
      setProgress(0);
      setStatus("planning");
      setDependencies([]);
      setAllocatedResources([]);
    }
    setOpen(true);
  };

  const handleSaveTask = () => {
    if (!title.trim() || !expectedStart || !expectedFinish) return;

    const taskData: Task = {
      id: editingTask ? editingTask.id : `t-${Date.now()}`,
      projectId: editingTask ? editingTask.projectId : "p1", // bind to default project p1
      title,
      description,
      expectedStart,
      expectedFinish,
      realStart: realStart || undefined,
      realFinish: realFinish || undefined,
      progress,
      status,
      dependencies,
      allocatedResources,
      subtasks: editingTask ? editingTask.subtasks : [],
      comments: editingTask ? editingTask.comments : []
    };

    if (editingTask) {
      onUpdateTask(taskData);
    } else {
      onAddTask(taskData);
    }
    setOpen(false);
  };

  // Add Comment
  const handleAddComment = () => {
    if (!commentText.trim() || !activeTask) return;

    const newComment: Comment = {
      id: `c-${Date.now()}`,
      text: commentText,
      username: currentUser.displayName,
      userId: currentUser.uid,
      createdAt: Date.now()
    };

    const updatedTask = {
      ...activeTask,
      comments: [...(activeTask.comments || []), newComment]
    };

    onUpdateTask(updatedTask);
    setCommentText("");
  };

  // Toggle Subtask
  const handleToggleSubtask = (subId: string) => {
    if (!activeTask) return;

    const updatedSubtasks = activeTask.subtasks.map(s => 
      s.id === subId ? { ...s, completed: !s.completed } : s
    );

    // Auto-calculate progress based on completed subtasks (optional recommendation)
    const completedCount = updatedSubtasks.filter(s => s.completed).length;
    const computedProgress = updatedSubtasks.length > 0 
      ? Math.round((completedCount / updatedSubtasks.length) * 100) 
      : activeTask.progress;

    const updatedTask = {
      ...activeTask,
      subtasks: updatedSubtasks,
      progress: computedProgress,
      status: computedProgress === 100 ? "completed" as const : activeTask.status
    };

    onUpdateTask(updatedTask);
  };

  // Add Subtask
  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim() || !activeTask) return;

    const newSub: SubTask = {
      id: `s-${Date.now()}`,
      title: newSubtaskTitle,
      completed: false
    };

    const updatedTask = {
      ...activeTask,
      subtasks: [...(activeTask.subtasks || []), newSub]
    };

    onUpdateTask(updatedTask);
    setNewSubtaskTitle("");
  };

  // Delete Subtask
  const handleDeleteSubtask = (subId: string) => {
    if (!activeTask) return;

    const updatedSubtasks = activeTask.subtasks.filter(s => s.id !== subId);
    const updatedTask = {
      ...activeTask,
      subtasks: updatedSubtasks
    };

    onUpdateTask(updatedTask);
  };

  // Allocation Handlers in form
  const handleAddResourceAllocation = (resId: string) => {
    if (!resId || allocatedResources.some(a => a.resourceId === resId)) return;
    setAllocatedResources([...allocatedResources, { resourceId: resId, allocatedHoursOrUnits: 10 }]);
  };

  const handleUpdateResourceHours = (resId: string, value: number) => {
    setAllocatedResources(allocatedResources.map(a => 
      a.resourceId === resId ? { ...a, allocatedHoursOrUnits: value } : a
    ));
  };

  const handleRemoveResourceAllocation = (resId: string) => {
    setAllocatedResources(allocatedResources.filter(a => a.resourceId !== resId));
  };

  // Timeline variance calculations
  const calculateTimelineVariance = (task: Task) => {
    const expStart = new Date(task.expectedStart);
    const expFinish = new Date(task.expectedFinish);
    const expDays = Math.ceil((expFinish.getTime() - expStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    if (!task.realStart) {
      return { text: "No actual dates recorded yet.", color: "text.secondary" };
    }

    const realStart = new Date(task.realStart);
    const realFinish = task.realFinish ? new Date(task.realFinish) : new Date();
    const realDays = Math.ceil((realFinish.getTime() - realStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const diff = realDays - expDays;

    if (diff > 0) {
      return { 
        text: `Completed in ${realDays} days (${diff} day(s) longer than the planned ${expDays} days).`, 
        color: "warning.main" 
      };
    } else if (diff < 0) {
      return { 
        text: `Completed in ${realDays} days (${Math.abs(diff)} day(s) faster than the planned ${expDays} days!).`, 
        color: "success.main" 
      };
    }
    return { 
      text: `Progress matches schedule perfectly (${realDays} days).`, 
      color: "success.main" 
    };
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Grid container spacing={3}>
        {/* Left pane: Task list */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, borderRadius: 2, display: "flex", flexDirection: "column", gap: 2, height: "78vh" }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6" fontWeight="bold">Active Work Tasks</Typography>
              {isManager && (
                <IconButton color="primary" onClick={() => handleOpenDialog()}>
                  <PlusCircle size={22} />
                </IconButton>
              )}
            </Box>

            <TextField
              size="small"
              label="Search Tasks..."
              fullWidth
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <Tabs 
              value={statusFilter} 
              onChange={(_e, v) => setStatusFilter(v)} 
              variant="scrollable"
              scrollButtons="auto"
              sx={{ minHeight: 35, "& .MuiTab-root": { minHeight: 35, py: 0.5, px: 1, fontSize: "0.75rem" } }}
            >
              <Tab label="All" value="all" />
              <Tab label="Planning" value="planning" />
              <Tab label="In Progress" value="in_progress" />
              <Tab label="Completed" value="completed" />
            </Tabs>

            <List sx={{ overflowY: "auto", flexGrow: 1, display: "flex", flexDirection: "column", gap: 1 }}>
              {filteredTasks.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: "center" }}>
                  No tasks match current search criteria.
                </Typography>
              ) : (
                filteredTasks.map((t) => {
                  const isActive = t.id === activeTaskId;
                  const depCheck = checkDependenciesCompleted(t);

                  return (
                    <ListItem 
                      key={t.id} 
                      onClick={() => {
                        setSelectedTaskId(t.id);
                        if (onClearSelectedTask) onClearSelectedTask();
                      }}
                      sx={{ 
                        borderRadius: 1, 
                        border: 1, 
                        borderColor: isActive ? "primary.main" : "divider",
                        bgcolor: isActive ? "rgba(99, 102, 241, 0.12)" : "transparent",
                        cursor: "pointer",
                        flexDirection: "column",
                        alignItems: "stretch",
                        p: 1.5,
                        "&:hover": { bgcolor: isActive ? "rgba(99, 102, 241, 0.18)" : "rgba(255, 255, 255, 0.04)" }
                      }}
                    >
                      <Box display="flex" justifyContent="space-between" alignItems="start">
                        <Typography variant="body2" fontWeight="bold" color={isActive ? "primary.main" : "text.primary"}>
                          {t.title}
                        </Typography>
                        <Chip 
                          label={t.status.replace("_", " ")} 
                          size="small" 
                          color={
                            t.status === "completed" ? "success" : 
                            t.status === "in_progress" ? "warning" : "default"
                          }
                          sx={{ height: 18, fontSize: "0.65rem" }}
                        />
                      </Box>
                      <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block", mt: 0.5 }}>
                        {t.description}
                      </Typography>

                      <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
                        <Box display="flex" alignItems="center" gap={0.5} className="text-gray-500 text-[0.7rem]">
                          <Calendar size={12} />
                          <span>{t.expectedStart} / {t.expectedFinish}</span>
                        </Box>
                        {!depCheck.ok && (
                          <Tooltip title={`Waiting for: ${depCheck.blockers.join(", ")}`} arrow>
                            <Box display="flex" alignItems="center" color="warning.main" gap={0.5}>
                              <AlertTriangle size={12} />
                              <span className="text-[0.65rem] font-bold">Blocked</span>
                            </Box>
                          </Tooltip>
                        )}
                      </Box>
                    </ListItem>
                  );
                })
              )}
            </List>
          </Paper>
        </Grid>

        {/* Right pane: Selected Task Details & Subtasks & Comments */}
        <Grid item xs={12} md={8}>
          {activeTask ? (
            <Paper sx={{ p: 3, borderRadius: 2, height: "78vh", display: "flex", flexDirection: "column", overflowY: "auto", gap: 3 }}>
              {/* Header block */}
              <Box display="flex" justifyContent="space-between" alignItems="start" flexWrap="wrap" gap={2}>
                <Box>
                  <Box display="flex" alignItems="center" gap={1.5} flexWrap="wrap">
                    <Typography variant="h5" fontWeight="bold">{activeTask.title}</Typography>
                    <Chip 
                      label={activeTask.status.replace("_", " ")} 
                      color={
                        activeTask.status === "completed" ? "success" : 
                        activeTask.status === "in_progress" ? "warning" : "default"
                      }
                      variant="filled"
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {activeTask.description}
                  </Typography>
                </Box>

                <Box display="flex" gap={1}>
                  {isManager && (
                    <>
                      <Button 
                        variant="outlined" 
                        size="small" 
                        startIcon={<Edit size={14} />} 
                        onClick={() => handleOpenDialog(activeTask)}
                        sx={{ textTransform: "none" }}
                      >
                        Edit Task
                      </Button>
                      <Button 
                        variant="outlined" 
                        color="error" 
                        size="small" 
                        startIcon={<Trash2 size={14} />} 
                        onClick={() => onDeleteTask(activeTask.id)}
                        sx={{ textTransform: "none" }}
                      >
                        Delete
                      </Button>
                    </>
                  )}
                </Box>
              </Box>

              <Divider />

              {/* Sequential / Parallel Dependency Blockers */}
              {(() => {
                const depCheck = checkDependenciesCompleted(activeTask);
                if (!depCheck.ok) {
                  return (
                    <Alert severity="warning" icon={<AlertTriangle />}>
                      <Typography variant="body2" fontWeight="bold">Pre-requisite / Predecessor Blockers:</Typography>
                      <Typography variant="caption">
                        This task cannot proceed because the following predecessor tasks are incomplete: <strong>{depCheck.blockers.join(", ")}</strong>.
                      </Typography>
                    </Alert>
                  );
                }
                return null;
              })()}

              <Grid container spacing={3}>
                {/* Progress, dependencies & Resources */}
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    {/* Progress Slider */}
                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 1.5 }}>
                      <Typography variant="subtitle2" fontWeight="bold" mb={1} display="flex" alignItems="center" gap={0.5}>
                        <CheckCircle size={16} className="text-green-500" />
                        Task Work Progress: {activeTask.progress}%
                      </Typography>
                      <Slider
                        value={activeTask.progress}
                        onChange={(_e, val) => {
                          const valNum = val as number;
                          onUpdateTask({
                            ...activeTask,
                            progress: valNum,
                            status: valNum === 100 ? "completed" : valNum > 0 ? "in_progress" : "planning"
                          });
                        }}
                        valueLabelDisplay="auto"
                        marks
                        min={0}
                        max={100}
                        color="primary"
                        disabled={!checkDependenciesCompleted(activeTask).ok && !isManager}
                      />
                    </Paper>

                    {/* Timeline variance comparison */}
                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 1.5 }}>
                      <Typography variant="subtitle2" fontWeight="bold" mb={1} display="flex" alignItems="center" gap={0.5}>
                        <Clock size={16} />
                        Plan vs. Actual Real-Time Comparison
                      </Typography>
                      <Grid container spacing={1} mb={2}>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">Expected Start / End</Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {activeTask.expectedStart} / {activeTask.expectedFinish}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">Actual Start / End</Typography>
                          <Typography variant="body2" fontWeight="bold" color="secondary.main">
                            {activeTask.realStart || "Pending"} / {activeTask.realFinish || "Pending"}
                          </Typography>
                        </Grid>
                      </Grid>
                      <Box sx={{ mt: 1, p: 1, bgcolor: "rgba(255, 255, 255, 0.03)", borderRadius: 1, border: "1px solid", borderColor: "divider" }}>
                        <Typography variant="caption" fontWeight="bold" sx={{ color: calculateTimelineVariance(activeTask).color }}>
                          {calculateTimelineVariance(activeTask).text}
                        </Typography>
                      </Box>
                    </Paper>

                    {/* Assigned Resources list */}
                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 1.5 }}>
                      <Typography variant="subtitle2" fontWeight="bold" mb={1.5} display="flex" alignItems="center" gap={0.5}>
                        <Layers size={16} />
                        Assigned Resources & Budgets
                      </Typography>
                      {activeTask.allocatedResources?.length === 0 ? (
                        <Typography variant="caption" color="text.secondary">No resources allocated to this task yet.</Typography>
                      ) : (
                        <Box display="flex" flexDirection="column" gap={1}>
                          {activeTask.allocatedResources.map(alloc => {
                            const resObj = resources.find(r => r.id === alloc.resourceId);
                            if (!resObj) return null;
                            const totalCost = alloc.allocatedHoursOrUnits * resObj.costRate;
                            return (
                              <Box 
                                key={alloc.resourceId} 
                                sx={{ bgcolor: "rgba(255, 255, 255, 0.03)", border: "1px solid", borderColor: "divider", width: "100%" }}
                                display="flex" 
                                justifyContent="space-between" 
                                alignItems="center" 
                                p={1} 
                                borderRadius={0.5}
                              >
                                <Typography variant="caption" fontWeight="semibold">{resObj.name}</Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {alloc.allocatedHoursOrUnits} {resObj.unit === "hour" ? "hrs" : "units"} (${totalCost.toLocaleString()})
                                </Typography>
                              </Box>
                            );
                          })}
                        </Box>
                      )}
                    </Paper>
                  </Box>
                </Grid>

                {/* Subtask Manager Checklists */}
                <Grid item xs={12} md={6}>
                  <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 1.5, height: "100%", display: "flex", flexDirection: "column" }}>
                    <Typography variant="subtitle2" fontWeight="bold" mb={2} display="flex" alignItems="center" gap={0.5}>
                      <CheckSquare size={16} /> Subtasks Checklist
                    </Typography>

                    <List sx={{ flexGrow: 1, overflowY: "auto", maxH: 220 }}>
                      {activeTask.subtasks?.length === 0 ? (
                        <Typography variant="caption" color="text.secondary">No subtasks defined yet.</Typography>
                      ) : (
                        activeTask.subtasks?.map(sub => (
                          <ListItem 
                            key={sub.id} 
                            dense 
                            sx={{ p: 0, mb: 0.5, borderBottom: "1px dashed", borderColor: "divider" }}
                          >
                            <Checkbox
                              checked={sub.completed}
                              onChange={() => handleToggleSubtask(sub.id)}
                              color="success"
                              disabled={!checkDependenciesCompleted(activeTask).ok && !isManager}
                            />
                            <ListItemText 
                              primary={sub.title} 
                              primaryTypographyProps={{ 
                                style: { 
                                  textDecoration: sub.completed ? "line-through" : "none",
                                  color: sub.completed ? "gray" : "inherit",
                                  fontSize: "0.85rem"
                                } 
                              }} 
                            />
                            {isManager && (
                              <ListItemSecondaryAction>
                                <IconButton size="small" color="error" onClick={() => handleDeleteSubtask(sub.id)}>
                                  <Trash2 size={14} />
                                </IconButton>
                              </ListItemSecondaryAction>
                            )}
                          </ListItem>
                        ))
                      )}
                    </List>

                    <Box display="flex" gap={1} mt={2}>
                      <TextField
                        size="small"
                        label="Add subtask..."
                        fullWidth
                        value={newSubtaskTitle}
                        onChange={(e) => setNewSubtaskTitle(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAddSubtask()}
                      />
                      <Button variant="contained" onClick={handleAddSubtask} size="small" sx={{ textTransform: "none" }}>
                        Add
                      </Button>
                    </Box>
                  </Paper>
                </Grid>
              </Grid>

              <Divider />

              {/* Task Comments System */}
              <Box>
                <Typography variant="subtitle2" fontWeight="bold" mb={1.5} display="flex" alignItems="center" gap={0.5}>
                  <MessageSquare size={16} /> Integrated Comments Feed ({activeTask.comments?.length || 0})
                </Typography>

                <Box display="flex" flexDirection="column" gap={1.5} sx={{ maxHeight: 200, overflowY: "auto", mb: 2, p: 1 }}>
                  {activeTask.comments?.length === 0 ? (
                    <Typography variant="caption" color="text.secondary">No comments yet. Start the conversation!</Typography>
                  ) : (
                    activeTask.comments?.map(c => (
                      <Box key={c.id} sx={{ bgcolor: "rgba(255, 255, 255, 0.04)", p: 1.5, borderRadius: 1.5, position: "relative", border: "1px solid", borderColor: "divider" }}>
                        <Box display="flex" justifyContent="space-between" mb={0.5}>
                          <Typography variant="caption" fontWeight="bold" color="primary.main">{c.username}</Typography>
                          <Typography variant="caption" color="text.disabled">
                            {new Date(c.createdAt).toLocaleString()}
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ fontSize: "0.85rem" }}>{c.text}</Typography>
                      </Box>
                    ))
                  )}
                </Box>

                <Box display="flex" gap={1}>
                  <TextField
                    size="small"
                    label="Post a real-time update comment..."
                    fullWidth
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                  />
                  <Button variant="contained" onClick={handleAddComment} color="secondary" sx={{ textTransform: "none" }}>
                    Send
                  </Button>
                </Box>
              </Box>
            </Paper>
          ) : (
            <Paper sx={{ p: 4, textAlign: "center", borderRadius: 2 }}>
              <HelpCircle size={48} className="mx-auto text-gray-400 mb-2" />
              <Typography variant="subtitle1">No task selected</Typography>
              <Typography variant="caption" color="text.secondary">Select a task from the list on the left to track progress, assign resources, and write comments.</Typography>
            </Paper>
          )}
        </Grid>
      </Grid>

      {/* Task Creation Modal */}
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editingTask ? "Edit Workflow Task" : "Create New Workflow Task"}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 3, pt: 1 }}>
          <TextField
            label="Task Title"
            fullWidth
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Frontend Implementation"
          />

          <TextField
            label="Task Description"
            fullWidth
            multiline
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the goals and resource constraints..."
          />

          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                label="Expected Start Date"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={expectedStart}
                onChange={(e) => setExpectedStart(e.target.value)}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Expected Finish Date"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={expectedFinish}
                onChange={(e) => setExpectedFinish(e.target.value)}
              />
            </Grid>
          </Grid>

          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                label="Actual Start Date"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={realStart}
                onChange={(e) => setRealStart(e.target.value)}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Actual Finish Date"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={realFinish}
                onChange={(e) => setRealFinish(e.target.value)}
              />
            </Grid>
          </Grid>

          {editingTask && (
            <Box>
              <Typography variant="caption" color="text.secondary" mb={1} display="block">
                Progress Slider ({progress}%)
              </Typography>
              <Slider
                value={progress}
                onChange={(_e, val) => setProgress(val as number)}
                valueLabelDisplay="auto"
                min={0}
                max={100}
              />
            </Box>
          )}

          <Grid container spacing={2}>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={status}
                  label="Status"
                  onChange={(e) => setStatus(e.target.value as any)}
                >
                  <MenuItem value="planning">Planning</MenuItem>
                  <MenuItem value="in_progress">In Progress</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              {/* Predecessors Select */}
              <FormControl fullWidth>
                <InputLabel>Predecessor Dependencies</InputLabel>
                <Select
                  multiple
                  value={dependencies}
                  label="Predecessor Dependencies"
                  onChange={(e) => setDependencies(e.target.value as string[])}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => {
                        const match = tasks.find(t => t.id === value);
                        return <Chip key={value} label={match ? match.title : value} size="small" />;
                      })}
                    </Box>
                  )}
                >
                  {tasks
                    .filter(t => !editingTask || t.id !== editingTask.id) // exclude self
                    .map(t => (
                      <MenuItem key={t.id} value={t.id}>{t.title}</MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Divider sx={{ my: 1 }}>Resource Assignments</Divider>

          <Box display="flex" flexDirection="column" gap={2}>
            <FormControl fullWidth>
              <InputLabel>Add Resource Allocation</InputLabel>
              <Select
                value=""
                onChange={(e) => handleAddResourceAllocation(e.target.value as string)}
                displayEmpty
              >
                <MenuItem value="" disabled>Choose team member or material...</MenuItem>
                {resources.map(r => (
                  <MenuItem 
                    key={r.id} 
                    value={r.id} 
                    disabled={allocatedResources.some(a => a.resourceId === r.id)}
                  >
                    {r.name} ({r.type})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <List sx={{ p: 0 }}>
              {allocatedResources.map(alloc => {
                const res = resources.find(r => r.id === alloc.resourceId);
                if (!res) return null;
                return (
                  <ListItem key={alloc.resourceId} sx={{ p: 0, mb: 1, display: "flex", gap: 2, alignItems: "center" }}>
                    <Typography variant="body2" sx={{ flexGrow: 1 }}>{res.name}</Typography>
                    <TextField
                      size="small"
                      type="number"
                      label={res.unit === "hour" ? "Hours" : "Units"}
                      value={alloc.allocatedHoursOrUnits}
                      onChange={(e) => handleUpdateResourceHours(alloc.resourceId, Number(e.target.value))}
                      sx={{ width: 100 }}
                    />
                    <IconButton color="error" onClick={() => handleRemoveResourceAllocation(alloc.resourceId)}>
                      <Trash2 size={16} />
                    </IconButton>
                  </ListItem>
                );
              })}
            </List>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveTask} variant="contained" disabled={!title.trim()}>Save Task</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
