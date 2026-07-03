import { validateSalesDataCompleteness } from '../../src/logic/it-1781935279444-2-2-1';

describe('月次営業データの完全性・正確性検証機能', () => {
  // SCEN-645
  test('許容範囲の最小値・最大値の境界データが正確に判定される', () => {
    // 手順: 許容範囲の最小値0円、最大値10,000,000円の検証ルール
    const minThreshold = 0;
    const maxThreshold = 10000000;

    // 境界値データセット準備
    const boundaryDataset = [
      {
        id: 'record_min_exact',
        salesAmount: 0,
        description: '最小値ちょうど'
      },
      {
        id: 'record_min_below',
        salesAmount: -1,
        description: '最小値より1単位少ない'
      },
      {
        id: 'record_max_exact',
        salesAmount: 10000000,
        description: '最大値ちょうど'
      },
      {
        id: 'record_max_over',
        salesAmount: 10000001,
        description: '最大値より1単位多い'
      }
    ];

    // 完全性・正確性検証機能を実行
    const validationResult = validateSalesDataCompleteness({
      dataRecords: boundaryDataset,
      minThreshold: minThreshold,
      maxThreshold: maxThreshold
    });

    // 期待結果: 各レコードの検証結果ステータスを確認
    expect(validationResult).toHaveProperty('results');
    expect(Array.isArray(validationResult.results)).toBe(true);
    expect(validationResult.results.length).toBe(4);

    // 最小値ちょうど(0円)は『許容範囲内』として正常と判定
    const minExactResult = validationResult.results.find(
      (r: any) => r.id === 'record_min_exact'
    );
    expect(minExactResult).toBeDefined();
    expect(minExactResult.status).toBe('VALID');
    expect(minExactResult.isWithinRange).toBe(true);

    // 最小値より1単位少ない(-1円)は『許容範囲外』として異常と判定
    const minBelowResult = validationResult.results.find(
      (r: any) => r.id === 'record_min_below'
    );
    expect(minBelowResult).toBeDefined();
    expect(minBelowResult.status).toBe('INVALID');
    expect(minBelowResult.isWithinRange).toBe(false);
    expect(minBelowResult.reason).toMatch(/最小値/);

    // 最大値ちょうど(10,000,000円)は『許容範囲内』として正常と判定
    const maxExactResult = validationResult.results.find(
      (r: any) => r.id === 'record_max_exact'
    );
    expect(maxExactResult).toBeDefined();
    expect(maxExactResult.status).toBe('VALID');
    expect(maxExactResult.isWithinRange).toBe(true);

    // 最大値より1単位多い(10,000,001円)は『許容範囲外』として異常と判定
    const maxOverResult = validationResult.results.find(
      (r: any) => r.id === 'record_max_over'
    );
    expect(maxOverResult).toBeDefined();
    expect(maxOverResult.status).toBe('INVALID');
    expect(maxOverResult.isWithinRange).toBe(false);
    expect(maxOverResult.reason).toMatch(/最大値/);

    // 検証ログに各境界値の判定理由が正確に記録
    expect(validationResult).toHaveProperty('validationLog');
    expect(Array.isArray(validationResult.validationLog)).toBe(true);
    expect(validationResult.validationLog.length).toBeGreaterThan(0);

    // レポートに判定結果の詳細が反映
    expect(validationResult).toHaveProperty('detailReport');
    expect(validationResult.detailReport).toHaveProperty('totalRecords', 4);
    expect(validationResult.detailReport).toHaveProperty('validCount', 2);
    expect(validationResult.detailReport).toHaveProperty('invalidCount', 2);
    expect(validationResult.detailReport.validPercentage).toBe(50);
  });
});