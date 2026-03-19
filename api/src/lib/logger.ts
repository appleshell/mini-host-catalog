import fs from 'fs'
import path from 'path'

const logDir = path.join(__dirname, '../logs')
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true })
}

export function logError(error: any, context?: string) {
  const timestamp = new Date().toISOString()
  const logFile = path.join(logDir, `error-${new Date().toISOString().slice(0, 10)}.log`)
  const message = `[${timestamp}] ${context || 'ERROR'}: ${error.message || error}\n${error.stack || ''}\n\n`
  fs.appendFileSync(logFile, message)
  console.error(message)
}

export function logInfo(message: string) {
  const timestamp = new Date().toISOString()
  console.log(`[${timestamp}] ${message}`)
}
