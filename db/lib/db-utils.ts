
import { pool } from '../index';
import type { QueryResult } from 'pg';

export const executeWithRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries = 3
): Promise<T> => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error: any) {
      if (i === maxRetries - 1) throw error;
      if (error.code === 'XX000') {
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
        continue;
      }
      throw error;
    }
  }
  throw new Error('Max retries reached');
};

export const queryWithRetry = async <T>(
  queryText: string,
  values?: any[]
): Promise<QueryResult<T>> => {
  return executeWithRetry(() => pool.query(queryText, values));
};
