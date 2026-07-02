import { useState, useMemo } from "react";
import { 
  Box, 
  Paper, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
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
  IconButton,
  Chip,
  Alert,
  Tooltip
} from "@mui/material";
import { Resource, Task, UserRole } from "../types";
import { Plus, Users, Cpu, DollarSign, Trash2, Edit, AlertCircle, TrendingUp } from "lucide-react";

interface ResourceAllocationProps {
  resources: Resource[];
  tasks: Task[];
  userRole: UserRole;
  onAddResource: (r: Resource) => void;
  onUpdateResource: (r: Resource) => void;
  onDeleteResource: (id: string) => void;
}

export default function ResourceAllocation({
  resources,
  tasks,
  userRole,
  onAddResource,
  onUpdateResource,
  onDeleteResource
}: ResourceAllocationProps) {
  const [open, setOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  
  // Form states
  const [name, setName] = useState("");
  const [type, setType] = useState<"member" | "material">("member");
  const [costRate, setCostRate] = useState<number>(50);
  const [unit, setUnit] = useState<"hour" | "flat">("hour");

  // Calculate allocations per resource
  const resourceMetrics = useMemo(() => {
    const metrics: Record<string, { totalAllocated: number; tasksCount: number }> = {};
    
    // Seed metrics structure
    resources.forEach(r => {
      metrics[r.id] = { totalAllocated: 0, tasksCount: 0 };
    });

    // Populate calculations
    tasks.forEach(t => {
      t.allocatedResources?.forEach(alloc => {
        if (metrics[alloc.resourceId]) {
          metrics[alloc.resourceId].totalAllocated += alloc.allocatedHoursOrUnits;
          metrics[alloc.resourceId].tasksCount += 1;
        }
      });
    });

    return metrics;
  }, [resources, tasks]);

  const handleOpenDialog = (r?: Resource) => {
    if (r) {
      setEditingResource(r);
      setName(r.name);
      setType(r.type);
      setCostRate(r.costRate);
      setUnit(r.unit);
    } else {
      setEditingResource(null);
      setName("");
      setType("member");
      setCostRate(50);
      setUnit("hour");
    }
    setOpen(true);
  };

  const handleSave = () => {
    if (!name.trim()) return;

    const resourceData: Resource = {
      id: editingResource ? editingResource.id : `r-${Date.now()}`,
      name,
      type,
      costRate: Number(costRate),
      unit
    };

    if (editingResource) {
      onUpdateResource(resourceData);
    } else {
      onAddResource(resourceData);
    }
    setOpen(false);
  };

  const isManager = userRole === "manager";

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h5" fontWeight="bold">Team & Material Resources</Typography>
          <Typography variant="body2" color="text.secondary">
            Coordinate team capacity, material expenses, and resource cost allocations.
          </Typography>
        </Box>
        {isManager && (
          <Button
            variant="contained"
            startIcon={<Plus size={18} />}
            onClick={() => handleOpenDialog()}
            sx={{ textTransform: "none" }}
          >
            Add Resource
          </Button>
        )}
      </Box>

      {/* Overview Cards */}
      <Grid container spacing={3}>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 2.5, borderRadius: 2, display: "flex", alignItems: "center", gap: 2, boxShadow: 2 }}>
            <Box sx={{ bgcolor: "rgba(99, 102, 241, 0.15)", color: "primary.main", p: 1.5, borderRadius: 2 }}>
              <Users size={28} />
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Total Team Members</Typography>
              <Typography variant="h5" fontWeight="bold">
                {resources.filter(r => r.type === "member").length}
              </Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 2.5, borderRadius: 2, display: "flex", alignItems: "center", gap: 2, boxShadow: 2 }}>
            <Box sx={{ bgcolor: "rgba(139, 92, 246, 0.15)", color: "secondary.main", p: 1.5, borderRadius: 2 }}>
              <Cpu size={28} />
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Material Resources</Typography>
              <Typography variant="h5" fontWeight="bold">
                {resources.filter(r => r.type === "material").length}
              </Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 2.5, borderRadius: 2, display: "flex", alignItems: "center", gap: 2, boxShadow: 2 }}>
            <Box sx={{ bgcolor: "rgba(16, 185, 129, 0.15)", color: "success.main", p: 1.5, borderRadius: 2 }}>
              <DollarSign size={28} />
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Allocated Resource Budget</Typography>
              <Typography variant="h5" fontWeight="bold">
                ${resources.reduce((acc, r) => {
                  const allocated = resourceMetrics[r.id]?.totalAllocated || 0;
                  return acc + (allocated * r.costRate);
                }, 0).toLocaleString()}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Resources Card Grid */}
      <Grid container spacing={3}>
        {resources.map(r => {
          const metrics = resourceMetrics[r.id] || { totalAllocated: 0, tasksCount: 0 };
          
          // Over-allocation alert for team members (assigned to more than 40 hours)
          const isOverAllocated = r.type === "member" && metrics.totalAllocated > 40;
          const resourceCost = metrics.totalAllocated * r.costRate;

          return (
            <Grid item xs={12} sm={6} md={4} key={r.id}>
              <Card sx={{ 
                height: "100%", 
                boxShadow: 2, 
                borderRadius: 2, 
                position: "relative",
                border: isOverAllocated ? "1px solid" : "none",
                borderColor: "warning.main"
              }}>
                <CardContent sx={{ display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between", gap: 2 }}>
                  <Box>
                    <Box display="flex" justifyContent="space-between" alignItems="start" mb={1}>
                      <Box display="flex" alignItems="center" gap={1}>
                        {r.type === "member" ? <Users size={18} className="text-blue-500" /> : <Cpu size={18} className="text-purple-500" />}
                        <Typography variant="subtitle1" fontWeight="bold" sx={{ pr: 6 }}>{r.name}</Typography>
                      </Box>
                      <Box sx={{ position: "absolute", top: 12, right: 12 }}>
                        {isManager && (
                          <Box display="flex">
                            <IconButton size="small" onClick={() => handleOpenDialog(r)} color="primary">
                              <Edit size={16} />
                            </IconButton>
                            <IconButton size="small" onClick={() => onDeleteResource(r.id)} color="error">
                              <Trash2 size={16} />
                            </IconButton>
                          </Box>
                        )}
                      </Box>
                    </Box>

                    <Chip 
                      label={r.type === "member" ? "Team Member" : "Material Resource"} 
                      color={r.type === "member" ? "info" : "secondary"} 
                      size="small"
                      sx={{ mb: 2 }}
                    />

                    <Box display="flex" flexDirection="column" gap={1} mt={1}>
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="caption" color="text.secondary">Cost Rate</Typography>
                        <Typography variant="body2" fontWeight="medium">
                          ${r.costRate} / {r.unit}
                        </Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="caption" color="text.secondary">Task Allocations</Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {metrics.tasksCount} active task(s)
                        </Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="caption" color="text.secondary">Total Allocated Usage</Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {metrics.totalAllocated} {r.unit}s
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  <Box sx={{ bgcolor: "background.default", p: 1.5, borderRadius: 1, display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid", borderColor: "divider" }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Total Accrued Cost</Typography>
                      <Typography variant="subtitle1" fontWeight="bold" color="success.main">
                        ${resourceCost.toLocaleString()}
                      </Typography>
                    </Box>
                    {isOverAllocated && (
                      <Tooltip title="This team member is allocated more than 40 hours! Over-allocation warning." arrow>
                        <Chip 
                          icon={<AlertCircle size={14} />} 
                          label="Capacity Alert" 
                          color="warning" 
                          size="small" 
                        />
                      </Tooltip>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Resource Modal Form */}
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>{editingResource ? "Edit Resource" : "Create New Resource"}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 3, pt: 1 }}>
          <TextField
            label="Resource Name"
            fullWidth
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Alice, AWS Instance"
          />

          <FormControl fullWidth>
            <InputLabel>Resource Type</InputLabel>
            <Select
              value={type}
              label="Resource Type"
              onChange={(e) => {
                const val = e.target.value as "member" | "material";
                setType(val);
                setUnit(val === "member" ? "hour" : "flat");
              }}
            >
              <MenuItem value="member">Human / Team Member</MenuItem>
              <MenuItem value="material">Material / Equipment</MenuItem>
            </Select>
          </FormControl>

          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                label="Cost Rate ($)"
                type="number"
                fullWidth
                value={costRate}
                onChange={(e) => setCostRate(Number(e.target.value))}
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Billing Unit</InputLabel>
                <Select
                  value={unit}
                  label="Billing Unit"
                  onChange={(e) => setUnit(e.target.value as "hour" | "flat")}
                >
                  <MenuItem value="hour">Per Hour</MenuItem>
                  <MenuItem value="flat">Flat Cost</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" disabled={!name.trim()}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
