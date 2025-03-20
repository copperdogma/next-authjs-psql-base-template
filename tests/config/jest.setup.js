// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'
import { TextEncoder, TextDecoder } from 'util'
import { jest } from '@jest/globals'

// Import our mock objects
import { mockAuth, mockApp, mockSignInWithPopup, mockSignOut, mockGoogleAuthProvider } from '../mocks/firebase';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  })),
}))

// Mock Next.js headers
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  })),
}))

// Mock environment variables for Firebase
process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'mock-api-key';
process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = 'mock-auth-domain';
process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'mock-project-id';
process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = 'mock-storage-bucket';
process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = 'mock-messaging-sender-id';
process.env.NEXT_PUBLIC_FIREBASE_APP_ID = 'mock-app-id';

// Mock Firebase auth functions
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => mockAuth),
  signInWithPopup: mockSignInWithPopup,
  signOut: mockSignOut,
  GoogleAuthProvider: mockGoogleAuthProvider,
}));

// Mock Firebase app
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => mockApp),
  getApps: jest.fn(() => []),
}));

// Set up global mocks
global.mockAuth = mockAuth;
global.mockApp = mockApp;
global.fetch = jest.fn();

// Mock TextEncoder/TextDecoder
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Mock window.location
delete window.location
window.location = {
  href: 'http://localhost:3000',
  pathname: '/',
  search: '',
  hash: '',
  reload: jest.fn(),
  replace: jest.fn(),
  assign: jest.fn(),
}

// Standard browser API mocks
global.Response = class Response {
  constructor(body, init) {
    this.body = body
    this.init = init
    this.status = init?.status || 200
    this.ok = this.status >= 200 && this.status < 300
    this.headers = new Headers(init?.headers)
  }

  json() {
    return Promise.resolve(JSON.parse(this.body))
  }

  text() {
    return Promise.resolve(this.body)
  }

  get statusText() {
    return this.init?.statusText || ''
  }

  get type() {
    return 'basic'
  }

  get url() {
    return 'http://localhost:3000'
  }
}

global.Headers = class Headers {
  constructor(init) {
    this.headers = new Map()
    if (init) {
      Object.entries(init).forEach(([key, value]) => {
        this.headers.set(key.toLowerCase(), value)
      })
    }
  }

  append(key, value) {
    this.headers.set(key.toLowerCase(), value)
  }

  delete(key) {
    this.headers.delete(key.toLowerCase())
  }

  get(key) {
    return this.headers.get(key.toLowerCase()) || null
  }

  has(key) {
    return this.headers.has(key.toLowerCase())
  }

  set(key, value) {
    this.headers.set(key.toLowerCase(), value)
  }

  entries() {
    return this.headers.entries()
  }

  keys() {
    return this.headers.keys()
  }

  values() {
    return this.headers.values()
  }

  forEach(callback) {
    this.headers.forEach(callback)
  }
}

global.Request = class Request {
  constructor(input, init) {
    this.url = input
    this.method = init?.method || 'GET'
    this.headers = new Headers(init?.headers)
    this.body = init?.body
  }

  json() {
    return Promise.resolve(JSON.parse(this.body))
  }

  text() {
    return Promise.resolve(this.body)
  }
}

global.URL = class URL {
  constructor(url) {
    const parsedUrl = new globalThis.URL(url)
    this.href = parsedUrl.href
    this.pathname = parsedUrl.pathname
    this.search = parsedUrl.search
    this.searchParams = parsedUrl.searchParams
    this.hash = parsedUrl.hash
    this.host = parsedUrl.host
    this.hostname = parsedUrl.hostname
    this.port = parsedUrl.port
    this.protocol = parsedUrl.protocol
    this.origin = parsedUrl.origin
  }
} 