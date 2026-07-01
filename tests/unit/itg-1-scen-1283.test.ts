import { describe, test, expect } from '@jest/globals';
import { validateBillingExtractionWithAnomalyDetection } from '../../src/logic/it-1781935279444-2-1-1';

describe('営業データ入力時の品質検証ルール定義・実行機能', () => {
  // SCEN-1283: [edge] 請求対象項目の抽出・妥当性検証機能
  // - 請求情報が契約内容と一致するが、過去パターンから極めて稀な金額である場合に検出される
  test('should detect anomalous billing amount as statistical outlier despite contract compliance', () => {
    // テストデータ準備: 契約内容に一致する請求情報
    const contractId = 'CONTRACT-2024-001';
    const customerId = 'CUST-A001';
    const serviceType = 'consulting_monthly';
    const baseFee = 500000;
    const unitPrice = 50000;
    const units = 10;
    const currentBillingAmount = 1000000; // 契約内容に完全に一致

    // 過去12ヶ月の請求履歴データ（毎月ほぼ同額）
    const pastBillingHistory = [
      { month: 1, amount: 502000 },
      { month: 2, amount: 501500 },
      { month: 3, amount: 500800 },
      { month: 4, amount: 499200 },
      { month: 5, amount: 501000 },
      { month: 6, amount: 500500 },
      { month: 7, amount: 502200 },
      { month: 8, amount: 498800 },
      { month: 9, amount: 501300 },
      { month: 10, amount: 500700 },
      { month: 11, amount: 499900 },
      { month: 12, amount: 502100 },
    ];

    // 統計値を手動計算
    const amounts = pastBillingHistory.map((h) => h.amount);
    const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length; // 約 500,950
    const variance =
      amounts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
      amounts.length;
    const stdDev = Math.sqrt(variance); // 約 900～1100 程度

    // 現在の請求額（1,000,000）は過去パターン（平均 500,950 ± 1,100）から見ると
    // 約 (1,000,000 - 500,950) / 1000 ≈ 499σ 離れており、明らかに異常
    const expectedDeviationSigma = (currentBillingAmount - mean) / stdDev;

    // テスト実行: 妥当性検証機能を呼び出し
    const validationResult = validateBillingExtractionWithAnomalyDetection({
      contractId,
      customerId,
      serviceType,
      billingAmount: currentBillingAmount,
      baseFee,
      unitPrice,
      units,
      pastBillingHistory,
      anomalyThresholdSigma: 3,
    });

    // 期待結果: 異常が検出される
    expect(validationResult.isAnomalousOutlier).toBe(true);

    // 異常フラグが記録される
    expect(validationResult.anomalyDetected).toBe(true);

    // 偏差情報が記録される
    expect(validationResult.deviationSigma).toBeGreaterThan(3);
    expect(Math.abs(validationResult.deviationSigma - expectedDeviationSigma)).toBeLessThan(1);

    // 統計情報が記録される
    expect(validationResult.historicalMean).toBe(Math.round(mean));
    expect(validationResult.historicalStdDev).toBeGreaterThan(0);

    // 過去パターンとの比較データが記録される
    expect(validationResult.comparisonData).toEqual({
      currentAmount: currentBillingAmount,
      historicalMean: Math.round(mean),
      deviation: Math.round(currentBillingAmount - mean),
      sigma: validationResult.deviationSigma,
      threshold: 3,
    });

    // 異常警告ログが生成される
    expect(validationResult.warningLog).toBeDefined();
    expect(validationResult.warningLog.severity).toBe('CRITICAL');
    expect(validationResult.warningLog.message).toMatch(/異常検知/);
    expect(validationResult.warningLog.message).toMatch(/外れ値/);

    // 異常警告通知情報が記録される
    expect(validationResult.stakeholderNotifications).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          recipientType: 'representative',
          notificationMethod: 'email',
          priority: 'high',
        }),
        expect.objectContaining({
          recipientType: 'finance_manager',
          notificationMethod: 'system_alert',
          priority: 'high',
        }),
      ])
    );

    // 異常警告は確実に発火される
    expect(validationResult.anomalyAlertTriggered).toBe(true);

    // 契約内容一致フラグは true（契約内容とは一致している）
    expect(validationResult.contractCompliant).toBe(true);

    // ただし全体の検証ステータスは「警告」
    expect(validationResult.validationStatus).toBe('WARNING_ANOMALY_DETECTED');

    // 処理タイムスタンプが記録される
    expect(validationResult.processedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);

    // 詳細な偏差分析が記録される
    expect(validationResult.deviationAnalysis).toEqual(
      expect.objectContaining({
        outlierReason: 'statistical_extreme',
        pastMonthCount: 12,
        avgAmountPastMonths: Math.round(mean),
        stdDevPastMonths: validationResult.historicalStdDev,
        currentDeviationFromMean:
          currentBillingAmount - Math.round(mean),
      })
    );
  });
});