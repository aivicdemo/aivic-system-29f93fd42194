import { calculateMarketDeviation } from '../../src/logic/it-6-3-1';

describe('見積項目相場乖離自動算出機能 - エラーハンドリング', () => {
  // SCEN-806
  test('相場基準値がゼロまたは不正な値の場合、計算エラーが適切にハンドリングされる', () => {
    // ケース1: 相場基準値がゼロの場合
    const zeroBaselineInput = {
      estimateAmount: 1000000,
      marketBaseline: 0,
      estimateItemId: 'item-001',
      workType: '建築工事',
      region: '東京',
    };

    expect(() => {
      calculateMarketDeviation(zeroBaselineInput);
    }).toThrow(/相場基準値/);

    // ケース2: 相場基準値がnullの場合
    const nullBaselineInput = {
      estimateAmount: 1000000,
      marketBaseline: null,
      estimateItemId: 'item-002',
      workType: '建築工事',
      region: '東京',
    };

    expect(() => {
      calculateMarketDeviation(nullBaselineInput as any);
    }).toThrow(/相場基準値/);

    // ケース3: 相場基準値がundefinedの場合
    const undefinedBaselineInput = {
      estimateAmount: 1000000,
      marketBaseline: undefined,
      estimateItemId: 'item-003',
      workType: '建築工事',
      region: '東京',
    };

    expect(() => {
      calculateMarketDeviation(undefinedBaselineInput as any);
    }).toThrow(/相場基準値/);

    // ケース4: 相場基準値が負数の場合
    const negativeBaselineInput = {
      estimateAmount: 1000000,
      marketBaseline: -500000,
      estimateItemId: 'item-004',
      workType: '建築工事',
      region: '東京',
    };

    expect(() => {
      calculateMarketDeviation(negativeBaselineInput);
    }).toThrow(/相場基準値/);

    // ケース5: 正常な入力値での計算成功
    const validInput = {
      estimateAmount: 1200000,
      marketBaseline: 1000000,
      estimateItemId: 'item-005',
      workType: '建築工事',
      region: '東京',
    };

    const result = calculateMarketDeviation(validInput);

    expect(result).toEqual({
      deviationRate: 20,
      deviationAmount: 200000,
      estimateItemId: 'item-005',
      status: 'success',
      errorCode: null,
      errorMessage: null,
    });

    // ケース6: 乖離率が許容範囲内（±10%）
    const withinToleranceInput = {
      estimateAmount: 950000,
      marketBaseline: 1000000,
      estimateItemId: 'item-006',
      workType: '建築工事',
      region: '東京',
    };

    const toleranceResult = calculateMarketDeviation(withinToleranceInput);

    expect(toleranceResult).toEqual({
      deviationRate: -5,
      deviationAmount: -50000,
      estimateItemId: 'item-006',
      status: 'success',
      errorCode: null,
      errorMessage: null,
    });

    // ケース7: 乖離率が許容範囲外（+25%）
    const exceedsToleranceInput = {
      estimateAmount: 1250000,
      marketBaseline: 1000000,
      estimateItemId: 'item-007',
      workType: '建築工事',
      region: '東京',
    };

    const exceedResult = calculateMarketDeviation(exceedsToleranceInput);

    expect(exceedResult).toEqual({
      deviationRate: 25,
      deviationAmount: 250000,
      estimateItemId: 'item-007',
      status: 'warning',
      errorCode: null,
      errorMessage: null,
    });

    // ケース8: 見積金額がゼロの場合
    const zeroEstimateInput = {
      estimateAmount: 0,
      marketBaseline: 1000000,
      estimateItemId: 'item-008',
      workType: '建築工事',
      region: '東京',
    };

    const zeroEstimateResult = calculateMarketDeviation(zeroEstimateInput);

    expect(zeroEstimateResult).toEqual({
      deviationRate: -100,
      deviationAmount: -1000000,
      estimateItemId: 'item-008',
      status: 'error',
      errorCode: 'ESTIMATE_AMOUNT_ZERO',
      errorMessage: '見積金額が0です',
    });

    // ケース9: 見積金額が負数の場合
    const negativeEstimateInput = {
      estimateAmount: -500000,
      marketBaseline: 1000000,
      estimateItemId: 'item-009',
      workType: '建築工事',
      region: '東京',
    };

    expect(() => {
      calculateMarketDeviation(negativeEstimateInput);
    }).toThrow(/見積金額/);

    // ケース10: 相場基準値が非数値（文字列）の場合
    const stringBaselineInput = {
      estimateAmount: 1000000,
      marketBaseline: 'invalid',
      estimateItemId: 'item-010',
      workType: '建築工事',
      region: '東京',
    };

    expect(() => {
      calculateMarketDeviation(stringBaselineInput as any);
    }).toThrow(/相場基準値/);
  });
});