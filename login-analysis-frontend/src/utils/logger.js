/**
 * Winston-compatible Frontend Logger for Login Security & Anomaly Platform.
 * Supports standard RFC5424 / Winston log levels: error, warn, info, http, debug.
 * Maintains an in-memory ring-buffer for live SOC log streaming & diagnostic export.
 */

// Colors for styled browser console output
const LEVEL_STYLES = {
  error: 'background: #ef4444; color: white; padding: 2px 6px; border-radius: 3px; font-weight: bold;',
  warn:  'background: #f59e0b; color: black; padding: 2px 6px; border-radius: 3px; font-weight: bold;',
  info:  'background: #06b6d4; color: black; padding: 2px 6px; border-radius: 3px; font-weight: bold;',
  http:  'background: #8b5cf6; color: white; padding: 2px 6px; border-radius: 3px; font-weight: bold;',
  debug: 'background: #64748b; color: white; padding: 2px 6px; border-radius: 3px; font-weight: bold;',
};

const LOG_BUFFER_MAX = 200;
const logHistory = [];

function appendLog(level, message, meta) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    meta: meta || {},
  };

  logHistory.unshift(entry);
  if (logHistory.length > LOG_BUFFER_MAX) {
    logHistory.pop();
  }

  // Dispatch custom event for UI listeners (e.g., live log drawer)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('winston-log', { detail: entry }));
  }

  return entry;
}

class FrontendWinstonLogger {
  constructor() {
    this.level = 'debug';
  }

  formatEntry(level, message, meta) {
    const time = new Date().toLocaleTimeString();
    return [`%c[WINSTON ${level.toUpperCase()}]%c [${time}] ${message}`, LEVEL_STYLES[level] || '', 'color: #94a3b8;'];
  }

  info(message, meta) {
    appendLog('info', message, meta);
    const [fmt, ...args] = this.formatEntry('info', message, meta);
    if (meta && Object.keys(meta).length > 0) {
      console.info(fmt, ...args, meta);
    } else {
      console.info(fmt, ...args);
    }
  }

  warn(message, meta) {
    appendLog('warn', message, meta);
    const [fmt, ...args] = this.formatEntry('warn', message, meta);
    if (meta && Object.keys(meta).length > 0) {
      console.warn(fmt, ...args, meta);
    } else {
      console.warn(fmt, ...args);
    }
  }

  error(message, meta) {
    appendLog('error', message, meta);
    const [fmt, ...args] = this.formatEntry('error', message, meta);
    if (meta && Object.keys(meta).length > 0) {
      console.error(fmt, ...args, meta);
    } else {
      console.error(fmt, ...args);
    }
  }

  http(message, meta) {
    appendLog('http', message, meta);
    const [fmt, ...args] = this.formatEntry('http', message, meta);
    if (meta && Object.keys(meta).length > 0) {
      console.log(fmt, ...args, meta);
    } else {
      console.log(fmt, ...args);
    }
  }

  debug(message, meta) {
    appendLog('debug', message, meta);
    const [fmt, ...args] = this.formatEntry('debug', message, meta);
    if (meta && Object.keys(meta).length > 0) {
      console.debug(fmt, ...args, meta);
    } else {
      console.debug(fmt, ...args);
    }
  }

  getLogs() {
    return [...logHistory];
  }

  clearLogs() {
    logHistory.length = 0;
  }
}

export const logger = new FrontendWinstonLogger();
export default logger;
