# MySQL MCP Server

A Model Context Protocol (MCP) server implementation for MySQL databases. This server enables AI assistants to interact with MySQL databases through a standardized protocol.

## Features

- **Query Execution**: Execute SELECT queries safely
- **Statement Execution**: Run INSERT, UPDATE, DELETE, and DDL statements
- **Schema Exploration**: List tables and describe table structures
- **Connection Pooling**: Efficient connection management
- **Error Handling**: Comprehensive error messages

## Installation

### Prerequisites

- Node.js 18 or higher
- MySQL server
- npm or yarn

### Setup

1. Clone or download this repository

2. Install dependencies:
```bash
npm install
```

3. Configure your MySQL connection by creating a `.env` file:
```bash
cp .env.example .env
```

4. Edit `.env` with your MySQL credentials:
```env
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=your_database
```

5. Build the project:
```bash
npm run build
```

## Usage

### Running the Server

Start the MCP server:
```bash
npm start
```

Or for development with auto-rebuild:
```bash
npm run watch
```

### Available Tools

The server provides four tools for interacting with MySQL:

#### 1. `query`
Execute SELECT queries to retrieve data.

**Parameters:**
- `sql` (string): The SELECT query to execute

**Example:**
```json
{
  "sql": "SELECT * FROM users WHERE age > 18"
}
```

#### 2. `execute`
Execute INSERT, UPDATE, DELETE, or DDL statements.

**Parameters:**
- `sql` (string): The SQL statement to execute

**Example:**
```json
{
  "sql": "INSERT INTO users (name, email) VALUES ('John Doe', 'john@example.com')"
}
```

#### 3. `list_tables`
List all tables in the current database.

**Parameters:** None

#### 4. `describe_table`
Get the schema/structure of a specific table.

**Parameters:**
- `table` (string): The name of the table to describe

**Example:**
```json
{
  "table": "users"
}
```

### Configuring with MCP Clients

To use this server with an MCP client (like Claude Desktop), add it to your client's configuration:

```json
{
  "mcpServers": {
    "mysql": {
      "command": "node",
      "args": ["/path/to/mysql-mcp-server/dist/index.js"],
      "env": {
        "MYSQL_HOST": "localhost",
        "MYSQL_PORT": "3306",
        "MYSQL_USER": "root",
        "MYSQL_PASSWORD": "your_password",
        "MYSQL_DATABASE": "your_database"
      }
    }
  }
}
```

## Security Considerations

- The server validates that `query` tool only accepts SELECT statements
- Table names are validated to prevent SQL injection
- Use strong database passwords
- Consider using a database user with limited privileges
- Never commit your `.env` file with real credentials

## Development

### Project Structure

```
mysql-mcp-server/
├── src/
│   └── index.ts          # Main server implementation
├── dist/                 # Compiled JavaScript (generated)
├── package.json          # Project dependencies
├── tsconfig.json         # TypeScript configuration
├── .env.example          # Example environment variables
└── README.md            # This file
```

### Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Run the compiled server
- `npm run dev` - Build and run
- `npm run watch` - Watch for changes and rebuild

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.
