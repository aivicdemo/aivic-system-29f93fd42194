import { detectAndFlagOCRAnomalies } from '../../src/logic/it-6-3-1';

describe('OCR読取異常値検出・フラグ付け機能', () => {
  test('SCEN-821: 許容範囲の境界値にある読取値が正常値として判定され、フラグが付与されない', () => {
    // 許容範囲: 下限値 = 100, 上限値 = 500
    const lowerBoundaryValue = 100;
    const upperBoundaryValue = 500;
    const toleranceLower = 100;
    const toleranceUpper = 500;

    // 下限値に相当する読取値をテストデータとして設定
    const ocrResultLowerBoundary = {
      itemId: 'ITEM_001',
      readValue: lowerBoundaryValue,
      itemName: '基礎工事',
      quantity: 10,
      unitPrice: lowerBoundaryValue,
      totalAmount: 1000,
    };

    // 下限値での検証実行
    const resultLower = detectAndFlagOCRAnomalies(ocrResultLowerBoundary, {
      toleranceLower,
      toleranceUpper,
    });

    // 下限値での結果検証: 異常フラグなし、正常値として判定される
    expect(resultLower.isAnomaly).toBe(false);
    expect(resultLower.flagged).toBe(false);
    expect(resultLower.anomalyType).toBeNull();

    // 上限値に相当する読取値をテストデータとして設定
    const ocrResultUpperBoundary = {
      itemId: 'ITEM_002',
      readValue: upperBoundaryValue,
      itemName: '躯体工事',
      quantity: 20,
      unitPrice: upperBoundaryValue,
      totalAmount: 10000,
    };

    // 上限値での検証実行
    const resultUpper = detectAndFlagOCRAnomalies(ocrResultUpperBoundary, {
      toleranceLower,
      toleranceUpper,
    });

    // 上限値での結果検証: 異常フラグなし、正常値として判定される
    expect(resultUpper.isAnomaly).toBe(false);
    expect(resultUpper.flagged).toBe(false);
    expect(resultUpper.anomalyType).toBeNull();

    // 下限値と上限値の両方で正常判定されていることを確認
    expect(resultLower.readValue).toBe(lowerBoundaryValue);
    expect(resultUpper.readValue).toBe(upperBoundaryValue);
    expect(resultLower.withinRange).toBe(true);
    expect(resultUpper.withinRange).toBe(true);

    // テスト結果の統合検証: 両方のテストケースで期待値と一致
    const testResults = [resultLower, resultUpper];
    testResults.forEach((result) => {
      expect(result.isAnomaly).toBe(false);
      expect(result.flagged).toBe(false);
    });
  });
});