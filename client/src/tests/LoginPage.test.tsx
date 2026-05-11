import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import LoginPage from '../pages/LoginPage'
import { AuthProvider } from '../context/AuthContext'
import { mockApiState } from './mocks/handlers'
import { server } from './mocks/server'
import { finalUrl } from '../baseUrl'

const renderLoginPage = () => {
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<div>Dashboard Home</div>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  )
}

describe('LoginPage', () => {
  it('LoginPage_SubmitValidCredentials_StoresTokenAndCallsApi', async () => {
    renderLoginPage()

    const usernameInput = screen.getByPlaceholderText('Username') as HTMLInputElement
    const passwordInput = screen.getByPlaceholderText('Password') as HTMLInputElement

    fireEvent.change(usernameInput, { target: { value: 'utku' } })
    fireEvent.change(passwordInput, { target: { value: 'Password1!' } })

    expect(usernameInput.value).toBe('utku')
    expect(passwordInput.value).toBe('Password1!')

    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }))

    await screen.findByText('Dashboard Home')

    expect(localStorage.getItem('token')).toBe('test-jwt-token')
    await waitFor(() => {
      expect(mockApiState.loginRequests).toEqual([
        { username: 'utku', password: 'Password1!' },
      ])
    })
  })

  it('LoginPage_SubmitUnauthorizedCredentials_ShowsErrorMessage', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
    server.use(
      http.post(`${finalUrl}/api/account/login`, () =>
        HttpResponse.json(
          { message: 'Unauthorized' },
          { status: 401 },
        ),
      ),
    )

    renderLoginPage()

    fireEvent.change(screen.getByPlaceholderText('Username'), {
      target: { value: 'utku' },
    })
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'wrong-password' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }))

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Invalid username or password.')
    })
    expect(localStorage.getItem('token')).toBeNull()

    alertSpy.mockRestore()
  })

  it('LoginPage_InvalidResponse_HandlesGracefully', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
    server.use(
      http.post(
        `${finalUrl}/api/account/login`,
        () =>
          new HttpResponse('{"token":', {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
      ),
    )

    renderLoginPage()

    fireEvent.change(screen.getByPlaceholderText('Username'), {
      target: { value: 'utku' },
    })
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'Password1!' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }))

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Login failed.')
    })
    expect(localStorage.getItem('token')).toBeNull()

    alertSpy.mockRestore()
  })
})
