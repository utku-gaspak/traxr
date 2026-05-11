import { http, HttpResponse } from 'msw'
import { finalUrl } from '../../baseUrl'
import { JobApplicationStatus, type JobApplication } from '../../types'

interface LoginRequestBody {
  username: string
  password: string
}

interface CreateJobApplicationBody {
  companyName: string
  position: string
  status: JobApplicationStatus
}

interface MockApiState {
  loginRequests: LoginRequestBody[]
  createJobApplicationRequests: CreateJobApplicationBody[]
  jobApplications: JobApplication[]
}

const defaultJobs: JobApplication[] = [
  {
    id: 'job-1',
    companyName: 'Acme',
    position: 'Backend Engineer',
    status: JobApplicationStatus.Applied,
    dateApplied: '2026-05-11T12:00:00.000Z',
    userId: 'user-1',
  },
  {
    id: 'job-2',
    companyName: 'Globex',
    position: 'Platform Engineer',
    status: JobApplicationStatus.Interviewing,
    dateApplied: '2026-05-10T12:00:00.000Z',
    userId: 'user-1',
  },
]

export const mockApiState: MockApiState = {
  loginRequests: [],
  createJobApplicationRequests: [],
  jobApplications: [...defaultJobs],
}

export const resetMockApiState = () => {
  mockApiState.loginRequests = []
  mockApiState.createJobApplicationRequests = []
  mockApiState.jobApplications = [...defaultJobs]
}

export const handlers = [
  http.post(`${finalUrl}/api/account/login`, async ({ request }) => {
    const body = (await request.json()) as LoginRequestBody
    mockApiState.loginRequests.push(body)

    return HttpResponse.json({
      token: 'test-jwt-token',
      userName: body.username,
      email: `${body.username}@example.com`,
    })
  }),

  http.get(`${finalUrl}/api/jobapplications`, () => {
    return HttpResponse.json(mockApiState.jobApplications)
  }),

  http.post(`${finalUrl}/api/jobapplications`, async ({ request }) => {
    const body = (await request.json()) as CreateJobApplicationBody
    mockApiState.createJobApplicationRequests.push(body)

    const createdApplication: JobApplication = {
      id: `job-${mockApiState.jobApplications.length + 1}`,
      companyName: body.companyName,
      position: body.position,
      status: body.status,
      dateApplied: '2026-05-12T12:00:00.000Z',
      userId: 'user-1',
    }

    mockApiState.jobApplications = [createdApplication, ...mockApiState.jobApplications]
    return HttpResponse.json(createdApplication, { status: 201 })
  }),
]
