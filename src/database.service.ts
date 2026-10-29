import { Injectable, OnApplicationShutdown, ServiceUnavailableException } from '@nestjs/common';
import { Pool, QueryResult, QueryResultRow } from 'pg';

@Injectable()
export class DatabaseService implements OnApplicationShutdown {
  private readonly pool: Pool | null;

  constructor() {
    this.pool = process.env.DATABASE_URL ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: true },
      max: 5,
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 10000,
      query_timeout: 5000,
      statement_timeout: 5000,
      application_name: 'bookclub-level1',
    }) : null;
    // Idle connection errors must not crash the server or expose the DB address.
    this.pool?.on('error', () => undefined);
  }

  async query<T extends QueryResultRow = QueryResultRow>(sql: string, values: unknown[] = []): Promise<QueryResult<T>> {
    if (!this.pool) throw this.unavailable();
    try {
      return await this.pool.query<T>(sql, values);
    } catch {
      throw this.unavailable();
    }
  }

  private unavailable(): ServiceUnavailableException {
    return new ServiceUnavailableException({ message: '책장에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.' });
  }

  async onApplicationShutdown(): Promise<void> {
    await this.pool?.end();
  }
}
