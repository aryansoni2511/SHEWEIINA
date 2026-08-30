# Shewwina Database Architecture Foundation

This directory manages the database migrations, SQL schemas, and initial seeds for **Shewwina — India's Smart Waiting Platform**.

## Structure

- `/schema`: Contains table DDL definitions for PostgreSQL / Supabase.
- `/migrations`: Database schema version migrations.
- `/seeds`: Initial seed datasets for testing (e.g. demo salon business, demo services).

## Database Engine Choice

- **Engine:** PostgreSQL / Supabase PostgreSQL
- **Rationale:** High concurrency reliability, relational integrity for Queue Tokens & Business Services, native JSONB support, and built-in Realtime event streaming.
