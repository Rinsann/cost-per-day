import { describe, expect, it, beforeEach } from '@jest/globals';

import {
  addPerfMark,
  clearPerfLogs,
  getPerfLogs,
  measureAsyncTime,
  measureTime
} from '@/utils/perf';

describe('perf utilities', () => {
  beforeEach(() => {
    clearPerfLogs();
  });

  it('measureTime returns the original function result and records duration', () => {
    const result = measureTime('sync-work', () => 42, { count: 2 });
    const logs = getPerfLogs();

    expect(result).toBe(42);
    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({
      label: 'sync-work',
      meta: { count: 2 },
      type: 'measure'
    });
    expect(typeof logs[0].durationMs).toBe('number');
  });

  it('measureTime does not swallow exceptions', () => {
    expect(() =>
      measureTime('sync-error', () => {
        throw new Error('boom');
      })
    ).toThrow('boom');
    expect(getPerfLogs()).toHaveLength(1);
  });

  it('measureAsyncTime returns the async function result and records duration', async () => {
    const result = await measureAsyncTime('async-work', async () => 'done');
    const logs = getPerfLogs();

    expect(result).toBe('done');
    expect(logs).toHaveLength(1);
    expect(logs[0].label).toBe('async-work');
    expect(logs[0].type).toBe('measure');
  });

  it('measureAsyncTime does not swallow async exceptions', async () => {
    await expect(
      measureAsyncTime('async-error', async () => {
        throw new Error('nope');
      })
    ).rejects.toThrow('nope');
    expect(getPerfLogs()).toHaveLength(1);
  });

  it('addPerfMark records a mark without duration', () => {
    addPerfMark('screen-focus', { screen: 'ledger' });

    expect(getPerfLogs()).toEqual([
      expect.objectContaining({
        durationMs: undefined,
        label: 'screen-focus',
        meta: { screen: 'ledger' },
        type: 'mark'
      })
    ]);
  });

  it('clearPerfLogs clears stored logs', () => {
    addPerfMark('before-clear');
    clearPerfLogs();

    expect(getPerfLogs()).toEqual([]);
  });

  it('keeps only the most recent 500 logs', () => {
    Array.from({ length: 505 }, (_, index) => {
      addPerfMark(`mark-${index}`);
    });

    const logs = getPerfLogs();

    expect(logs).toHaveLength(500);
    expect(logs[0].label).toBe('mark-5');
    expect(logs[499].label).toBe('mark-504');
  });
});

