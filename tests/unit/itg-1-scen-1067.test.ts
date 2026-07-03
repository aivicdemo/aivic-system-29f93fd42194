import { describe, test, expect, beforeEach } from '@jest/globals';
import { prioritizeExceptionCasesAndSchedule } from '../../src/logic/it-1-br-1781935279444-1-2-1';

describe('月次サマリーテンプレート定義・管理 - ドキュメント利用・改善サイクル', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1067: [edge] 大量例外ケース時の優先順位付けと反映スケジュール自動調整
  test('should automatically prioritize and schedule 1000+ exception cases by frequency and impact', () => {
    // テストデータ準備：優先順位付けルールの定義
    const prioritizationRules = {
      frequencyWeight: 0.6,
      impactWeight: 0.4,
      minFrequencyThreshold: 5,
      impactLevels: ['critical', 'high', 'medium', 'low']
    };

    // テストデータ準備：反映スケジュール基本設定
    const scheduleConfig = {
      baseIntervalDays: 7,
      criticalCaseDays: 3,
      highCaseDays: 7,
      mediumCaseDays: 14,
      lowCaseDays: 30,
      maxCasesPerSchedule: 50
    };

    // テストデータ準備：大量の例外ケース（1200件）を生成
    const exceptionCases = Array.from({ length: 1200 }, (_, index) => ({
      id: `exception_${index + 1}`,
      caseType: ['dataEntry', 'calculation', 'validation', 'mapping'][index % 4],
      frequency: Math.floor(Math.random() * 150) + 1,
      impactLevel: ['critical', 'high', 'medium', 'low'][Math.floor(index / 300)],
      occurrenceCount: Math.floor(Math.random() * 100) + 1,
      createdAt: new Date('2024-01-01T00:00:00Z').toISOString(),
      lastOccurredAt: new Date('2024-01-15T00:00:00Z').toISOString()
    }));

    // 改善提案プロセスの実行トリガーを起動
    const result = prioritizeExceptionCasesAndSchedule(
      exceptionCases,
      prioritizationRules,
      scheduleConfig
    );

    // 優先順位付けアルゴリズムが自動的に発動することを確認
    expect(result).toBeDefined();
    expect(result.prioritizedCases).toBeDefined();
    expect(result.adjustedSchedule).toBeDefined();
    expect(result.executionTimestamp).toBeDefined();

    // 発生頻度が高い例外ケースから順に優先順位が付与されることを検証
    expect(result.prioritizedCases.length).toBe(1200);
    for (let i = 0; i < result.prioritizedCases.length - 1; i++) {
      const current = result.prioritizedCases[i];
      const next = result.prioritizedCases[i + 1];
      const currentScore =
        current.frequency * prioritizationRules.frequencyWeight +
        (prioritizationRules.impactLevels.indexOf(current.impactLevel) + 1) *
          prioritizationRules.impactWeight;
      const nextScore =
        next.frequency * prioritizationRules.frequencyWeight +
        (prioritizationRules.impactLevels.indexOf(next.impactLevel) + 1) *
          prioritizationRules.impactWeight;
      expect(currentScore).toBeGreaterThanOrEqual(nextScore);
    }

    // 優先度に基づいて反映スケジュールが自動調整されることを確認
    expect(result.adjustedSchedule.totalSchedules).toBeGreaterThan(0);
    expect(result.adjustedSchedule.scheduleBatches).toBeDefined();
    expect(Array.isArray(result.adjustedSchedule.scheduleBatches)).toBe(true);

    // 調整されたスケジュールが合理的な時間間隔で配分されていることを検証
    const batches = result.adjustedSchedule.scheduleBatches;
    expect(batches.length).toBeGreaterThanOrEqual(
      Math.ceil(1200 / scheduleConfig.maxCasesPerSchedule)
    );

    const criticalBatches = batches.filter((b) => b.priority === 'critical');
    const highBatches = batches.filter((b) => b.priority === 'high');
    const mediumBatches = batches.filter((b) => b.priority === 'medium');
    const lowBatches = batches.filter((b) => b.priority === 'low');

    // クリティカル優先度のスケジュール間隔を検証（3日間隔）
    if (criticalBatches.length > 1) {
      for (let i = 0; i < criticalBatches.length - 1; i++) {
        const currentDate = new Date(criticalBatches[i].scheduledDate);
        const nextDate = new Date(criticalBatches[i + 1].scheduledDate);
        const daysDiff = Math.round(
          (nextDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        expect(daysDiff).toBeLessThanOrEqual(scheduleConfig.criticalCaseDays + 1);
        expect(daysDiff).toBeGreaterThanOrEqual(scheduleConfig.criticalCaseDays - 1);
      }
    }

    // 複数の優先度レベルが正しく段階分けされていることを確認
    expect(criticalBatches.length).toBeGreaterThan(0);
    expect(highBatches.length).toBeGreaterThan(0);
    expect(mediumBatches.length).toBeGreaterThan(0);
    expect(lowBatches.length).toBeGreaterThan(0);

    const totalCasesInSchedule = batches.reduce(
      (sum, batch) => sum + batch.caseCount,
      0
    );
    expect(totalCasesInSchedule).toBe(1200);

    // システムのパフォーマンス（応答時間）が許容範囲内であることを検証
    const executionTime = result.executionMetrics.processingTimeMs;
    expect(executionTime).toBeLessThanOrEqual(5000);
    expect(executionTime).toBeGreaterThan(0);

    // メモリ効率を検証
    expect(result.executionMetrics.peakMemoryMb).toBeLessThanOrEqual(256);

    // 調整結果がシステムに正常に反映されていることを確認
    expect(result.status).toBe('success');
    expect(result.message).toMatch(/優先順位付け|スケジュール|調整/);

    // 各バッチのケース数がmax設定を超えないことを確認
    batches.forEach((batch) => {
      expect(batch.caseCount).toBeLessThanOrEqual(scheduleConfig.maxCasesPerSchedule);
      expect(batch.caseCount).toBeGreaterThan(0);
    });

    // 優先度ごとの総ケース数を検証
    const criticalCases = result.prioritizedCases.filter(
      (c) => c.impactLevel === 'critical'
    );
    const criticalCasesInSchedule = criticalBatches.reduce(
      (sum, batch) => sum + batch.caseCount,
      0
    );
    expect(criticalCasesInSchedule).toBeGreaterThanOrEqual(criticalCases.length);

    // スケジュール開始日が合理的な日時であることを確認
    const startDate = new Date(batches[0].scheduledDate);
    const now = new Date('2024-01-15T00:00:00Z');
    expect(startDate.getTime()).toBeGreaterThanOrEqual(now.getTime());
    expect(startDate.getTime()).toBeLessThanOrEqual(
      now.getTime() + 30 * 24 * 60 * 60 * 1000
    );

    // 優先度スコアが降順であることを確認
    batches.forEach((batch) => {
      if (batch.priority === 'critical') {
        expect(batch.averagePriorityScore).toBeGreaterThanOrEqual(70);
      } else if (batch.priority === 'high') {
        expect(batch.averagePriorityScore).toBeGreaterThanOrEqual(50);
        expect(batch.averagePriorityScore).toBeLessThan(70);
      } else if (batch.priority === 'medium') {
        expect(batch.averagePriorityScore).toBeGreaterThanOrEqual(30);
        expect(batch.averagePriorityScore).toBeLessThan(50);
      } else if (batch.priority === 'low') {
        expect(batch.averagePriorityScore).toBeLessThan(30);
      }
    });

    // 調整されたスケジュールの完全性を検証
    expect(result.adjustedSchedule.totalSchedules).toBe(batches.length);
    expect(result.adjustedSchedule.completionTargetDate).toBeDefined();
    const completionDate = new Date(result.adjustedSchedule.completionTargetDate);
    expect(completionDate.getTime()).toBeGreaterThan(startDate.getTime());
  });
});