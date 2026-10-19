export type NeedType = 'Food' | 'Water' | 'Medical' | 'Rescue' | 'Shelter';

export type IncidentStatus =
  | 'Pending Verification'
  | 'Active Rescue'
  | 'Resolved'
  | 'Duplicate Merged';

export type Severity = 'Critical' | 'High' | 'Medium' | 'Low';

export type MessageChannel = 'WhatsApp' | 'Voice Note' | 'SMS' | 'Hotline';

export interface RawMessage {
  id: string;
  channel: MessageChannel;
  senderName: string;
  senderContact: string;
  text: string;
  timestamp: number;
  lang: 'Roman-Urdu' | 'Urdu' | 'English' | 'Mixed';
}

export interface StructuredExtraction {
  needType: NeedType;
  needDetail: string;
  city: string;
  district: string;
  sector: string;
  landmark: string;
  affectedPeople: number;
  urgency: Severity;
  translatedSummary: string;
  lat: number | null;
  lng: number | null;
}

export interface SourceReport {
  messageId: string;
  senderName: string;
  channel: MessageChannel;
  originalText: string;
  timestamp: number;
}

export interface RoutingRecommendation {
  ngoId: string;
  ngoName: string;
  distanceKm: number;
  volunteerName: string;
  matchedSupplies: InventoryItem[];
  etaMinutes: number;
  notes: string;
}

export interface Incident {
  id: string;
  masterId: string | null;
  status: IncidentStatus;
  severity: Severity;
  extraction: StructuredExtraction;
  sources: SourceReport[];
  confirmationCount: number;
  routing: RoutingRecommendation | null;
  assignedVolunteerId: string | null;
  podLog: PodLogEntry[];
  photoUrl: string | null;
  createdAt: number;
  updatedAt: number;
  resolvedAt: number | null;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: NeedType;
  quantity: number;
  unit: string;
  ngoId: string;
  locationCity: string;
}

export interface Volunteer {
  id: string;
  name: string;
  phone: string;
  ngoId: string;
  ngoName: string;
  baseCity: string;
  skills: NeedType[];
  status: 'Available' | 'Deployed' | 'Offline';
  lat: number;
  lng: number;
}

export interface Ngo {
  id: string;
  name: string;
  baseCity: string;
  contactPhone: string;
  lat: number;
  lng: number;
}

export interface PodLogEntry {
  id: string;
  incidentId: string;
  volunteerId: string;
  volunteerName: string;
  message: string;
  imageName: string | null;
  timestamp: number;
  agentVerdict: string;
}

export type AgentId = 'agent-1' | 'agent-2' | 'agent-3' | 'agent-4';

export interface AgentStatus {
  id: AgentId;
  name: string;
  role: string;
  state: 'idle' | 'working' | 'done' | 'error';
  currentTask: string;
  lastActivity: number;
}

export interface Region {
  name: string;
  districts: string[];
}
