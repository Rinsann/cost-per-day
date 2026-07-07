import {
  cacheDirectory,
  documentDirectory,
  getInfoAsync,
  writeAsStringAsync
} from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

type PerfLogType = 'mark' | 'measure';

export type PerfLog = {
  id: string;
  label: string;
  durationMs?: number;
  timestamp: string;
  type: PerfLogType;
  meta?: Record<string, unknown>;
};

export type PerfLogExportResult =
  | {
      count: number;
      fileUri: string;
      ok: true;
    }
  | {
      message: string;
      ok: false;
      reason: 'no-directory' | 'no-logs' | 'no-sharing' | 'share-failed' | 'write-failed';
    };

const MAX_PERF_LOGS = 500;
const fileEncoding = 'utf8' as const;
const logs: PerfLog[] = [];
let logId = 0;

function isPerfEnabled() {
  return __DEV__;
}

function getNowMs() {
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    return performance.now();
  }

  return Date.now();
}

function roundDuration(durationMs: number) {
  return Math.round(durationMs * 100) / 100;
}

function createPerfLog({
  durationMs,
  label,
  meta,
  type
}: {
  durationMs?: number;
  label: string;
  meta?: Record<string, unknown>;
  type: PerfLogType;
}): PerfLog {
  logId += 1;

  return {
    id: `perf-${Date.now()}-${logId}`,
    label,
    durationMs,
    timestamp: new Date().toISOString(),
    type,
    ...(meta ? { meta } : {})
  };
}

function pushPerfLog(log: PerfLog) {
  if (!isPerfEnabled()) {
    return;
  }

  logs.push(log);

  if (logs.length > MAX_PERF_LOGS) {
    logs.splice(0, logs.length - MAX_PERF_LOGS);
  }
}

function getPerfLogFileName(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  const second = String(date.getSeconds()).padStart(2, '0');

  return `suandezhi-perf-log-${year}${month}${day}-${hour}${minute}${second}.json`;
}

export function addPerfMark(label: string, meta?: Record<string, unknown>) {
  if (!isPerfEnabled()) {
    return;
  }

  pushPerfLog(createPerfLog({ label, meta, type: 'mark' }));
}

export function measureTime<T>(label: string, fn: () => T, meta?: Record<string, unknown>) {
  if (!isPerfEnabled()) {
    return fn();
  }

  const start = getNowMs();

  try {
    return fn();
  } finally {
    pushPerfLog(
      createPerfLog({
        durationMs: roundDuration(getNowMs() - start),
        label,
        meta,
        type: 'measure'
      })
    );
  }
}

export async function measureAsyncTime<T>(
  label: string,
  asyncFn: () => Promise<T>,
  meta?: Record<string, unknown>
) {
  if (!isPerfEnabled()) {
    return await asyncFn();
  }

  const start = getNowMs();

  try {
    return await asyncFn();
  } finally {
    pushPerfLog(
      createPerfLog({
        durationMs: roundDuration(getNowMs() - start),
        label,
        meta,
        type: 'measure'
      })
    );
  }
}

export function getPerfLogs() {
  if (!isPerfEnabled()) {
    return [];
  }

  return [...logs];
}

export function clearPerfLogs() {
  if (!isPerfEnabled()) {
    return;
  }

  logs.splice(0, logs.length);
}

export async function exportPerfLogs(): Promise<PerfLogExportResult> {
  if (!isPerfEnabled()) {
    return {
      message: 'Performance logs are only available in development.',
      ok: false,
      reason: 'no-logs'
    };
  }

  const currentLogs = getPerfLogs();

  if (currentLogs.length === 0) {
    return {
      message: '暂无性能日志',
      ok: false,
      reason: 'no-logs'
    };
  }

  const sharingAvailable = await Sharing.isAvailableAsync();

  if (!sharingAvailable) {
    return {
      message: '当前设备不支持分享文件。',
      ok: false,
      reason: 'no-sharing'
    };
  }

  const exportDirectory = cacheDirectory ?? documentDirectory;

  if (!exportDirectory) {
    return {
      message: '无法创建性能日志文件。',
      ok: false,
      reason: 'no-directory'
    };
  }

  const fileUri = `${exportDirectory}${getPerfLogFileName()}`;
  const payload = {
    appName: '算得值',
    exportedAt: new Date().toISOString(),
    total: currentLogs.length,
    logs: currentLogs
  };

  try {
    await writeAsStringAsync(fileUri, JSON.stringify(payload, null, 2), {
      encoding: fileEncoding
    });

    const fileInfo = await getInfoAsync(fileUri);

    if (!fileInfo.exists) {
      return {
        message: '性能日志文件创建失败。',
        ok: false,
        reason: 'write-failed'
      };
    }
  } catch {
    return {
      message: '性能日志文件写入失败。',
      ok: false,
      reason: 'write-failed'
    };
  }

  try {
    await Sharing.shareAsync(fileUri, {
      dialogTitle: '算得值 性能日志',
      mimeType: 'application/json'
    });

    return {
      count: currentLogs.length,
      fileUri,
      ok: true
    };
  } catch {
    return {
      message: '性能日志分享失败。',
      ok: false,
      reason: 'share-failed'
    };
  }
}

