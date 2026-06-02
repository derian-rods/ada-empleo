export type ResultStatus = "profit" | "loss" | "neutral";

export interface ParentRequest {
  id: string;
  code: string;
  project?: string;
  tracker?: string;
  parentId?: string;
  parentSubject?: string;
  subject: string;
  status?: string;
  priority?: string;
  author?: string;
  assignee?: string;
  version?: string;
  application?: string;
  estimatedHours: number;
  dedicatedHoursFromExport?: number;
  totalDedicatedHoursFromExport?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ChildRequest {
  id: string;
  parentId?: string;
  code: string;
  project?: string;
  tracker?: string;
  parentSubject?: string;
  subject: string;
  status?: string;
  priority?: string;
  author?: string;
  assignee?: string;
  category?: string;
  version?: string;
  application?: string;
  estimatedHours: number;
  dedicatedHoursFromExport?: number;
  totalDedicatedHoursFromExport?: number;
  costWithoutVat?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface TimeEntry {
  id: string;
  project?: string;
  date?: string;
  createdAt?: string;
  week?: string;
  author?: string;
  user?: string;
  activity?: string;
  petitionRaw?: string;
  petitionId?: string;
  parentTaskRaw?: string;
  parentTaskId?: string;
  tracker?: string;
  status?: string;
  category?: string;
  version?: string;
  comment?: string;
  hours: number;
  profiledRole?: string;
  cauRole?: string;
  application?: string;
  companyName?: string; // Empresa asignada (ej. "Sopra Steria")
}

export interface OrphanTimeEntry extends TimeEntry {
  orphanReason: string;
}

export interface CalculatedRequest {
  parentId: string;
  code: string;
  subject: string;
  project?: string;
  tracker?: string;
  status?: string;
  application?: string;
  estimatedHours: number;
  actualHours: number;
  differenceHours: number;
  deviationPercent: number;
  resultStatus: ResultStatus;
  // HBS (Horas de Billing de Sistema) fields
  estimatedHbs: number;
  consumedHbs: number;
  differenceHbs: number;
  deviationPercentHbs: number;
  resultStatusHbs: ResultStatus;
  childrenCount: number;
  timeEntriesCount: number;
  peopleCount: number;
  people: string[];
  activities: string[];
  roles: string[];
  applications: string[];
  costWithoutVat?: number;
}

export interface DashboardSummary {
  totalEstimatedHours: number;
  totalActualHours: number;
  totalDifferenceHours: number;
  averageDeviationPercent: number;
  // HBS (Horas de Billing de Sistema) fields
  totalEstimatedHbs: number;
  totalConsumedHbs: number;
  totalDifferenceHbs: number;
  averageDeviationPercentHbs: number;
  profitableRequests: number;
  lossRequests: number;
  neutralRequests: number;
  orphanTimeEntries: number;
  totalPeople: number;
  totalApplications: number;
}
