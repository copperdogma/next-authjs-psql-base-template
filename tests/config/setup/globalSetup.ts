import { execSync } from 'child_process'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function globalSetup() {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('globalSetup should only run in test environment')
  }

  try {
    // Reset and set up the test database
    console.log('🗄️  Setting up test database...')
    execSync('npx prisma db push --force-reset', { 
      env: { ...process.env, NODE_ENV: 'test' },
      stdio: 'inherit'
    })

    // Verify database connection
    await prisma.$connect()
    console.log('✅ Database connection verified')

  } catch (error) {
    console.error('❌ Database setup failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

export default globalSetup 