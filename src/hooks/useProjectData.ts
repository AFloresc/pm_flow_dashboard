import { useEffect, useState } from "react";
import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs 
} from "firebase/firestore";
import { db } from "../firebase";
import { Project, Task, Resource, Comment, AppUser } from "../types";

// Default seed data for initial setup
const DEFAULT_RESOURCES: Resource[] = [
  { id: "r1", name: "Alice (Project Lead)", type: "member", costRate: 85, unit: "hour" },
  { id: "r2", name: "Bob (Frontend Dev)", type: "member", costRate: 65, unit: "hour" },
  { id: "r3", name: "Charlie (Backend Dev)", type: "member", costRate: 70, unit: "hour" },
  { id: "r4", name: "Cloud Compute Server", type: "material", costRate: 450, unit: "flat" },
  { id: "r5", name: "Developer IDE License", type: "material", costRate: 120, unit: "flat" }
];

const DEFAULT_PROJECTS: Project[] = [
  {
    id: "p1",
    name: "Enterprise Quantum Launch",
    description: "Deployment of quantum-powered workflow scheduler to cloud infrastructure.",
    budget: 25000,
    createdAt: Date.now()
  }
];

const DEFAULT_TASKS: Task[] = [
  {
    id: "t1",
    projectId: "p1",
    title: "System Architecture & Models",
    description: "Design Core database schemas, interfaces, and cloud resource architecture.",
    expectedStart: "2026-06-01",
    expectedFinish: "2026-06-05",
    realStart: "2026-06-01",
    realFinish: "2026-06-06", // Finished 1 day late!
    progress: 100,
    dependencies: [],
    allocatedResources: [
      { resourceId: "r1", allocatedHoursOrUnits: 30 } // Alice for 30h
    ],
    subtasks: [
      { id: "s1", title: "Map database relations", completed: true },
      { id: "s2", title: "Review with operations", completed: true }
    ],
    comments: [
      { id: "c1", text: "Architecture approved by client on Wed.", username: "Alice", userId: "default", createdAt: Date.now() - 3 * 24 * 3600 * 1000 }
    ],
    status: "completed"
  },
  {
    id: "t2",
    projectId: "p1",
    title: "API Endpoint Implementation",
    description: "Build robust Express APIs, security layers, and firestore configurations.",
    expectedStart: "2026-06-06",
    expectedFinish: "2026-06-12",
    realStart: "2026-06-05", // Started early!
    realFinish: "2026-06-10", // Finished early!
    progress: 100,
    dependencies: ["t1"],
    allocatedResources: [
      { resourceId: "r3", allocatedHoursOrUnits: 40 }, // Charlie for 40h
      { resourceId: "r4", allocatedHoursOrUnits: 1 } // Cloud Server Flat
    ],
    subtasks: [
      { id: "s3", title: "Setup auth middlewares", completed: true },
      { id: "s4", title: "Benchmark endpoints", completed: true }
    ],
    comments: [
      { id: "c2", text: "Backend completed with zero critical bugs.", username: "Charlie", userId: "default", createdAt: Date.now() - 24 * 3600 * 1000 }
    ],
    status: "completed"
  },
  {
    id: "t3",
    projectId: "p1",
    title: "Frontend UI/UX & Gantt Integration",
    description: "Create rich visual dashboards, resource widgets, and SVG timeline charts.",
    expectedStart: "2026-06-06",
    expectedFinish: "2026-06-15",
    realStart: "2026-06-07", // Started 1 day late
    progress: 75,
    dependencies: ["t1"],
    allocatedResources: [
      { resourceId: "r2", allocatedHoursOrUnits: 50 }, // Bob for 50h
      { resourceId: "r5", allocatedHoursOrUnits: 2 } // 2 Dev licenses
    ],
    subtasks: [
      { id: "s5", title: "Code svg timeline engine", completed: true },
      { id: "s6", title: "Build project-comparison dashboard", completed: true },
      { id: "s7", title: "Add pdf/json exporters", completed: false }
    ],
    comments: [
      { id: "c3", text: "PDF export logic requires some visual adjustments.", username: "Bob", userId: "default", createdAt: Date.now() - 2 * 3600 * 1000 }
    ],
    status: "in_progress"
  },
  {
    id: "t4",
    projectId: "p1",
    title: "Integration Testing & Launch",
    description: "Full end-to-end regression tests and deployment to staging.",
    expectedStart: "2026-06-16",
    expectedFinish: "2026-06-20",
    progress: 0,
    dependencies: ["t2", "t3"], // Requires both backend and frontend to finish!
    allocatedResources: [
      { resourceId: "r1", allocatedHoursOrUnits: 10 },
      { resourceId: "r2", allocatedHoursOrUnits: 10 }
    ],
    subtasks: [
      { id: "s8", title: "Conduct load test scenarios", completed: false },
      { id: "s9", title: "Deploy to cloud run container", completed: false }
    ],
    comments: [],
    status: "planning"
  }
];

function parseAndLogError(
  err: any,
  collectionName: string,
  operation: "create" | "read" | "update" | "delete" | "list",
  documentId?: string,
  uid?: string
): string {
  const isPermissionDenied = err.code === "permission-denied" || 
    err.message?.includes("permission-denied") || 
    err.message?.includes("Missing or insufficient permissions");
  const code = isPermissionDenied ? "permission-denied" : "unknown";
  const errorInfo = {
    code,
    message: err.message || "Firestore operation failed",
    collection: collectionName,
    operation,
    documentId,
    uid,
    timestamp: new Date().toISOString()
  };
  const jsonString = JSON.stringify(errorInfo);
  console.error("Firestore Structured Error:", jsonString);
  return jsonString;
}

export function useProjectData(currentUser: AppUser | null) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isDemo = currentUser?.uid?.startsWith("demo_");
  const isRealUser = currentUser && !isDemo;

  useEffect(() => {
    let unsubscribeProjects = () => {};
    let unsubscribeTasks = () => {};
    let unsubscribeResources = () => {};

    const syncLocalFallback = () => {
      console.log("Using localStorage fallback for data sync");
      try {
        const localProjects = localStorage.getItem("pm_projects");
        const localTasks = localStorage.getItem("pm_tasks");
        const localResources = localStorage.getItem("pm_resources");

        if (localProjects && localTasks && localResources) {
          setProjects(JSON.parse(localProjects));
          setTasks(JSON.parse(localTasks));
          setResources(JSON.parse(localResources));
        } else {
          // Initialize defaults
          localStorage.setItem("pm_projects", JSON.stringify(DEFAULT_PROJECTS));
          localStorage.setItem("pm_tasks", JSON.stringify(DEFAULT_TASKS));
          localStorage.setItem("pm_resources", JSON.stringify(DEFAULT_RESOURCES));
          setProjects(DEFAULT_PROJECTS);
          setTasks(DEFAULT_TASKS);
          setResources(DEFAULT_RESOURCES);
        }
      } catch (err: any) {
        setError("Local storage state failure: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    if (!isRealUser) {
      syncLocalFallback();
      return;
    }

    setLoading(true);

    // Try standard Firestore real-time listener
    try {
      unsubscribeProjects = onSnapshot(
        collection(db, "projects"),
        async (snapshot) => {
          if (snapshot.empty) {
            // Seed defaults to Firestore if empty
            for (const p of DEFAULT_PROJECTS) {
              await setDoc(doc(db, "projects", p.id), p);
            }
          } else {
            const list = snapshot.docs.map(d => d.data() as Project);
            setProjects(list);
          }
        },
        (err) => {
          console.error("Firestore projects error:", err);
          const jsonErr = parseAndLogError(err, "projects", "list", undefined, currentUser?.uid);
          setError(jsonErr);
          syncLocalFallback();
        }
      );

      unsubscribeTasks = onSnapshot(
        collection(db, "tasks"),
        async (snapshot) => {
          if (snapshot.empty) {
            for (const t of DEFAULT_TASKS) {
              await setDoc(doc(db, "tasks", t.id), t);
            }
          } else {
            const list = snapshot.docs.map(d => d.data() as Task);
            setTasks(list);
          }
        },
        (err) => {
          console.error("Firestore tasks error:", err);
          const jsonErr = parseAndLogError(err, "tasks", "list", undefined, currentUser?.uid);
          setError(jsonErr);
        }
      );

      unsubscribeResources = onSnapshot(
        collection(db, "resources"),
        async (snapshot) => {
          if (snapshot.empty) {
            for (const r of DEFAULT_RESOURCES) {
              await setDoc(doc(db, "resources", r.id), r);
            }
          } else {
            const list = snapshot.docs.map(d => d.data() as Resource);
            setResources(list);
          }
          setLoading(false);
        },
        (err) => {
          console.error("Firestore resources error:", err);
          const jsonErr = parseAndLogError(err, "resources", "list", undefined, currentUser?.uid);
          setError(jsonErr);
        }
      );

    } catch (err: any) {
      console.error("Failed to connect to Firebase Firestore, using fallback.", err);
      const jsonErr = parseAndLogError(err, "projects", "list", undefined, currentUser?.uid);
      setError(jsonErr);
      syncLocalFallback();
    }

    return () => {
      unsubscribeProjects();
      unsubscribeTasks();
      unsubscribeResources();
    };
  }, [currentUser]);

  // Sync state to local storage if running in local fallback
  const persistLocal = (newProjects: Project[], newTasks: Task[], newResources: Resource[]) => {
    localStorage.setItem("pm_projects", JSON.stringify(newProjects));
    localStorage.setItem("pm_tasks", JSON.stringify(newTasks));
    localStorage.setItem("pm_resources", JSON.stringify(newResources));
  };

  // Create Project
  const addProject = async (p: Project) => {
    if (isRealUser) {
      try {
        await setDoc(doc(db, "projects", p.id), p);
      } catch (err: any) {
        parseAndLogError(err, "projects", "create", p.id, currentUser?.uid);
        const next = [...projects, p];
        setProjects(next);
        persistLocal(next, tasks, resources);
      }
    } else {
      const next = [...projects, p];
      setProjects(next);
      persistLocal(next, tasks, resources);
    }
  };

  // Update Project
  const updateProject = async (p: Project) => {
    if (isRealUser) {
      try {
        await updateDoc(doc(db, "projects", p.id), p as any);
      } catch (err: any) {
        parseAndLogError(err, "projects", "update", p.id, currentUser?.uid);
        const next = projects.map(item => item.id === p.id ? p : item);
        setProjects(next);
        persistLocal(next, tasks, resources);
      }
    } else {
      const next = projects.map(item => item.id === p.id ? p : item);
      setProjects(next);
      persistLocal(next, tasks, resources);
    }
  };

  // Delete Project
  const deleteProject = async (projectId: string) => {
    if (isRealUser) {
      try {
        await deleteDoc(doc(db, "projects", projectId));
      } catch (err: any) {
        parseAndLogError(err, "projects", "delete", projectId, currentUser?.uid);
        const next = projects.filter(item => item.id !== projectId);
        const nextTasks = tasks.filter(t => t.projectId !== projectId);
        setProjects(next);
        setTasks(nextTasks);
        persistLocal(next, nextTasks, resources);
      }
    } else {
      const next = projects.filter(item => item.id !== projectId);
      const nextTasks = tasks.filter(t => t.projectId !== projectId);
      setProjects(next);
      setTasks(nextTasks);
      persistLocal(next, nextTasks, resources);
    }
  };

  // Create Task
  const addTask = async (t: Task) => {
    if (isRealUser) {
      try {
        await setDoc(doc(db, "tasks", t.id), t);
      } catch (err: any) {
        parseAndLogError(err, "tasks", "create", t.id, currentUser?.uid);
        const next = [...tasks, t];
        setTasks(next);
        persistLocal(projects, next, resources);
      }
    } else {
      const next = [...tasks, t];
      setTasks(next);
      persistLocal(projects, next, resources);
    }
  };

  // Update Task
  const updateTask = async (t: Task) => {
    if (isRealUser) {
      try {
        await setDoc(doc(db, "tasks", t.id), t);
      } catch (err: any) {
        parseAndLogError(err, "tasks", "update", t.id, currentUser?.uid);
        const next = tasks.map(item => item.id === t.id ? t : item);
        setTasks(next);
        persistLocal(projects, next, resources);
      }
    } else {
      const next = tasks.map(item => item.id === t.id ? t : item);
      setTasks(next);
      persistLocal(projects, next, resources);
    }
  };

  // Delete Task
  const deleteTask = async (taskId: string) => {
    if (isRealUser) {
      try {
        await deleteDoc(doc(db, "tasks", taskId));
      } catch (err: any) {
        parseAndLogError(err, "tasks", "delete", taskId, currentUser?.uid);
        const next = tasks.filter(item => item.id !== taskId);
        setTasks(next);
        persistLocal(projects, next, resources);
      }
    } else {
      const next = tasks.filter(item => item.id !== taskId);
      setTasks(next);
      persistLocal(projects, next, resources);
    }
  };

  // Add Resource
  const addResource = async (r: Resource) => {
    if (isRealUser) {
      try {
        await setDoc(doc(db, "resources", r.id), r);
      } catch (err: any) {
        parseAndLogError(err, "resources", "create", r.id, currentUser?.uid);
        const next = [...resources, r];
        setResources(next);
        persistLocal(projects, tasks, next);
      }
    } else {
      const next = [...resources, r];
      setResources(next);
      persistLocal(projects, tasks, next);
    }
  };

  // Update Resource
  const updateResource = async (r: Resource) => {
    if (isRealUser) {
      try {
        await setDoc(doc(db, "resources", r.id), r);
      } catch (err: any) {
        parseAndLogError(err, "resources", "update", r.id, currentUser?.uid);
        const next = resources.map(item => item.id === r.id ? r : item);
        setResources(next);
        persistLocal(projects, tasks, next);
      }
    } else {
      const next = resources.map(item => item.id === r.id ? r : item);
      setResources(next);
      persistLocal(projects, tasks, next);
    }
  };

  // Delete Resource
  const deleteResource = async (resourceId: string) => {
    if (isRealUser) {
      try {
        await deleteDoc(doc(db, "resources", resourceId));
      } catch (err: any) {
        parseAndLogError(err, "resources", "delete", resourceId, currentUser?.uid);
        const next = resources.filter(item => item.id !== resourceId);
        setResources(next);
        persistLocal(projects, tasks, next);
      }
    } else {
      const next = resources.filter(item => item.id !== resourceId);
      setResources(next);
      persistLocal(projects, tasks, next);
    }
  };

  return {
    projects,
    tasks,
    resources,
    loading,
    error,
    addProject,
    updateProject,
    deleteProject,
    addTask,
    updateTask,
    deleteTask,
    addResource,
    updateResource,
    deleteResource
  };
}
