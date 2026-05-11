export const JobApplicationStatus = {
  Applied: 0,
  Interviewing: 1,
  Rejected: 2,
  Offer: 3,
} as const;

export type JobApplicationStatus =
  (typeof JobApplicationStatus)[keyof typeof JobApplicationStatus];

export interface JobApplication {
  id: string;
  companyName: string;
  position: string;
  status: JobApplicationStatus;
  dateApplied: string;
  userId: string;
}

export interface JobApplicationCreateInput {
  companyName: string;
  position: string;
  status: JobApplicationStatus;
}

export interface JobApplicationUpdateInput {
  companyName: string;
  position: string;
  status: JobApplicationStatus;
  dateApplied: string;
}

export const jobApplicationStatusLabels: Record<JobApplicationStatus, string> = {
  [JobApplicationStatus.Applied]: "Applied",
  [JobApplicationStatus.Interviewing]: "Interviewing",
  [JobApplicationStatus.Rejected]: "Rejected",
  [JobApplicationStatus.Offer]: "Offer",
};

export const jobApplicationStatusOrder = [
  JobApplicationStatus.Applied,
  JobApplicationStatus.Interviewing,
  JobApplicationStatus.Rejected,
  JobApplicationStatus.Offer,
] as const;
