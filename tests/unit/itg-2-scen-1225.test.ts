import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { visualizeAccuracyImprovementDegree } from '../../src/logic/it-6-3-1';

describe('精度指標の改善度可視化機能 - 計測対象データ不在時のスキップ処理', () => {
  let logSpy: jest.SpyInstance;
  const originalLog = console.log;

  beforeEach(() => {
    logSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    logSpy.mockRestore();
    console.log = originalLog;
  });

  // SCEN-1225
  test('精度指標が存在しない場合、スキップされログに理由が記録される', () => {
    const measurementTargetId = 'target_nonexistent_001';
    const beforeAccuracyRecord = undefined;
    const afterAccuracyRecord = undefined;

    const result = visualizeAccuracyImprovementDegree({
      measurementTargetId,
      beforeOcrAccuracy: beforeAccuracyRecord,
      afterOcrAccuracy: afterAccuracyRecord,
      beforeAiJudgmentAccuracy: beforeAccuracyRecord,
      afterAiJudgmentAccuracy: afterAccuracyRecord,
      measurementStartDate: '2024-01-15',
      measurementEndDate: '2024-01-31'
    });

    expect(result.status).toBe('skipped');
    expect(result.skipReason).toBe('精度指標が存在しません');
    expect(result.improvementDegree).toBeNull();
    expect(result.improvementRate).toBeNull();

    expect(logSpy).toHaveBeenCalled();
    const logCalls = logSpy.mock.calls.map(call => call[0] as string);
    const skipLogFound = logCalls.some(log =>
      log.includes('精度指標が存在しません') || log.includes('対象データなし')
    );
    expect(skipLogFound).toBe(true);
  });
});