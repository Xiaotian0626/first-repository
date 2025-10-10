#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import mysql from "mysql2/promise";

// MySQL connection configuration from environment variables
const config = {
  host: process.env.MYSQL_HOST || "localhost",
  port: parseInt(process.env.MYSQL_PORT || "3306"),
  user: process.env.MYSQL_USER || "root",
  password: process.env.MYSQL_PASSWORD || "",
  database: process.env.MYSQL_DATABASE,
};

// Global connection pool
let pool: mysql.Pool | null = null;

// Initialize connection pool
function getPool(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool({
      ...config,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
  }
  return pool;
}

// Define available tools
const tools: Tool[] = [
  {
    name: "query",
    description:
      "Execute a SELECT query on the MySQL database. Returns the results as JSON. Use this for read-only operations.",
    inputSchema: {
      type: "object",
      properties: {
        sql: {
          type: "string",
          description: "The SELECT SQL query to execute",
        },
      },
      required: ["sql"],
    },
  },
  {
    name: "execute",
    description:
      "Execute an INSERT, UPDATE, DELETE, or other SQL statement on the MySQL database. Returns affected rows and other metadata.",
    inputSchema: {
      type: "object",
      properties: {
        sql: {
          type: "string",
          description: "The SQL statement to execute",
        },
      },
      required: ["sql"],
    },
  },
  {
    name: "list_tables",
    description: "List all tables in the current database",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "describe_table",
    description: "Get the schema/structure of a specific table",
    inputSchema: {
      type: "object",
      properties: {
        table: {
          type: "string",
          description: "The name of the table to describe",
        },
      },
      required: ["table"],
    },
  },
];

// Create MCP server
const server = new Server(
  {
    name: "mysql-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Handle list_tools request
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Handle call_tool request
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    const connection = getPool();

    switch (name) {
      case "query": {
        const { sql } = args as { sql: string };
        
        // Basic validation to ensure it's a SELECT query
        if (!sql.trim().toUpperCase().startsWith("SELECT")) {
          return {
            content: [
              {
                type: "text",
                text: "Error: Only SELECT queries are allowed with the 'query' tool. Use 'execute' for other statements.",
              },
            ],
          };
        }

        const [rows] = await connection.query(sql);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(rows, null, 2),
            },
          ],
        };
      }

      case "execute": {
        const { sql } = args as { sql: string };
        
        const [result] = await connection.query(sql);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "list_tables": {
        const [rows] = await connection.query("SHOW TABLES");
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(rows, null, 2),
            },
          ],
        };
      }

      case "describe_table": {
        const { table } = args as { table: string };
        
        // Validate table name to prevent SQL injection
        if (!/^[a-zA-Z0-9_]+$/.test(table)) {
          return {
            content: [
              {
                type: "text",
                text: "Error: Invalid table name. Only alphanumeric characters and underscores are allowed.",
              },
            ],
          };
        }

        const [rows] = await connection.query(`DESCRIBE ${table}`);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(rows, null, 2),
            },
          ],
        };
      }

      default:
        return {
          content: [
            {
              type: "text",
              text: `Error: Unknown tool: ${name}`,
            },
          ],
          isError: true,
        };
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  // Validate required environment variables
  if (!config.database) {
    console.error("Error: MYSQL_DATABASE environment variable is required");
    process.exit(1);
  }

  // Test the connection
  try {
    const testPool = getPool();
    const connection = await testPool.getConnection();
    console.error("Successfully connected to MySQL database");
    connection.release();
  } catch (error) {
    console.error(
      "Failed to connect to MySQL:",
      error instanceof Error ? error.message : String(error)
    );
    process.exit(1);
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MySQL MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
