import { POST, DELETE } from '../../../mocks/app/api/auth/session/route'
import { NextRequest } from 'next/server'

describe('Auth Session API', () => {
  const mockRequest = (body?: any) => {
    return new NextRequest('http://localhost:3000/api/auth/session', {
      method: body ? 'POST' : 'DELETE',
      ...(body && {
        body: JSON.stringify(body),
      }),
    })
  }

  describe('POST /api/auth/session', () => {
    it('should create a session successfully', async () => {
      const response = await POST(mockRequest({ token: 'mock-firebase-token' }))
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({ status: 'success' })

      // Verify cookie is set
      const sessionCookie = response.cookies.get('session')
      expect(sessionCookie).toBeDefined()
      expect(sessionCookie?.value).toBe('mock-session-cookie')
      expect(sessionCookie?.httpOnly).toBe(true)
      expect(sessionCookie?.secure).toBe(false) // false in test environment
    })

    it('should handle missing token', async () => {
      const response = await POST(mockRequest({}))
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({ error: 'No token provided' })
    })

    it('should handle invalid request body', async () => {
      const response = await POST(mockRequest('invalid'))
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({ error: 'No token provided' })
    })
  })

  describe('DELETE /api/auth/session', () => {
    it('should delete session successfully', async () => {
      const response = await DELETE()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({ status: 'success' })

      // Verify session cookie is cleared
      const sessionCookie = response.cookies.get('session')
      expect(sessionCookie).toBeDefined()
      expect(sessionCookie?.value).toBe('')
      expect(sessionCookie?.maxAge).toBe(0)
    })
  })
})