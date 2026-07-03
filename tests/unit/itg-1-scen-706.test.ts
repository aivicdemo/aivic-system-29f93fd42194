import { validateSalesData } from '../../src/logic/it-1781935279444-2-1-1';

describe('営業データ入力時の品質検証ルール定義・実行機能', () => {
  // SCEN-706: [error] 営業データ自動検証ルール実行機能 - 矛盾する日付・金額・ステータス組み合わせで複数の不整合が同時に検出される
  test('should detect multiple validation errors simultaneously when date, amount, and status are contradictory', () => {
    const salesRecord = {
      contractDate: new Date('2024-01-01T00:00:00Z'),
      revenueRecognitionDate: new Date('2023-12-01T00:00:00Z'),
      orderAmount: 1000000,
      billingAmount: 1500000,
      status: '完了',
      actualRevenue: 0,
    };

    const validationResult = validateSalesData(salesRecord);

    // 3つの不整合が同時に検出されることを検証
    expect(validationResult.hasErrors).toBe(true);
    expect(validationResult.errors).toHaveLength(3);

    // エラー1: 日付矛盾
    expect(validationResult.errors).toContainEqual(
      expect.objectContaining({
        errorCode: 'DATE_CONTRADICTION',
        message: expect.stringContaining('売上計上日が契約日より前'),
        severity: 'error',
        affectedField: 'revenueRecognitionDate',
      })
    );

    // エラー2: 金額矛盾
    expect(validationResult.errors).toContainEqual(
      expect.objectContaining({
        errorCode: 'AMOUNT_MISMATCH',
        message: expect.stringContaining('受注金額と請求金額が一致していない'),
        severity: 'error',
        affectedField: 'billingAmount',
      })
    );

    // エラー3: ステータス矛盾
    expect(validationResult.errors).toContainEqual(
      expect.objectContaining({
        errorCode: 'STATUS_CONTRADICTION',
        message: expect.stringContaining('ステータスが「完了」であるが実績売上が0円'),
        severity: 'error',
        affectedField: 'actualRevenue',
      })
    );

    // 各エラーに詳細説明と影響範囲が含まれることを検証
    validationResult.errors.forEach((error) => {
      expect(error).toHaveProperty('detail');
      expect(error).toHaveProperty('impactScope');
      expect(error.detail).toBeTruthy();
      expect(error.impactScope).toBeTruthy();
    });

    // バリデーション結果全体の構造を検証
    expect(validationResult).toEqual(
      expect.objectContaining({
        hasErrors: true,
        errorCount: 3,
        warningCount: 0,
        timestamp: expect.any(Date),
        recordId: expect.any(String),
      })
    );
  });
});