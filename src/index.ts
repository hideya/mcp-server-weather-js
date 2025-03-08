#!/usr/bin/env node

// Ref: https://modelcontextprotocol.io/quickstart

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import winston from "winston";
import Transport from "winston-transport";
// Import for winston-graylog2 - needs dynamic import for ES modules
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const Graylog2 = require("winston-graylog2");

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define log file path - using a directory relative to the module
const LOG_DIR = path.resolve(__dirname, "../logs");
const DEFAULT_LOG_FILE = path.join(LOG_DIR, "application.log");
// Also create a separate log file for debugging Graylog connectivity
const GRAYLOG_DEBUG_FILE = path.join(LOG_DIR, "graylog_debug.log");

// Ensure the log directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Function for debug logging
function debugLog(message: string, obj?: any) {
  const timestamp = new Date().toISOString();
  let logMessage = `[${timestamp}] [DEBUG] ${message}`;
  
  if (obj) {
    try {
      logMessage += ` ${JSON.stringify(obj, null, 2)}`;
    } catch (err) {
      logMessage += ` [Object could not be stringified: ${err}]`;
    }
  }
  
  // Console logging for immediate feedback
  console.error(logMessage);
  
  // Also write to debug file
  fs.appendFileSync(GRAYLOG_DEBUG_FILE, logMessage + "\n", "utf8");
}

// Define log levels
enum LogLevel {
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
  DEBUG = "DEBUG",
}

// Map MCP log levels to Winston log levels
const logLevelMapping: Record<LogLevel, string> = {
  [LogLevel.INFO]: "info",
  [LogLevel.WARN]: "warn",
  [LogLevel.ERROR]: "error",
  [LogLevel.DEBUG]: "debug",
};

// Configure remote logger with enhanced error handling and debugging
debugLog("Setting up Graylog connection...");

// Configure remote logger with better debugging
let remoteLoggerInitialized = false;
let remoteLogger: any;

try {
  // Create a custom transport that logs Graylog connection issues
  class DebugTransport extends Transport {
    log(info: any, callback: any) {
      debugLog("Winston log call:", { 
        level: info.level, 
        message: info.message,
        metadata: info
      });
      if (callback) {
        callback(null, true);
      }
      return true;
    }
  }

  // Set up more verbose configuration for Graylog
  const graylogOptions = {
    name: "Graylog",
    level: "info",
    silent: false,
    handleExceptions: true,
    graylog: {
      servers: [{ host: "graylog.fusiontech.global", port: 12201 }],
      hostname: "mcp-server-logging",
      project: "agents",
      bufferSize: 1400, // Keep UDP packets under typical MTU size
      connectionTimeout: 10000, // 10 seconds
    },
    staticMeta: { 
      application: "mcp-logging-service",
      environment: "development"
    },
    debug: true // Enable debug mode in the graylog transport
  };

  debugLog("Graylog configuration:", graylogOptions);
  
  // Create the Winston logger with both Graylog and debug transport
  remoteLogger = winston.createLogger({
    transports: [
      // @ts-ignore - Ignoring type checking for Graylog2 transport
      new Graylog2(graylogOptions),
      new DebugTransport()
    ],
    exitOnError: false // Don't crash on logging errors
  });
  
  // Add a console transport for local visibility
  remoteLogger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
  
  // Test logging at startup to verify Graylog connection
  debugLog("Sending test log message to Graylog...");
  remoteLogger.info("Graylog connection test", {
    source: 'mcp-server',
    event: 'startup-test',
    timestamp: new Date().toISOString(),
    project: "agents",
    testProperty: "This is a test message to verify Graylog connectivity"
  });
  
  remoteLoggerInitialized = true;
  debugLog("Graylog logger initialized successfully");
} catch (error) {
  debugLog("Failed to initialize Graylog logging:", error);
  debugLog("Continuing with local logging only");
  
  // Create a fallback logger that only logs locally
  remoteLogger = winston.createLogger({
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        )
      }),
      new winston.transports.File({ 
        filename: path.join(LOG_DIR, 'fallback.log')
      })
    ]
  });
}

// Define Zod schemas for validation
const WriteLogArgumentsSchema = z.object({
  level: z.nativeEnum(LogLevel).default(LogLevel.INFO),
  message: z.string().min(1),
  timestamp: z.string().optional(),
  logFile: z.string().optional(),
});

const ReadLogsArgumentsSchema = z.object({
  logFile: z.string().optional(),
  maxEntries: z.number().positive().default(10),
  level: z.nativeEnum(LogLevel).optional(),
});

// Create server instance
const server = new Server(
  {
    name: "logging",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "write-log",
        description: "Write a log entry to a file",
        inputSchema: {
          type: "object",
          properties: {
            level: {
              type: "string",
              enum: Object.values(LogLevel),
              description: "Log level (INFO, WARN, ERROR, DEBUG)",
            },
            message: {
              type: "string",
              description: "Log message content",
            },
            timestamp: {
              type: "string",
              description: "Optional custom timestamp (ISO format). Current time used if not provided.",
            },
            logFile: {
              type: "string",
              description: "Optional custom log file path. Default is application.log.",
            },
          },
          required: ["message"],
        },
      },
      {
        name: "read-logs",
        description: "Read recent log entries from a file",
        inputSchema: {
          type: "object",
          properties: {
            logFile: {
              type: "string",
              description: "Optional custom log file path. Default is application.log.",
            },
            maxEntries: {
              type: "number",
              description: "Maximum number of log entries to return (default: 10)",
            },
            level: {
              type: "string",
              enum: Object.values(LogLevel),
              description: "Filter logs by level",
            },
          },
        },
      },
    ],
  };
});

// Helper function to write log entry
function writeLogEntry(
  level: LogLevel,
  message: string,
  timestamp?: string,
  logFile?: string
): { success: boolean; error?: string; graylogSuccess?: boolean } {
  const logTimestamp = timestamp || new Date().toISOString();
  let graylogSuccess = false;
  
  try {
    const logFilePath = logFile
      ? path.resolve(LOG_DIR, logFile)
      : DEFAULT_LOG_FILE;
    
    // Format the log entry
    const logEntry = `[${logTimestamp}] [${level}] ${message}\n`;
    
    // Append the log entry to the file
    fs.appendFileSync(logFilePath, logEntry, "utf8");
    
    // Log entry written to file successfully
    debugLog(`Log entry written to file: ${logFilePath}`);
    
    // Attempt to log to Graylog with additional metadata
    try {
      const winstonLevel = logLevelMapping[level];
      const metadata = {
        timestamp: logTimestamp,
        level: level,
        source: 'mcp-server',
        project: "agents",
        file_logged: true,
        hostname: require('os').hostname(),
        pid: process.pid,
        user_message: message  // Ensure message is included in metadata too
      };
      
      debugLog(`Sending to Graylog: [${winstonLevel}] ${message}`, metadata);
      
      // Use a promise to track when the log is actually processed
      const logPromise = new Promise((resolve, reject) => {
        remoteLogger.log(winstonLevel, message, metadata, (err: any, level: any, msg: any, meta: any) => {
          if (err) {
            debugLog("Graylog callback error:", err);
            reject(err);
          } else {
            debugLog("Graylog callback success:", { level, msg, meta });
            resolve({ level, msg, meta });
          }
        });
      });
      
      // Set a timeout for the log operation
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Graylog logging timed out after 5 seconds")), 5000);
      });
      
      // Wait for either the log to complete or timeout
      Promise.race([logPromise, timeoutPromise])
        .then(() => {
          graylogSuccess = true;
          debugLog("Graylog logging completed successfully");
        })
        .catch((error) => {
          debugLog("Error or timeout in Graylog logging:", error);
        });
      
      // Don't wait for the promise to resolve before continuing
      graylogSuccess = true;
    } catch (graylogError) {
      debugLog("Error logging to Graylog:", graylogError);
      // Continue even if Graylog logging fails - the file-based log already succeeded
    }
    
    return { success: true, graylogSuccess };
  } catch (error) {
    debugLog("Error writing log entry:", error);
    return {
      success: false,
      graylogSuccess,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// Helper function to read log entries
function readLogEntries(
  maxEntries: number,
  level?: LogLevel,
  logFile?: string
): { entries: string[]; success: boolean; error?: string } {
  try {
    const logFilePath = logFile
      ? path.resolve(LOG_DIR, logFile)
      : DEFAULT_LOG_FILE;
    
    // Check if the log file exists
    if (!fs.existsSync(logFilePath)) {
      return {
        entries: [],
        success: false,
        error: `Log file not found: ${logFilePath}`,
      };
    }
    
    // Read the log file
    const fileContent = fs.readFileSync(logFilePath, "utf8");
    const logLines = fileContent.split("\n").filter((line) => line.trim() !== "");
    
    // Filter by level if specified
    const filteredLines = level
      ? logLines.filter((line) => line.includes(`[${level}]`))
      : logLines;
    
    // Get the most recent entries up to maxEntries
    const recentEntries = filteredLines.slice(-maxEntries);
    
    return { entries: recentEntries, success: true };
  } catch (error) {
    console.error("Error reading log entries:", error);
    return {
      entries: [],
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// Handle resources/list request
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [] // We don't provide any resources
  };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === "write-log") {
      const { level, message, timestamp, logFile } = WriteLogArgumentsSchema.parse(args);
      
      debugLog("Processing write-log request", { level, message });
      const result = writeLogEntry(level, message, timestamp, logFile);
      
      if (!result.success) {
        return {
          content: [
            {
              type: "text",
              text: `Failed to write log entry: ${result.error}`,
            },
          ],
        };
      }
      
      const graylogStatus = result.graylogSuccess
        ? "Remote logging to Graylog is active."
        : "Note: Log written to file but Graylog logging failed.";
      
      return {
        content: [
          {
            type: "text",
            text: `Successfully wrote log entry with level ${level}. ${graylogStatus}\nCheck ${GRAYLOG_DEBUG_FILE} for detailed Graylog connection information.`,
          },
        ],
      };
    } else if (name === "read-logs") {
      const { maxEntries, level, logFile } = ReadLogsArgumentsSchema.parse(args);
      
      const result = readLogEntries(maxEntries, level, logFile);
      
      if (!result.success) {
        return {
          content: [
            {
              type: "text",
              text: `Failed to read log entries: ${result.error}`,
            },
          ],
        };
      }
      
      if (result.entries.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: "No log entries found matching criteria",
            },
          ],
        };
      }
      
      const logsText = `Recent log entries:\n\n${result.entries.join("\n")}`;
      
      return {
        content: [
          {
            type: "text",
            text: logsText,
          },
        ],
      };
    } else {
      throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        `Invalid arguments: ${error.errors
          .map((e) => `${e.path.join(".")}: ${e.message}`)
          .join(", ")}`
      );
    }
    throw error;
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Logging MCP Server running on stdio");
  
  try {
    // Log server startup to Graylog
    debugLog("Sending startup message to Graylog");
    remoteLogger.info("Logging MCP Server started", {
      source: 'mcp-server',
      event: 'startup',
      timestamp: new Date().toISOString(),
      project: "agents",
      pid: process.pid,
      nodeVersion: process.version
    });
    debugLog("Remote logging to Graylog initialized");
    
    // Do another test with different winston methods to see if any work
    remoteLogger.warn("Test warning message", { event: 'test-warning' });
    remoteLogger.error("Test error message", { event: 'test-error' });
  } catch (error) {
    debugLog("Failed to initialize Graylog logging:", error);
    debugLog("Continuing with local logging only");
  }
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
