import { calculatePriceLevelAdjustmentCoefficient } from '../../src/logic/it-1-br-6-2-1';

describe('査定員別の判定ばらつき率と相場乖離傾向の自動集計・分析機能', () => {
  test('SCEN-911: 物価変動補正係数計算 - 基準時点が指定されていない場合にエラーを返す', () => {
    // Scenario: 基準時点パラメータなしで物価変動補正係数計算を実行
    // Expected: MissingParameterError or ValidationError with message containing '基準時点'

    // Case 1: baseReferenceDate が null
    expect(() =>
      calculatePriceLevelAdjustmentCoefficient({
        baseReferenceDate: null,
        comparisonDate: new Date('2024-06-15'),
        productCategory: 'concrete',
        region: 'tokyo',
      })
    ).toThrow(/基準時点/);

    // Case 2: baseReferenceDate が undefined
    expect(() =>
      calculatePriceLevelAdjustmentCoefficient({
        baseReferenceDate: undefined,
        comparisonDate: new Date('2024-06-15'),
        productCategory: 'concrete',
        region: 'tokyo',
      })
    ).toThrow(/基準時点/);

    // Case 3: baseReferenceDate が空文字列
    expect(() =>
      calculatePriceLevelAdjustmentCoefficient({
        baseReferenceDate: '',
        comparisonDate: new Date('2024-06-15'),
        productCategory: 'concrete',
        region: 'tokyo',
      })
    ).toThrow(/基準時点/);

    // Case 4: baseReferenceDate が無効な日付形式
    expect(() =>
      calculatePriceLevelAdjustmentCoefficient({
        baseReferenceDate: 'invalid-date',
        comparisonDate: new Date('2024-06-15'),
        productCategory: 'concrete',
        region: 'tokyo',
      })
    ).toThrow(/基準時点/);

    // Case 5: baseReferenceDate が欠落している（オブジェクトに含まれない）
    expect(() =>
      calculatePriceLevelAdjustmentCoefficient({
        comparisonDate: new Date('2024-06-15'),
        productCategory: 'concrete',
        region: 'tokyo',
      } as any)
    ).toThrow(/基準時点/);
  });
});