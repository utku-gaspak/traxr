import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { delay, http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import Dashboard from '../components/Dashboard'
import { AuthProvider } from '../context/AuthContext'
import { JobApplicationStatus } from '../types'
import { mockApiState } from './mocks/handlers'
import { server } from './mocks/server'
import { finalUrl } from '../baseUrl'

const renderDashboard = () => {
  localStorage.setItem('token', 'test-jwt-token')

  return render(
    <AuthProvider>
      <Dashboard />
    </AuthProvider>,
  )
}

describe('Dashboard', () => {
  it('Dashboard_LoadApplications_RendersTwoJobCards', async () => {
    const { container } = renderDashboard()

    expect(await screen.findByText('Acme')).toBeInTheDocument()
    expect(screen.getByText('Globex')).toBeInTheDocument()

    await waitFor(() => {
      expect(container.querySelectorAll('article.application-card')).toHaveLength(2)
    })
  })

  it('Dashboard_SlowLoad_ShowsSpinner', async () => {
    server.use(
      http.get(`${finalUrl}/api/jobapplications`, async () => {
        await delay(150)
        return HttpResponse.json(mockApiState.jobApplications)
      }),
    )

    renderDashboard()

    expect(screen.getByText('Loading applications...')).toBeInTheDocument()
    expect(await screen.findByText('Acme')).toBeInTheDocument()
  })

  it('Dashboard_LoadUnauthorizedApplications_ShowsErrorMessage', async () => {
    server.use(
      http.get(`${finalUrl}/api/jobapplications`, () =>
        HttpResponse.json(
          { message: 'Unauthorized' },
          { status: 401 },
        ),
      ),
    )

    renderDashboard()

    expect(
      await screen.findByText('Could not load job applications.'),
    ).toBeInTheDocument()
  })

  it('Dashboard_ServerError_ShowsErrorMessage', async () => {
    server.use(
      http.get(`${finalUrl}/api/jobapplications`, () =>
        HttpResponse.json(
          { message: 'Internal Server Error' },
          { status: 500 },
        ),
      ),
    )

    renderDashboard()

    expect(
      await screen.findByText('Something went wrong. Please try again.'),
    ).toBeInTheDocument()
  })

  it('Dashboard_NetworkError_ShowsConnectionMessage', async () => {
    server.use(
      http.get(`${finalUrl}/api/jobapplications`, () => HttpResponse.error()),
    )

    renderDashboard()

    expect(
      await screen.findByText('Could not reach the server. Check your connection and try again.'),
    ).toBeInTheDocument()
  })

  it('JobApplication_Update_UpdatesList', async () => {
    renderDashboard()

    expect(await screen.findByText('Acme')).toBeInTheDocument()

    fireEvent.click(screen.getAllByRole('button', { name: 'Edit' })[0])
    fireEvent.change(screen.getByPlaceholderText('Example: Stripe'), {
      target: { value: 'Acme' },
    })
    fireEvent.change(screen.getByPlaceholderText('Example: Backend Engineer'), {
      target: { value: 'Backend Engineer' },
    })
    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: String(JobApplicationStatus.Offer) },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }))

    expect(await screen.findByText('Offer')).toBeInTheDocument()
    await waitFor(() => {
      expect(mockApiState.updateJobApplicationRequests).toHaveLength(1)
      expect(mockApiState.updateJobApplicationRequests[0]?.id).toBe('job-1')
    })
  })

  it('JobApplication_Delete_RemovesFromList', async () => {
    const { container } = renderDashboard()

    expect(await screen.findByText('Acme')).toBeInTheDocument()
    fireEvent.click(screen.getAllByRole('button', { name: 'Delete' })[0])

    await waitFor(() => {
      expect(screen.queryByText('Acme')).not.toBeInTheDocument()
      expect(container.querySelectorAll('article.application-card')).toHaveLength(1)
    })
    expect(mockApiState.deleteJobApplicationRequests).toEqual(['job-1'])
  })

  it('Form_InvalidInput_ShowsValidationErrors', async () => {
    renderDashboard()

    expect(await screen.findByText('Acme')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Add Application' }))

    expect(await screen.findByText('Company name is required.')).toBeInTheDocument()
    expect(screen.getByText('Position is required.')).toBeInTheDocument()
    expect(mockApiState.createJobApplicationRequests).toHaveLength(0)
  })

  it('Form_SubmitPending_DisablesButton', async () => {
    server.use(
      http.post(`${finalUrl}/api/jobapplications`, async ({ request }) => {
        const body = await request.json()
        await delay(150)
        return HttpResponse.json(
          {
            id: 'job-3',
            companyName: (body as { companyName: string }).companyName,
            position: (body as { position: string }).position,
            status: (body as { status: JobApplicationStatus }).status,
            dateApplied: '2026-05-12T12:00:00.000Z',
            userId: 'user-1',
          },
          { status: 201 },
        )
      }),
    )

    renderDashboard()

    expect(await screen.findByText('Acme')).toBeInTheDocument()

    fireEvent.change(screen.getByPlaceholderText('Example: Stripe'), {
      target: { value: 'Stripe' },
    })
    fireEvent.change(screen.getByPlaceholderText('Example: Backend Engineer'), {
      target: { value: 'Frontend Engineer' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Add Application' }))

    const submitButton = screen.getByRole('button', { name: 'Saving...' })
    expect(submitButton).toBeDisabled()

    expect(await screen.findByText('Stripe')).toBeInTheDocument()
  })

  it('Dashboard_EmptyState_ShowsNoApplicationsMessage', async () => {
    server.use(
      http.get(`${finalUrl}/api/jobapplications`, () => HttpResponse.json([])),
    )

    renderDashboard()

    expect(
      await screen.findByText(
        'No applications yet. Add your first one and it will appear here immediately.',
      ),
    ).toBeInTheDocument()
  })
})
