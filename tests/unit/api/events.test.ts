import { GET, POST, PUT, DELETE } from '../../mocks/app/api/events/route'
import { NextRequest } from 'next/server'

describe('Events API', () => {
  const mockRequest = (body?: any) => {
    return new NextRequest('http://localhost:3000/api/events', {
      method: body ? 'POST' : 'GET',
      ...(body && {
        body: JSON.stringify(body),
      }),
    })
  }

  describe('GET /api/events', () => {
    it('should return events list', async () => {
      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('message', 'Get events endpoint')
    })
  })

  describe('POST /api/events', () => {
    it('should create a new event', async () => {
      const eventData = {
        title: 'Test Event',
        start: '2024-03-20T10:00:00Z',
        end: '2024-03-20T11:00:00Z',
        description: 'Test event description',
      }

      const response = await POST(mockRequest(eventData))
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('message', 'Create event endpoint')
      expect(data).toHaveProperty('data', eventData)
    })

    it('should handle invalid request body', async () => {
      const response = await POST(mockRequest('invalid'))
      expect(response.status).toBe(500)
    })
  })

  describe('PUT /api/events', () => {
    it('should update an event', async () => {
      const updateData = {
        id: '123',
        title: 'Updated Event',
        start: '2024-03-20T10:00:00Z',
        end: '2024-03-20T11:00:00Z',
      }

      const response = await PUT(mockRequest(updateData))
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('message', 'Update event endpoint')
      expect(data).toHaveProperty('data', updateData)
    })

    it('should handle invalid request body', async () => {
      const response = await PUT(mockRequest('invalid'))
      expect(response.status).toBe(500)
    })
  })

  describe('DELETE /api/events', () => {
    it('should delete an event', async () => {
      const response = await DELETE()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('message', 'Delete event endpoint')
    })
  })
}) 