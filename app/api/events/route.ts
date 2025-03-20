import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const events = await prisma.event.findMany()
    return NextResponse.json({ events })
  } catch (err) {
    console.error('Failed to fetch events:', err)
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const event = await prisma.event.create({ data })
    return NextResponse.json({ event })
  } catch (err) {
    console.error('Failed to create event:', err)
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json()
    const event = await prisma.event.update({
      where: { id: data.id },
      data: data.updates
    })
    return NextResponse.json({ event })
  } catch (err) {
    console.error('Failed to update event:', err)
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json()
    await prisma.event.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Failed to delete event:', err)
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 })
  }
} 