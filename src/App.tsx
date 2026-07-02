import { useState, useEffect } from "react";
import { 
  Box, 
  Container, 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Tabs, 
  Tab, 
  Paper, 
  Chip, 
  Grid,
  Card,
  CardContent,
  Avatar,
  CircularProgress,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  ThemeProvider,
  createTheme
} from "@mui/material";
import { useProjectData } from "./hooks/useProjectData";
import { AppUser, Project, Task } from "./types";
import { auth } from "./firebase";
import { signOut } from "firebase/auth";
import AuthScreen from "./components/AuthScreen";
import GanttChart from "./components/GanttChart";
import TaskTracking from "./components/TaskTracking";
import ResourceAllocation from "./components/ResourceAllocation";
import AutomatedReporting from "./components/AutomatedReporting";
import { 
  LogOut, 
  Briefcase, 
  ListTodo, 
  Users, 
  LineChart, 
  Settings, 
  BarChart, 
  TrendingUp,
  Cpu,
  Clock,
  ShieldAlert,
  Edit
} from "lucide-react";

// Dark, modern, high-contrast Bento Grid theme
const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#6366f1", // Indigo-500
      light: "rgba(99, 102, 241, 0.15)",
      dark: "#4f46e5",
      contrastText: "#ffffff"
    },
    secondary: {
      main: "#a855f7", // Purple-500
      light: "rgba(168, 85, 247, 0.15)",
      dark: "#9333ea",
      contrastText: "#ffffff"
    },
    success: {
      main: "#10b981", // Emerald-500
      light: "rgba(16, 185, 129, 0.15)"
    },
    warning: {
      main: "#f59e0b", // Amber-500
      light: "rgba(245, 158, 11, 0.15)"
    },
    error: {
      main: "#ef4444", // Red-500
      light: "rgba(239, 68, 68, 0.15)"
    },
    background: {
      default: "#020617", // Slate-950
      paper: "#0f172a" // Slate-900
    },
    text: {
      primary: "#f8fafc", // Slate-50
      secondary: "#94a3b8" // Slate-400
    },
    divider: "#1e293b" // Slate-800
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    button: {
      textTransform: "none",
      fontWeight: 600
    }
  },
  shape: {
    borderRadius: 16 // Modern curved layout
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          border: "1px solid #1e293b", // Slate-800 border
          transition: "box-shadow 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms",
          boxShadow: "0 4px 20px -2px rgba(0, 0, 0, 0.4)"
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          backgroundColor: "#0f172a",
          border: "1px solid #1e293b",
          boxShadow: "0 4px 20px -2px rgba(0, 0, 0, 0.4)"
        }
      }
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "rgba(15, 23, 42, 0.8)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid #1e293b",
          boxShadow: "none"
        }
      }
    },
    MuiTab: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          textTransform: "none",
          fontSize: "0.875rem"
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: "10px",
          fontWeight: 600
        }
      }
    }
  }
});

export default function App() {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  
  // Selection bridging: when clicking a task in Gantt Chart, redirect to Task Tracking with it selected
  const [bridgedSelectedTask, setBridgedSelectedTask] = useState<Task | null>(null);

  // Firestore & fallback LocalStorage synchronization hook
  const {
    projects,
    tasks,
    resources,
    loading: dataLoading,
    error: dataError,
    updateProject,
    addTask,
    updateTask,
    deleteTask,
    addResource,
    updateResource,
    deleteResource
  } = useProjectData();

  // Project Editing dialog
  const [projDialogOpen, setProjDialogOpen] = useState(false);
  const [editProjName, setEditProjName] = useState("");
  const [editProjDesc, setEditProjDesc] = useState("");
  const [editProjBudget, setEditProjBudget] = useState(25000);

  useEffect(() => {
    // 1. Initial auth state check
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        // Find existing stored user session
        const storedUser = localStorage.getItem("pm_current_user");
        if (storedUser) {
          setCurrentUser(JSON.parse(storedUser));
        } else {
          setCurrentUser({
            uid: user.uid,
            email: user.email || "",
            displayName: user.displayName || user.email?.split("@")[0] || "Collaborator",
            role: "member"
          });
        }
      } else {
        // Fallback demo user check
        const storedDemo = localStorage.getItem("pm_current_user");
        if (storedDemo) {
          setCurrentUser(JSON.parse(storedDemo));
        } else {
          setCurrentUser(null);
        }
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch {
      console.log("Not logged into firebase auth, signing out locally");
    }
    localStorage.removeItem("pm_current_user");
    setCurrentUser(null);
  };

  const handleOpenProjDialog = (p: Project) => {
    setEditProjName(p.name);
    setEditProjDesc(p.description);
    setEditProjBudget(p.budget);
    setProjDialogOpen(true);
  };

  const handleSaveProject = () => {
    if (projects.length === 0 || !editProjName.trim()) return;
    const currentProj = projects[0];
    const updated = {
      ...currentProj,
      name: editProjName,
      description: editProjDesc,
      budget: Number(editProjBudget)
    };
    updateProject(updated);
    setProjDialogOpen(false);
  };

  const activeProject = projects[0];
  const isManager = currentUser?.role === "manager";

  if (authLoading || (currentUser && dataLoading)) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100vh" gap={2}>
        <CircularProgress size={50} color="primary" />
        <Typography variant="body1" color="text.secondary">Initializing Pro-Flow Workspace...</Typography>
      </Box>
    );
  }

  if (!currentUser) {
    return (
      <ThemeProvider theme={theme}>
        <AuthScreen onAuthSuccess={(user) => setCurrentUser(user)} />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ bgcolor: "background.default", minHeight: "100vh", pb: 5 }}>
        {/* Navigation AppBar */}
        <AppBar position="sticky" sx={{ bgcolor: "background.paper", color: "text.primary", borderBottom: "1px solid", borderColor: "divider" }}>
          <Container maxWidth="xl">
            <Toolbar disableGutters sx={{ display: "flex", justifyContent: "space-between" }}>
              <Box display="flex" alignItems="center" gap={1}>
                <Briefcase className="text-indigo-400" size={26} />
                <Typography variant="h6" fontWeight="bold" color="primary.main">PRO-FLOW</Typography>
                <Chip 
                  label="Vite Staging" 
                  size="small" 
                  color="secondary" 
                  variant="outlined" 
                  sx={{ ml: 1, fontSize: "0.65rem", height: 18 }} 
                />
              </Box>

              {/* Center Navigation Tabs */}
              <Tabs 
                value={activeTab} 
                onChange={(_e, val) => setActiveTab(val)} 
                textColor="primary" 
                indicatorColor="primary"
                sx={{ display: { xs: "none", sm: "flex" } }}
              >
                <Tab label="Dashboard" icon={<BarChart size={16} />} iconPosition="start" />
                <Tab label="Work Tasks" icon={<ListTodo size={16} />} iconPosition="start" />
                <Tab label="Resource Panel" icon={<Users size={16} />} iconPosition="start" />
                <Tab label="Reports & Exporters" icon={<LineChart size={16} />} iconPosition="start" />
              </Tabs>

              {/* Active User Display & Signout */}
              <Box display="flex" alignItems="center" gap={2}>
                <Box display="flex" flexDirection="column" alignItems="end" sx={{ display: { xs: "none", md: "flex" } }}>
                  <Typography variant="body2" fontWeight="bold">{currentUser.displayName}</Typography>
                  <Chip 
                    label={currentUser.role === "manager" ? "Project Manager" : "Team Member"} 
                    color={currentUser.role === "manager" ? "primary" : "default"} 
                    size="small"
                    sx={{ height: 16, fontSize: "0.6rem" }}
                  />
                </Box>
                <Avatar sx={{ bgcolor: "secondary.main", width: 36, height: 36, fontSize: "0.95rem" }}>
                  {currentUser.displayName.substring(0, 2).toUpperCase()}
                </Avatar>
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  startIcon={<LogOut size={14} />}
                  onClick={handleSignOut}
                  sx={{ textTransform: "none" }}
                >
                  Logout
                </Button>
              </Box>
            </Toolbar>
          </Container>
        </AppBar>

        {/* Responsive Mobile Tabs Fallback */}
        <Box sx={{ borderBottom: 1, borderColor: "divider", bgcolor: "background.paper", display: { xs: "flex", sm: "none" } }}>
          <Tabs 
            value={activeTab} 
            onChange={(_e, val) => setActiveTab(val)} 
            textColor="primary" 
            indicatorColor="primary"
            variant="fullWidth"
          >
            <Tab icon={<BarChart size={18} />} />
            <Tab icon={<ListTodo size={18} />} />
            <Tab icon={<Users size={18} />} />
            <Tab icon={<LineChart size={18} />} />
          </Tabs>
        </Box>

        {/* Main Body */}
        <Container maxWidth="xl" sx={{ mt: 4 }}>
          {/* Active Project Header Widget */}
          {activeProject && (
            <Paper sx={{ p: 2.5, mb: 4, borderRadius: 2, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2, boxShadow: 1 }}>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight="bold" sx={{ letterSpacing: 1, textTransform: "uppercase" }}>
                  Active Working Campaign
                </Typography>
                <Typography variant="h5" fontWeight="bold" color="text.primary">
                  {activeProject.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {activeProject.description}
                </Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={3}>
                <Box sx={{ textAlign: "right" }}>
                  <Typography variant="caption" color="text.secondary">Project Budget</Typography>
                  <Typography variant="h6" fontWeight="bold" color="primary.main">
                    ${activeProject.budget.toLocaleString()}
                  </Typography>
                </Box>
                {isManager && (
                  <Button 
                    variant="outlined" 
                    size="small" 
                    startIcon={<Edit size={14} />} 
                    onClick={() => handleOpenProjDialog(activeProject)}
                    sx={{ textTransform: "none" }}
                  >
                    Edit Campaign
                  </Button>
                )}
              </Box>
            </Paper>
          )}

          {/* Render Active Component Tab */}
          <Box>
            {activeTab === 0 && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {/* Gantt Chart Panel */}
                <GanttChart 
                  tasks={tasks} 
                  onSelectTask={(task) => {
                    // Set bridged task, and redirect user to Workflow Tasks Tab (activeTab = 1)
                    setBridgedSelectedTask(task);
                    setActiveTab(1);
                  }} 
                />

                {/* KPI Cards section */}
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ boxShadow: 2 }}>
                      <CardContent>
                        <Typography variant="caption" color="text.secondary" fontWeight="semibold">Total Work Tasks</Typography>
                        <Typography variant="h4" fontWeight="bold" mt={1}>{tasks.length}</Typography>
                        <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                          {tasks.filter(t => t.status === "completed").length} completed successfully
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ boxShadow: 2 }}>
                      <CardContent>
                        <Typography variant="caption" color="text.secondary" fontWeight="semibold">In Progress Tasks</Typography>
                        <Typography variant="h4" fontWeight="bold" mt={1} color="warning.main">
                          {tasks.filter(t => t.status === "in_progress").length}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                          Actively logged by team
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ boxShadow: 2 }}>
                      <CardContent>
                        <Typography variant="caption" color="text.secondary" fontWeight="semibold">Capacity Overloads</Typography>
                        <Typography variant="h4" fontWeight="bold" mt={1} color="error.main">
                          {resources.filter(r => {
                            const hours = tasks.reduce((sum, t) => {
                              const match = t.allocatedResources?.find(a => a.resourceId === r.id);
                              return sum + (match ? match.allocatedHoursOrUnits : 0);
                            }, 0);
                            return r.type === "member" && hours > 40;
                          }).length}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                          Staff with &gt; 40 hours assigned
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ boxShadow: 2 }}>
                      <CardContent>
                        <Typography variant="caption" color="text.secondary" fontWeight="semibold">Project Health Index</Typography>
                        <Typography variant="h4" fontWeight="bold" mt={1} color="success.main">
                          {tasks.length > 0 
                            ? `${Math.round((tasks.filter(t => t.status === "completed").length / tasks.length) * 100)}%`
                            : "100%"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                          Completion ratio
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Box>
            )}

            {activeTab === 1 && (
              <TaskTracking 
                tasks={tasks}
                resources={resources}
                currentUser={currentUser}
                onAddTask={addTask}
                onUpdateTask={updateTask}
                onDeleteTask={deleteTask}
                selectedTaskFromDashboard={bridgedSelectedTask}
                onClearSelectedTask={() => setBridgedSelectedTask(null)}
              />
            )}

            {activeTab === 2 && (
              <ResourceAllocation 
                resources={resources}
                tasks={tasks}
                userRole={currentUser.role}
                onAddResource={addResource}
                onUpdateResource={updateResource}
                onDeleteResource={deleteResource}
              />
            )}

            {activeTab === 3 && activeProject && (
              <AutomatedReporting 
                project={activeProject}
                tasks={tasks}
                resources={resources}
              />
            )}
          </Box>
        </Container>
      </Box>

      {/* Project Edit Dialog */}
      <Dialog open={projDialogOpen} onClose={() => setProjDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Edit Campaign Details</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 3, pt: 1 }}>
          <TextField
            label="Campaign Name"
            fullWidth
            value={editProjName}
            onChange={(e) => setEditProjName(e.target.value)}
          />
          <TextField
            label="Campaign Description"
            fullWidth
            multiline
            rows={2}
            value={editProjDesc}
            onChange={(e) => setEditProjDesc(e.target.value)}
          />
          <TextField
            label="Allocated Project Budget ($)"
            type="number"
            fullWidth
            value={editProjBudget}
            onChange={(e) => setEditProjBudget(Number(e.target.value))}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProjDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveProject} variant="contained" disabled={!editProjName.trim()}>Save Campaign</Button>
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  );
}
