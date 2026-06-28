import { createLogger, format, transports } from 'winston';

const { combine, timestamp, printf, colorize, errors, json } = format;

const isProduction = process.env.NODE_ENV === 'production';

// ─── Development format ───────────────────────────────────────────────────────
// Human-readable, colourised, single line per entry.
// Shows: timestamp  LEVEL  message  (stack trace on errors)
const devFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ timestamp, level, message, stack }) =>
    stack
      ? `${timestamp}  ${level}  ${message}\n${stack}`
      : `${timestamp}  ${level}  ${message}`
  )
);

// ─── Production format ────────────────────────────────────────────────────────
// Structured JSON — one JSON object per line.
// Render captures stdout and lets you search/filter by field in the dashboard.
// Each entry includes: timestamp, level, message, and any extra fields passed in.
const prodFormat = combine(
  timestamp(),
  errors({ stack: true }),
  json()
);

const logger = createLogger({
  level: isProduction ? 'info' : 'debug',
  format: isProduction ? prodFormat : devFormat,
  transports: [
    new transports.Console(),
  ],

  // Prevent Winston from crashing the process on unhandled logger errors
  exitOnError: false,
});

export default logger;
