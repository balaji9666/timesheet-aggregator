export interface WorkflowEntry {
  suggestion_name: string;
  task_name: string;
  date_of_status: string;
  created_on: string;
  remarks: string;
  cp: number;
  hs: string;
  date_started: string;
  date_completed: string;
}

export interface GroupedTask {
  totalHours: number;
  totalCP: number;
  entries: WorkflowEntry[];
}

export interface WorkflowResponse {
  original: WorkflowEntry[];
  groupedByTask: { [key: string]: GroupedTask };
  groupedByWeek: { [key: string]: GroupedTask };
} 