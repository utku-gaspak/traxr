import axios from "axios";
import { notifyAuthTokenCleared } from "../authEvents";
import { finalUrl } from "../baseUrl";
import type {
  JobApplication,
  JobApplicationCreateInput,
  JobApplicationUpdateInput,
} from "../types";

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

jobApplicationsApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      // Treat any jobs API 401 as an invalid session and force the app back through the login flow.
      localStorage.removeItem(tokenKey);
      notifyAuthTokenCleared();
    }

    return Promise.reject(error);
  }
);

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

export const updateJobApplication = async (id: string, input: JobApplicationUpdateInput) => {
  await jobApplicationsApi.put(`/${id}`, {
    companyName: input.companyName,
    position: input.position,
    status: input.status,
    dateApplied: input.dateApplied,
  });
};

export const deleteJobApplication = async (id: string) => {
  await jobApplicationsApi.delete(`/${id}`);
};
