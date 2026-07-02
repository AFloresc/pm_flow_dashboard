export type UserRole = 'manager' | 'member';

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
}

export type ResourceType = 'member' | 'material';

export interface Resource {
  id: string;
  name: string;
  type: ResourceType;
  costRate: number; // cost per hour for member, flat cost for material
  unit: 'hour' | 'flat';
}

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface TaskResourceAllocation {
  resourceId: string;
  allocatedHoursOrUnits: number; // hours for members, quantity for material
}

export interface Comment {
  id: string;
  text: string;
  username: string;
  userId: string;
  createdAt: number; // timestamp
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  expectedStart: string; // YYYY-MM-DD
  expectedFinish: string; // YYYY-MM-DD
  realStart?: string; // YYYY-MM-DD
  realFinish?: string; // YYYY-MM-DD
  progress: number; // 0 to 100
  dependencies: string[]; // List of task IDs that must finish first
  allocatedResources: TaskResourceAllocation[];
  subtasks: SubTask[];
  comments: Comment[];
  status: 'planning' | 'in_progress' | 'completed' | 'delayed';
}

export interface Project {
  id: string;
  name: string;
  description: string;
  budget: number;
  createdAt: number;
}
