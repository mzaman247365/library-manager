# Database Configuration Guide

This application supports both Neon cloud PostgreSQL and standard local PostgreSQL installations. This guide explains how to configure the database connection for different environments.

## Configuration Options

The database connection is configured through environment variables in the `.env` file. You can copy the `.env.example` file to create your own configuration.

### Choosing Database Type

Set the `DB_TYPE` environment variable to choose which type of database to connect to:

```
# Valid values: 'neon' or 'postgres'
DB_TYPE=neon
```

### Neon PostgreSQL Configuration

When using Neon cloud PostgreSQL (`DB_TYPE=neon`), configure the following:

```
# Neon Database connection string
DATABASE_URL=postgres://user:password@host/database

# Alternative variable name
NEON_DATABASE_URL=postgres://user:password@host/database
```

Note: WebSockets are automatically configured for Neon connections in serverless environments.

### Standard PostgreSQL Configuration

When using a standard PostgreSQL installation (`DB_TYPE=postgres`), configure the following:

```
# PostgreSQL connection parameters
PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=your_password
PGDATABASE=library
```

## Migration Between Database Types

To migrate from Neon to a local PostgreSQL database:

1. Export your data from Neon (using pg_dump or similar tool)
2. Import the data into your local PostgreSQL database
3. Update your `.env` file to use `DB_TYPE=postgres` and configure the PG* environment variables
4. Restart the application

To migrate from local PostgreSQL to Neon:

1. Export your data from your local PostgreSQL database
2. Import the data into your Neon cloud database
3. Update your `.env` file to use `DB_TYPE=neon` and configure the DATABASE_URL
4. Restart the application

## Session Management

Session data is stored in the database, so it will persist between application restarts regardless of which database type you're using. The session configuration uses the same database connection as the rest of the application.

## Troubleshooting

If you encounter database connection issues:

1. Verify your environment variables are correctly set
2. Check that your database server is running and accessible
3. Ensure your database user has the necessary permissions
4. Check the console logs for specific error messages

For Neon database issues, ensure your project has the correct permissions and your connection string is up to date.