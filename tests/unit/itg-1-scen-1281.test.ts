import { detectAnomalousExtractedBillingInfo } from '../../src/logic/it-1781935279444-2-2-1';

describe('請求対象項目の抽出・妥当性検証機能', () => {
  // SCEN-1281
  test('抽出された請求情報が過去の請求パターンと矛盾し、異常値として検出される', () => {
    // 過去の正常な請求パターン
    const historicalPatterns = [
      {
        customerId: 'cust_001',
        serviceId: 'svc_A',
        month: '2024-01',
        totalAmount: 100000,
        itemCount: 3,
        items: ['apo_count', 'contract_count', 'service_fee'],
      },
      {
        customerId: 'cust_001',
        serviceId: 'svc_A',
        month: '2024-02',
        totalAmount: 102000,
        itemCount: 3,
        items: ['apo_count', 'contract_count', 'service_fee'],
      },
      {
        customerId: 'cust_001',
        serviceId: 'svc_A',
        month: '2024-03',
        totalAmount: 101500,
        itemCount: 3,
        items: ['apo_count', 'contract_count', 'service_fee'],
      },
    ];

    // 現在の請求サイクルで抽出された請求情報（異常値を含む）
    const currentExtractedBillingInfo = {
      customerId: 'cust_001',
      serviceId: 'svc_A',
      month: '2024-04',
      totalAmount: 520000, // 通常の5倍以上 → 異常値
      itemCount: 4, // 通常は3項目だが4項目 → 異常
      items: ['apo_count', 'contract_count', 'service_fee', 'unexpected_item'],
    };

    // 異常値検出を実行
    const result = detectAnomalousExtractedBillingInfo(
      currentExtractedBillingInfo,
      historicalPatterns,
    );

    // 異常値が検出されることを確認
    expect(result.hasAnomaly).toBe(true);

    // エラーフラグが設定されることを確認
    expect(result.isAnomalous).toBe(true);

    // 異常値の詳細情報がエラーログに記録されていることを確認
    expect(result.errorLog).toBeDefined();
    expect(result.errorLog.length).toBeGreaterThan(0);

    // エラーログの詳細内容を検証
    const amountAnomalyLog = result.errorLog.find(
      (log) => log.itemName === 'totalAmount',
    );
    expect(amountAnomalyLog).toBeDefined();
    expect(amountAnomalyLog?.itemName).toBe('totalAmount');
    expect(amountAnomalyLog?.expectedRangeMin).toBe(95000); // 通常範囲下限
    expect(amountAnomalyLog?.expectedRangeMax).toBe(107000); // 通常範囲上限
    expect(amountAnomalyLog?.actualValue).toBe(520000);
    expect(amountAnomalyLog?.anomalyType).toBe('AMOUNT_EXCEEDS_THRESHOLD');
    expect(amountAnomalyLog?.deviationPercentage).toBe(414.67); // (520000-101500)/101500 * 100

    // アイテムカウント異常もエラーログに記録されることを確認
    const itemCountAnomalyLog = result.errorLog.find(
      (log) => log.itemName === 'itemCount',
    );
    expect(itemCountAnomalyLog).toBeDefined();
    expect(itemCountAnomalyLog?.itemName).toBe('itemCount');
    expect(itemCountAnomalyLog?.expectedRangeMin).toBe(3);
    expect(itemCountAnomalyLog?.expectedRangeMax).toBe(3);
    expect(itemCountAnomalyLog?.actualValue).toBe(4);
    expect(itemCountAnomalyLog?.anomalyType).toBe('ITEM_COUNT_MISMATCH');

    // 予期しない項目の異常もエラーログに記録されることを確認
    const unexpectedItemLog = result.errorLog.find(
      (log) => log.itemName === 'unexpected_item',
    );
    expect(unexpectedItemLog).toBeDefined();
    expect(unexpectedItemLog?.itemName).toBe('unexpected_item');
    expect(unexpectedItemLog?.anomalyType).toBe('UNEXPECTED_ITEM');

    // 自動承認がスキップされることを確認
    expect(result.autoApprovalSkipped).toBe(true);

    // 手動レビュー対象として設定されることを確認
    expect(result.requiresManualReview).toBe(true);

    // ステータスが「要確認」に設定されることを確認
    expect(result.status).toBe('REVIEW_REQUIRED');
  });
});