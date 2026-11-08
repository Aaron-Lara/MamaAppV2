/// <reference types="node" />
// Adaptador mínimo de node:sqlite con la API async de expo-sqlite.
// Solo para pruebas: permite comprobar transacciones y rollback reales
// sin depender del módulo nativo del teléfono.

import { DatabaseSync, type SQLInputValue, type StatementSync } from 'node:sqlite';
import type { SQLiteDatabase } from 'expo-sqlite';

type BindParams = Record<string, unknown> | readonly unknown[] | undefined;

function bind(
  statement: StatementSync,
  method: 'run',
  params: BindParams
): ReturnType<StatementSync['run']>;
function bind(
  statement: StatementSync,
  method: 'get' | 'all',
  params: BindParams
): Record<string, unknown> | undefined | Record<string, unknown>[];
function bind(
  statement: StatementSync,
  method: 'run' | 'get' | 'all',
  params: BindParams
): unknown {
  if (params === undefined) {
    return statement[method]();
  }
  if (Array.isArray(params)) {
    return (statement[method] as (...args: SQLInputValue[]) => unknown)(
      ...(params as SQLInputValue[])
    );
  }
  return (statement[method] as (named: Record<string, SQLInputValue>) => unknown)(
    params as Record<string, SQLInputValue>
  );
}

/** Base SQLite en memoria que imita lo que usan las funciones de src/db. */
export class MemorySQLiteDatabase {
  private readonly database = new DatabaseSync(':memory:');

  async execAsync(sql: string): Promise<void> {
    this.database.exec(sql);
  }

  async getFirstAsync<T>(sql: string, params?: BindParams): Promise<T | null> {
    const row = bind(this.database.prepare(sql), 'get', params);
    return (row as T | undefined) ?? null;
  }

  async getAllAsync<T>(sql: string, params?: BindParams): Promise<T[]> {
    return bind(this.database.prepare(sql), 'all', params) as T[];
  }

  async runAsync(
    sql: string,
    params?: BindParams
  ): Promise<{ lastInsertRowId: number; changes: number }> {
    const result = bind(this.database.prepare(sql), 'run', params);
    return {
      lastInsertRowId: Number(result.lastInsertRowid),
      changes: Number(result.changes),
    };
  }

  async prepareAsync(sql: string) {
    const statement = this.database.prepare(sql);
    return {
      executeAsync: async (params?: BindParams) => bind(statement, 'run', params),
      finalizeAsync: async () => undefined,
    };
  }

  /** Transacción exclusiva real: COMMIT si todo va bien, ROLLBACK si falla. */
  async withExclusiveTransactionAsync(
    task: (txn: SQLiteDatabase) => Promise<void>
  ): Promise<void> {
    this.database.exec('BEGIN EXCLUSIVE');
    try {
      await task(this as unknown as SQLiteDatabase);
      this.database.exec('COMMIT');
    } catch (error) {
      try {
        this.database.exec('ROLLBACK');
      } catch {
        // SQLite pudo haber revertido ya; conservamos el error original.
      }
      throw error;
    }
  }

  close(): void {
    this.database.close();
  }
}
