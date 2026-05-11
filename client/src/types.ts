export enum JobApplicationStatus {
  Applied = 0,
  Interviewing = 1,
  Rejected = 2,
  Offer = 3,
}

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

export const jobApplicationStatusLabels: Record<JobApplicationStatus, string> = {
  [JobApplicationStatus.Applied]: "Applied",
  [JobApplicationStatus.Interviewing]: "Interviewing",
  [JobApplicationStatus.Rejected]: "Rejected",
  [JobApplicationStatus.Offer]: "Offer",
};
