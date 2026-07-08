import { updateImprovementMeasureAndReflectToDashboard } from '../../src/logic/it-1-br-2-2-2-1';

describe('改善対策実行状況と効果測定データの経営ダッシュボード反映機能', () => {
  // SCEN-1253
  test('改善対策が完了に更新された後、経営ダッシュボードが500ms以内に反映される', async () => {
    const improvementMeasures = [
      {
        id: 'IM001',
        status: '未実行',
        description: 'OCR精度向上対策',
        executionDate: null,
        completionDate: null,
      },
      {
        id: 'IM002',
        status: '実行中',
        description: '学習データ追加',
        executionDate: new Date('2024-06-01T09:00:00Z'),
        completionDate: null,
      },
      {
        id: 'IM003',
        status: '完了',
        description: 'モデル再学習',
        executionDate: new Date('2024-06-05T10:00:00Z'),
        completionDate: new Date('2024-06-10T15:30:00Z'),
      },
    ];

    const targetMeasureId = 'IM002';
    const updateTime = new Date('2024-06-15T14:25:00Z');

    const result = await updateImprovementMeasureAndReflectToDashboard({
      measureId: targetMeasureId,
      newStatus: '完了',
      completionDate: updateTime,
      ocrPrecisionBefore: 78.5,
      ocrPrecisionAfter: 85.3,
      judgmentPrecisionBefore: 82.1,
      judgmentPrecisionAfter: 88.6,
      processingTimeReductionRate: 12.5,
      qualityUniformityIndex: 91.2,
      measures: improvementMeasures,
    });

    expect(result).toEqual({
      measureId: 'IM002',
      status: '完了',
      completionDate: new Date('2024-06-15T14:25:00Z'),
      dashboardReflectionTime: expect.any(Number),
      ocrPrecisionImprovement: 6.8,
      judgmentPrecisionImprovement: 6.5,
      processingTimeReductionRate: 12.5,
      qualityUniformityIndex: 91.2,
      isReflected: true,
      reflectionConsistency: true,
    });

    expect(result.dashboardReflectionTime).toBeLessThanOrEqual(500);
    expect(result.ocrPrecisionImprovement).toBe(6.8);
    expect(result.judgmentPrecisionImprovement).toBe(6.5);
    expect(result.isReflected).toBe(true);
    expect(result.reflectionConsistency).toBe(true);
  });

  test('複数回の改善対策更新において一貫性が保証される', async () => {
    const baseTime = new Date('2024-06-15T14:00:00Z');
    const updates = [
      {
        measureId: 'IM004',
        completionDate: new Date('2024-06-15T14:05:00Z'),
        ocrBefore: 76.0,
        ocrAfter: 83.5,
        judgmentBefore: 81.0,
        judgmentAfter: 87.2,
      },
      {
        measureId: 'IM005',
        completionDate: new Date('2024-06-15T14:10:00Z'),
        ocrBefore: 77.2,
        ocrAfter: 84.8,
        judgmentBefore: 82.5,
        judgmentAfter: 89.1,
      },
      {
        measureId: 'IM006',
        completionDate: new Date('2024-06-15T14:15:00Z'),
        ocrBefore: 75.8,
        ocrAfter: 82.9,
        judgmentBefore: 80.5,
        judgmentAfter: 88.3,
      },
      {
        measureId: 'IM007',
        completionDate: new Date('2024-06-15T14:20:00Z'),
        ocrBefore: 78.1,
        ocrAfter: 85.6,
        judgmentBefore: 83.0,
        judgmentAfter: 89.8,
      },
      {
        measureId: 'IM008',
        completionDate: new Date('2024-06-15T14:25:00Z'),
        ocrBefore: 77.5,
        ocrAfter: 84.2,
        judgmentBefore: 82.3,
        judgmentAfter: 88.9,
      },
    ];

    const results = [];
    for (const update of updates) {
      const result = await updateImprovementMeasureAndReflectToDashboard({
        measureId: update.measureId,
        newStatus: '完了',
        completionDate: update.completionDate,
        ocrPrecisionBefore: update.ocrBefore,
        ocrPrecisionAfter: update.ocrAfter,
        judgmentPrecisionBefore: update.judgmentBefore,
        judgmentPrecisionAfter: update.judgmentAfter,
        processingTimeReductionRate: 11.0,
        qualityUniformityIndex: 90.5,
        measures: [],
      });
      results.push(result);
    }

    expect(results).toHaveLength(5);
    results.forEach((result, index) => {
      expect(result.isReflected).toBe(true);
      expect(result.reflectionConsistency).toBe(true);
      expect(result.dashboardReflectionTime).toBeLessThanOrEqual(500);
      expect(result.measureId).toBe(updates[index].measureId);
      expect(result.ocrPrecisionImprovement).toBeGreaterThan(6.0);
      expect(result.judgmentPrecisionImprovement).toBeGreaterThan(6.0);
    });

    const allReflected = results.every((r) => r.isReflected === true);
    expect(allReflected).toBe(true);
  });

  test('ネットワーク遅延環境下でも最大2秒以内に更新が完了する', async () => {
    const networkLatencies = [100, 500, 1200, 1800];

    for (const latency of networkLatencies) {
      const result = await updateImprovementMeasureAndReflectToDashboard({
        measureId: 'IM009',
        newStatus: '完了',
        completionDate: new Date('2024-06-15T15:00:00Z'),
        ocrPrecisionBefore: 79.0,
        ocrPrecisionAfter: 86.2,
        judgmentPrecisionBefore: 83.5,
        judgmentPrecisionAfter: 90.1,
        processingTimeReductionRate: 13.2,
        qualityUniformityIndex: 92.1,
        networkLatency: latency,
        measures: [],
      });

      expect(result.dashboardReflectionTime).toBeLessThanOrEqual(2000);
      expect(result.isReflected).toBe(true);
    }
  });

  test('ダッシュボード表示データとシステムの実際の改善対策データに不整合がない', async () => {
    const measureData = {
      id: 'IM010',
      status: '完了',
      completionDate: new Date('2024-06-15T15:30:00Z'),
      ocrPrecisionBefore: 76.5,
      ocrPrecisionAfter: 84.0,
      judgmentPrecisionBefore: 81.2,
      judgmentPrecisionAfter: 88.7,
      processingTimeReductionRate: 14.1,
      qualityUniformityIndex: 93.0,
    };

    const result = await updateImprovementMeasureAndReflectToDashboard({
      measureId: measureData.id,
      newStatus: measureData.status,
      completionDate: measureData.completionDate,
      ocrPrecisionBefore: measureData.ocrPrecisionBefore,
      ocrPrecisionAfter: measureData.ocrPrecisionAfter,
      judgmentPrecisionBefore: measureData.judgmentPrecisionBefore,
      judgmentPrecisionAfter: measureData.judgmentPrecisionAfter,
      processingTimeReductionRate: measureData.processingTimeReductionRate,
      qualityUniformityIndex: measureData.qualityUniformityIndex,
      measures: [],
    });

    expect(result.measureId).toBe(measureData.id);
    expect(result.status).toBe(measureData.status);
    expect(result.completionDate).toEqual(measureData.completionDate);
    expect(result.ocrPrecisionImprovement).toBe(7.5);
    expect(result.judgmentPrecisionImprovement).toBe(7.5);
    expect(result.processingTimeReductionRate).toBe(14.1);
    expect(result.qualityUniformityIndex).toBe(93.0);

    expect(result.isReflected).toBe(true);
    expect(result.reflectionConsistency).toBe(true);
    expect(result.dashboardReflectionTime).toBeLessThanOrEqual(500);
  });

  test('改善対策ステータスが未実行の場合、ダッシュボード反映エラーが発生', async () => {
    expect(() =>
      updateImprovementMeasureAndReflectToDashboard({
        measureId: 'IM011',
        newStatus: '未実行',
        completionDate: null,
        ocrPrecisionBefore: 75.0,
        ocrPrecisionAfter: 75.0,
        judgmentPrecisionBefore: 80.0,
        judgmentPrecisionAfter: 80.0,
        processingTimeReductionRate: 0,
        qualityUniformityIndex: 0,
        measures: [],
      }),
    ).toThrow(/ステータス/);
  });

  test('改善効果の数値が不正な場合、エラーが発生', async () => {
    expect(() =>
      updateImprovementMeasureAndReflectToDashboard({
        measureId: 'IM012',
        newStatus: '完了',
        completionDate: new Date('2024-06-15T16:00:00Z'),
        ocrPrecisionBefore: 80.0,
        ocrPrecisionAfter: 75.0,
        judgmentPrecisionBefore: 85.0,
        judgmentPrecisionAfter: 85.0,
        processingTimeReductionRate: -5.0,
        qualityUniformityIndex: 95.0,
        measures: [],
      }),
    ).toThrow(/精度/);
  });

  test('ダッシュボード統計グラフが正確に反映される', async () => {
    const result = await updateImprovementMeasureAndReflectToDashboard({
      measureId: 'IM013',
      newStatus: '完了',
      completionDate: new Date('2024-06-15T16:30:00Z'),
      ocrPrecisionBefore: 77.3,
      ocrPrecisionAfter: 85.1,
      judgmentPrecisionBefore: 82.8,
      judgmentPrecisionAfter: 89.4,
      processingTimeReductionRate: 15.5,
      qualityUniformityIndex: 94.2,
      measures: [],
    });

    expect(result.ocrPrecisionImprovement).toBe(7.8);
    expect(result.judgmentPrecisionImprovement).toBe(6.6);
    expect(result.processingTimeReductionRate).toBe(15.5);
    expect(result.qualityUniformityIndex).toBe(94.2);
    expect(result.dashboardReflectionTime).toBeLessThanOrEqual(500);
    expect(result.isReflected).toBe(true);
  });
});