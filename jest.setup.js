// jest.setup.js
import { config } from 'dotenv'

// Load environment variables for testing
config({ path: '.env.local' })

// Mock console methods to avoid cluttering test output
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}
