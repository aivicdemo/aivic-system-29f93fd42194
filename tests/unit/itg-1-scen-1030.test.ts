import { validateSalesDataRange } from '../../src/logic/it-1781935279444-2-1-1';

describe('営業データ品質検証 - 値の範囲境界値判定', () => {
  // SCEN-1030: 値の範囲の境界値が正確に判定される
  test('値の範囲の境界値（0と1000000）が正確に判定され、最小値0と最大値1000000は合格、-1と1000001は不合格、範囲内の中間値500000は合格と判定される', () => {
    const minBoundary = 0;
    const maxBoundary = 1000000;
    const belowMinBoundary = -1;
    const aboveMaxBoundary = 1000001;
    const midValue = 500000;

    // 最小値の境界値テスト: 値を0に設定して検証を実行する
    const resultAtMin = validateSalesDataRange({
      value: minBoundary,
      minAllowed: 0,
      maxAllowed: 1000000,
    });
    expect(resultAtMin.isValid).toBe(true);
    expect(resultAtMin.status).toBe('pass');

    // 最小値より1つ小さい値（-1）を入力して検証を実行する
    const resultBelowMin = validateSalesDataRange({
      value: belowMinBoundary,
      minAllowed: 0,
      maxAllowed: 1000000,
    });
    expect(resultBelowMin.isValid).toBe(false);
    expect(resultBelowMin.status).toBe('fail');
    expect(resultBelowMin.errorMessage).toMatch(/最小値/);

    // 最大値の境界値テスト: 値を1000000に設定して検証を実行する
    const resultAtMax = validateSalesDataRange({
      value: maxBoundary,
      minAllowed: 0,
      maxAllowed: 1000000,
    });
    expect(resultAtMax.isValid).toBe(true);
    expect(resultAtMax.status).toBe('pass');

    // 最大値より1つ大きい値（1000001）を入力して検証を実行する
    const resultAboveMax = validateSalesDataRange({
      value: aboveMaxBoundary,
      minAllowed: 0,
      maxAllowed: 1000000,
    });
    expect(resultAboveMax.isValid).toBe(false);
    expect(resultAboveMax.status).toBe('fail');
    expect(resultAboveMax.errorMessage).toMatch(/最大値/);

    // 範囲内の中間値（500000）を入力して検証を実行する
    const resultMidValue = validateSalesDataRange({
      value: midValue,
      minAllowed: 0,
      maxAllowed: 1000000,
    });
    expect(resultMidValue.isValid).toBe(true);
    expect(resultMidValue.status).toBe('pass');

    // すべての境界値判定が品質基準を満たしていることを確認
    const allResultsValid = [
      resultAtMin.isValid === true,
      resultBelowMin.isValid === false,
      resultAtMax.isValid === true,
      resultAboveMax.isValid === false,
      resultMidValue.isValid === true,
    ].every((condition) => condition);
    expect(allResultsValid).toBe(true);
  });
});