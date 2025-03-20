import { GET } from '../../mocks/app/api/health/route'
import { NextResponse } from 'next/server'

describe('Health API', () => {
  it('should return healthy status', async () => {
    const response = await GET()
    const data = await response.json()

    expect(response).toBeInstanceOf(NextResponse)
    expect(response.status).toBe(200)
    expect(data).toEqual(
      expect.objectContaining({
        status: 'healthy',
        timestamp: expect.any(String),
      })
    )

    // Verify timestamp is valid ISO string
    expect(() => new Date(data.timestamp)).not.toThrow()
  })
}) 