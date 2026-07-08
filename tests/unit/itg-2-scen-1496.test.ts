import { checkModelRetrainingOverwrite } from '../../src/logic/it-6-2-2-2';

describe('AI判定モデル再学習実行機能 - 上書き確認ダイアログ表示', () => {
  // SCEN-1496
  test('前回の再学習実行から24時間以内に新規実行指示が出された場合、上書き確認ダイアログが表示される', () => {
    const now = new Date('2024-01-15T15:30:00Z');
    const lastRetrainingTime = new Date('2024-01-14T14:30:00Z');
    const timeDiffMs = now.getTime() - lastRetrainingTime.getTime();
    const timeDiffHours = timeDiffMs / (1000 * 60 * 60);

    expect(timeDiffHours).toBeLessThan(24);

    const result = checkModelRetrainingOverwrite({
      lastRetrainingExecutedAt: lastRetrainingTime,
      currentRequestTime: now,
      modelVersion: '3.2.1',
      datasetSize: 2850,
    });

    expect(result.showOverwriteDialog).toBe(true);
    expect(result.dialogTitle).toBe('再学習の上書き確認');
    expect(result.dialogMessage).toContain('前回の再学習実行時刻');
    expect(result.dialogMessage).toContain('2024-01-14T14:30:00Z');
    expect(result.timeSinceLastRetrainingHours).toBe(23);
    expect(result.confirmButtonLabel).toBe('確認');
    expect(result.cancelButtonLabel).toBe('キャンセル');
  });

  test('前回の再学習実行から24時間以上経過した場合、上書き確認ダイアログが表示されない', () => {
    const now = new Date('2024-01-15T14:30:01Z');
    const lastRetrainingTime = new Date('2024-01-14T14:30:00Z');
    const timeDiffMs = now.getTime() - lastRetrainingTime.getTime();
    const timeDiffHours = timeDiffMs / (1000 * 60 * 60);

    expect(timeDiffHours).toBeGreaterThanOrEqual(24);

    const result = checkModelRetrainingOverwrite({
      lastRetrainingExecutedAt: lastRetrainingTime,
      currentRequestTime: now,
      modelVersion: '3.2.1',
      datasetSize: 2850,
    });

    expect(result.showOverwriteDialog).toBe(false);
    expect(result.proceedWithRetraining).toBe(true);
  });

  test('前回の再学習実行時刻がnullの場合（初回実行）、上書き確認ダイアログが表示されない', () => {
    const now = new Date('2024-01-15T15:30:00Z');

    const result = checkModelRetrainingOverwrite({
      lastRetrainingExecutedAt: null,
      currentRequestTime: now,
      modelVersion: '3.2.1',
      datasetSize: 2850,
    });

    expect(result.showOverwriteDialog).toBe(false);
    expect(result.proceedWithRetraining).toBe(true);
  });

  test('24時間以内の再学習上書き指示で、ダイアログメッセージに正確な時間差が含まれる', () => {
    const now = new Date('2024-01-15T10:15:30Z');
    const lastRetrainingTime = new Date('2024-01-14T11:00:00Z');
    const timeDiffMs = now.getTime() - lastRetrainingTime.getTime();
    const timeDiffHours = Math.floor(timeDiffMs / (1000 * 60 * 60));

    const result = checkModelRetrainingOverwrite({
      lastRetrainingExecutedAt: lastRetrainingTime,
      currentRequestTime: now,
      modelVersion: '3.2.1',
      datasetSize: 2850,
    });

    expect(result.showOverwriteDialog).toBe(true);
    expect(result.timeSinceLastRetrainingHours).toBe(22);
    expect(result.dialogMessage).toContain('22時間');
    expect(result.dialogMessage).toContain('前回実行時刻: 2024-01-14T11:00:00Z');
  });

  test('再学習上書き指示時、新規データセットサイズがダイアログメッセージに含まれる', () => {
    const now = new Date('2024-01-15T15:30:00Z');
    const lastRetrainingTime = new Date('2024-01-14T14:30:00Z');

    const result = checkModelRetrainingOverwrite({
      lastRetrainingExecutedAt: lastRetrainingTime,
      currentRequestTime: now,
      modelVersion: '3.2.1',
      datasetSize: 3150,
    });

    expect(result.showOverwriteDialog).toBe(true);
    expect(result.dialogMessage).toContain('3150件');
  });

  test('前回実行時刻が無効な場合、エラーが発生する', () => {
    const now = new Date('2024-01-15T15:30:00Z');
    const invalidTime = new Date('invalid');

    expect(() => {
      checkModelRetrainingOverwrite({
        lastRetrainingExecutedAt: invalidTime,
        currentRequestTime: now,
        modelVersion: '3.2.1',
        datasetSize: 2850,
      });
    }).toThrow(/時刻/);
  });

  test('現在時刻が前回実行時刻より古い場合、エラーが発生する', () => {
    const now = new Date('2024-01-14T10:00:00Z');
    const lastRetrainingTime = new Date('2024-01-15T15:30:00Z');

    expect(() => {
      checkModelRetrainingOverwrite({
        lastRetrainingExecutedAt: lastRetrainingTime,
        currentRequestTime: now,
        modelVersion: '3.2.1',
        datasetSize: 2850,
      });
    }).toThrow(/時系列/);
  });
});