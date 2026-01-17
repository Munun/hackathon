import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ---- API types (matches your FastAPI response) ----
export type PatientData = {
  age?: number | null;
  ethnicity?: string | null;
  conditions?: string[] | null;
  lab_results?: Record<string, string> | null;
  confidence_score?: number | null;
};

export type TrialMatch = {
  trial_id: string;
  trial_name: string;
  match_score: number; // 0-100
  qualifying_factors: string[];
  disqualifying_factors: string[];
  recommendation: string;
  confidence: number; // 0-1
};

export type UploadRecordResponse = {
  status: "success";
  patient_data: PatientData;
  matches: TrialMatch[];
  total_matches: number;
};

// API Configuration - uses Vite proxy (dev) or environment variable (prod)
// In development, requests to /api are proxied to http://localhost:8000
// In production, set VITE_API_BASE_URL to your backend URL
const API_BASE = import.meta.env.PROD 
  ? (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000")
  : "/api";

async function safeJson(res: Response) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

export async function uploadRecord(file: File): Promise<UploadRecordResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE}/upload-record`, {
    method: "POST",
    body: formData,
  });

  const data = await safeJson(res);

  if (!res.ok) {
    // Your backend sometimes uses JSONResponse({error,message}) and sometimes HTTPException(detail={...})
    const msg =
      data?.message ||
      data?.detail?.message ||
      data?.detail ||
      data?.error ||
      "Upload failed";
    throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
  }

  return data as UploadRecordResponse;
}

// ---- Additional API endpoints ----

export type ConsentPayload = {
  patient_id: string;
  trial_id: string;
};

export type ConsentResponse = {
  status: "success";
  message: string;
  patient_id: string;
  trial_id: string;
  next_step: string;
};

export async function confirmConsent(payload: ConsentPayload): Promise<ConsentResponse> {
  const res = await fetch(`${API_BASE}/confirm-consent`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await safeJson(res);

  if (!res.ok) {
    const msg = data?.message || data?.detail?.message || "Consent confirmation failed";
    throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
  }

  return data as ConsentResponse;
}

export type SamplePatient = {
  patient_id: string;
  age: number;
  ethnicity: string;
  conditions: string[];
  // Add other fields as needed
};

export type SamplePatientsResponse = {
  status: "success";
  patients: SamplePatient[];
};

export async function getSamplePatients(): Promise<SamplePatientsResponse> {
  const res = await fetch(`${API_BASE}/sample-patients`, {
    method: "GET",
  });

  const data = await safeJson(res);

  if (!res.ok) {
    const msg = data?.message || data?.detail?.message || "Failed to fetch sample patients";
    throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
  }

  return data as SamplePatientsResponse;
}

export type SampleTrial = {
  trial_id: string;
  trial_name: string;
  condition: string;
  eligibility_criteria: string[];
  // Add other fields as needed
};

export type SampleTrialsResponse = {
  status: "success";
  trials: SampleTrial[];
  count: number;
};

export async function getSampleTrials(): Promise<SampleTrialsResponse> {
  const res = await fetch(`${API_BASE}/sample-trials`, {
    method: "GET",
  });

  const data = await safeJson(res);

  if (!res.ok) {
    const msg = data?.message || data?.detail?.message || "Failed to fetch sample trials";
    throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
  }

  return data as SampleTrialsResponse;
}

export type HealthCheckResponse = {
  status: string;
  service: string;
  version: string;
};

export async function healthCheck(): Promise<HealthCheckResponse> {
  const res = await fetch(`${API_BASE}/`, {
    method: "GET",
  });

  const data = await safeJson(res);

  if (!res.ok) {
    throw new Error("Backend is not responding");
  }

  return data as HealthCheckResponse;
}
