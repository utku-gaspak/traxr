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
  updateJobApplicationRequests: Array<{ id: string; body: CreateJobApplicationBody & { dateApplied: string } }>
  deleteJobApplicationRequests: string[]
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
  updateJobApplicationRequests: [],
  deleteJobApplicationRequests: [],
  jobApplications: [...defaultJobs],
}

export const resetMockApiState = () => {
  mockApiState.loginRequests = []
  mockApiState.createJobApplicationRequests = []
  mockApiState.updateJobApplicationRequests = []
  mockApiState.deleteJobApplicationRequests = []
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

  http.put(`${finalUrl}/api/jobapplications/:id`, async ({ params, request }) => {
    const body = (await request.json()) as CreateJobApplicationBody & { dateApplied: string }
    const id = String(params.id)

    mockApiState.updateJobApplicationRequests.push({ id, body })
    mockApiState.jobApplications = mockApiState.jobApplications.map((application) =>
      application.id === id
        ? {
            ...application,
            companyName: body.companyName,
            position: body.position,
            status: body.status,
            dateApplied: body.dateApplied,
          }
        : application,
    )

    return HttpResponse.json(null, { status: 204 })
  }),

  http.delete(`${finalUrl}/api/jobapplications/:id`, ({ params }) => {
    const id = String(params.id)

    mockApiState.deleteJobApplicationRequests.push(id)
    mockApiState.jobApplications = mockApiState.jobApplications.filter(
      (application) => application.id !== id,
    )

    return HttpResponse.json(null, { status: 204 })
  }),
]
