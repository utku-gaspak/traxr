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

  it('Dashboard_FiltersApplications_BySearchStatusAndInterest', async () => {
    const { container } = renderDashboard()

    expect(await screen.findByText('Acme')).toBeInTheDocument()
    expect(screen.getByText('Globex')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Search applications'), {
      target: { value: 'acme' },
    })
    fireEvent.change(screen.getByRole('combobox', { name: 'Filter status' }), {
      target: { value: String(JobApplicationStatus.Applied) },
    })
    fireEvent.change(
      screen.getByRole('combobox', { name: 'Filter interest level' }),
      {
        target: { value: '5' },
      },
    )

    await waitFor(() => {
      expect(screen.getByText('Acme')).toBeInTheDocument()
      expect(screen.queryByText('Globex')).not.toBeInTheDocument()
      expect(container.querySelectorAll('article.application-card')).toHaveLength(1)
    })
  })

  it('Dashboard_SkillTransfer_FiltersBySelectedSkillAndCanClearAll', async () => {
    const { container } = renderDashboard()

    expect(await screen.findByText('Acme')).toBeInTheDocument()
    expect(screen.getByText('Globex')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Add C#' }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Remove C#' })).toBeInTheDocument()
      expect(screen.queryByText('Globex')).not.toBeInTheDocument()
      expect(container.querySelectorAll('article.application-card')).toHaveLength(1)
    })

    fireEvent.click(screen.getByRole('button', { name: 'Clear All' }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Add C#' })).toBeInTheDocument()
      expect(screen.getByText('Globex')).toBeInTheDocument()
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

    fireEvent.click(screen.getByRole('button', { name: /Acme/i }))
    fireEvent.click(await screen.findByRole('button', { name: 'Edit Application' }))
    fireEvent.change(screen.getByPlaceholderText('Example: Stripe'), {
      target: { value: 'Acme' },
    })
    fireEvent.change(screen.getByPlaceholderText('Example: Backend Engineer'), {
      target: { value: 'Backend Engineer' },
    })
    fireEvent.change(screen.getByRole('combobox', { name: 'Status' }), {
      target: { value: String(JobApplicationStatus.Offer) },
    })
    fireEvent.change(screen.getByRole('slider', { name: 'Interest Level' }), {
      target: { value: '4' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Remove C#' }))
    const technicalStackInput = screen.getByLabelText('Technical Stack')
    fireEvent.change(technicalStackInput, {
      target: { value: '.NET' },
    })
    fireEvent.keyDown(technicalStackInput, { key: 'Enter' })
    expect(technicalStackInput).toHaveValue('')
    expect(screen.getByText('.NET')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }))

    await waitFor(() => {
      expect(mockApiState.updateJobApplicationRequests).toHaveLength(1)
      expect(mockApiState.updateJobApplicationRequests[0]?.id).toBe('job-1')
      expect(mockApiState.updateJobApplicationRequests[0]?.body.interestLevel).toBe(4)
      expect(mockApiState.updateJobApplicationRequests[0]?.body.technicalStack).toBe('PostgreSQL, React, .NET')
    })
    expect(screen.getAllByText('Offer').length).toBeGreaterThan(0)
  })

  it('JobApplication_Delete_RemovesFromList', async () => {
    const { container } = renderDashboard()

    expect(await screen.findByText('Acme')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Acme/i }))
    fireEvent.click(await screen.findByRole('button', { name: 'Delete Application' }))

    await waitFor(() => {
      expect(screen.queryByText('Acme')).not.toBeInTheDocument()
      expect(container.querySelectorAll('article.application-card')).toHaveLength(1)
    })
    expect(mockApiState.deleteJobApplicationRequests).toEqual(['job-1'])
  })

  it('Form_InvalidInput_ShowsValidationErrors', async () => {
    renderDashboard()

    expect(await screen.findByText('Acme')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'New Application' }))
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
    fireEvent.click(screen.getByRole('button', { name: 'New Application' }))

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
