import axios from "axios";
import { finalUrl } from "../baseUrl";
import type { JobApplication, JobApplicationCreateInput } from "../types";

const tokenKey = "token";

const cleanToken = (rawToken: string | null) => {
  if (!rawToken || rawToken === "null" || rawToken === "undefined") {
    return null;
  }

  return rawToken.replace(/['"]+/g, "").replace(/\s/g, "");
};

const jobApplicationsApi = axios.create({
  baseURL: `${finalUrl}/api/jobapplications`,
  headers: {
    "Content-Type": "application/json",
  },
});

jobApplicationsApi.interceptors.request.use((config) => {
  const token = cleanToken(localStorage.getItem(tokenKey));

  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    };
  }

  return config;
});

export const listJobApplications = async () => {
  const response = await jobApplicationsApi.get<JobApplication[]>("");
  return response.data;
};

export const createJobApplication = async (input: JobApplicationCreateInput) => {
  const response = await jobApplicationsApi.post<JobApplication>("", {
    companyName: input.companyName,
    position: input.position,
    status: input.status,
  });

  return response.data;
};

export const deleteJobApplication = async (id: string) => {
  await jobApplicationsApi.delete(`/${id}`);
};
