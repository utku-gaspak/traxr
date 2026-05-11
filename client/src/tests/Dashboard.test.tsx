import { render, screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import Dashboard from '../components/Dashboard'
import { AuthProvider } from '../context/AuthContext'
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
})
