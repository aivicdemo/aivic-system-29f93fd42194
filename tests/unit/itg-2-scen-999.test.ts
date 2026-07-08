import { calculateCorrectionCoefficients } from '../../src/logic/it-6-2-2-1';

describe('査定員別・案件別の判定ロジック・乖離パターン履歴の記録・抽出機能', () => {
  test('SCEN-999: [normal] 地域・時期補正係数の自動算出 - 補正前後の金額が正確に計算され、乖離率の変化が表示される', () => {
    // ケース 1: 標準的な補正係数を適用するシナリオ
    // 基準金額: 1,000,000 円
    // 地域: 東京（補正係数 1.1）
    // 時期: 繁忙期（補正係数 1.05）
    const result1 = calculateCorrectionCoefficients({
      baseAmount: 1000000,
      region: '東京',
      season: '繁忙期',
    });

    expect(result1.baseAmount).toBe(1000000);
    expect(result1.regionCoefficientValue).toBe(1.1);
    expect(result1.seasonCoefficientValue).toBe(1.05);
    
    // 補正後金額 = 1,000,000 × 1.1 × 1.05 = 1,155,000
    expect(result1.correctedAmount).toBe(1155000);
    
    // 金額差分 = 1,155,000 - 1,000,000 = 155,000
    expect(result1.amountDifference).toBe(155000);
    
    // 乖離率 = (1,155,000 - 1,000,000) / 1,000,000 × 100 = 15.5%
    expect(result1.divergenceRatePercent).toBe(15.5);

    // ケース 2: 地方での低補正係数を適用するシナリオ
    // 基準金額: 2,000,000 円
    // 地域: 北海道（補正係数 0.95）
    // 時期: 通常期（補正係数 1.0）
    const result2 = calculateCorrectionCoefficients({
      baseAmount: 2000000,
      region: '北海道',
      season: '通常期',
    });

    expect(result2.baseAmount).toBe(2000000);
    expect(result2.regionCoefficientValue).toBe(0.95);
    expect(result2.seasonCoefficientValue).toBe(1.0);
    
    // 補正後金額 = 2,000,000 × 0.95 × 1.0 = 1,900,000
    expect(result2.correctedAmount).toBe(1900000);
    
    // 金額差分 = 1,900,000 - 2,000,000 = -100,000
    expect(result2.amountDifference).toBe(-100000);
    
    // 乖離率 = (1,900,000 - 2,000,000) / 2,000,000 × 100 = -5.0%
    expect(result2.divergenceRatePercent).toBe(-5.0);

    // ケース 3: 地域・時期双方で高補正係数を適用するシナリオ
    // 基準金額: 5,000,000 円
    // 地域: 大阪（補正係数 1.08）
    // 時期: 準繁忙期（補正係数 1.02）
    const result3 = calculateCorrectionCoefficients({
      baseAmount: 5000000,
      region: '大阪',
      season: '準繁忙期',
    });

    expect(result3.baseAmount).toBe(5000000);
    expect(result3.regionCoefficientValue).toBe(1.08);
    expect(result3.seasonCoefficientValue).toBe(1.02);
    
    // 補正後金額 = 5,000,000 × 1.08 × 1.02 = 5,508,000
    expect(result3.correctedAmount).toBe(5508000);
    
    // 金額差分 = 5,508,000 - 5,000,000 = 508,000
    expect(result3.amountDifference).toBe(508000);
    
    // 乖離率 = (5,508,000 - 5,000,000) / 5,000,000 × 100 = 10.16%
    expect(result3.divergenceRatePercent).toBe(10.16);

    // ケース 4: 補正係数が 1.0 に近い標準的な条件
    // 基準金額: 3,500,000 円
    // 地域: 東京都内（補正係数 1.0）
    // 時期: 通常期（補正係数 1.0）
    const result4 = calculateCorrectionCoefficients({
      baseAmount: 3500000,
      region: '東京都内',
      season: '通常期',
    });

    expect(result4.baseAmount).toBe(3500000);
    expect(result4.regionCoefficientValue).toBe(1.0);
    expect(result4.seasonCoefficientValue).toBe(1.0);
    
    // 補正後金額 = 3,500,000 × 1.0 × 1.0 = 3,500,000
    expect(result4.correctedAmount).toBe(3500000);
    
    // 金額差分 = 3,500,000 - 3,500,000 = 0
    expect(result4.amountDifference).toBe(0);
    
    // 乖離率 = 0 / 3,500,000 × 100 = 0.0%
    expect(result4.divergenceRatePercent).toBe(0.0);

    // ケース 5: 地域補正係数が低く、時期補正係数が高いシナリオ
    // 基準金額: 1,500,000 円
    // 地域: 地方都市（補正係数 0.92）
    // 時期: 繁忙期（補正係数 1.05）
    const result5 = calculateCorrectionCoefficients({
      baseAmount: 1500000,
      region: '地方都市',
      season: '繁忙期',
    });

    expect(result5.baseAmount).toBe(1500000);
    expect(result5.regionCoefficientValue).toBe(0.92);
    expect(result5.seasonCoefficientValue).toBe(1.05);
    
    // 補正後金額 = 1,500,000 × 0.92 × 1.05 = 1,449,000
    expect(result5.correctedAmount).toBe(1449000);
    
    // 金額差分 = 1,449,000 - 1,500,000 = -51,000
    expect(result5.amountDifference).toBe(-51000);
    
    // 乖離率 = (1,449,000 - 1,500,000) / 1,500,000 × 100 = -3.4%
    expect(result5.divergenceRatePercent).toBe(-3.4);

    // エラーケース: 基準金額が 0 以下
    expect(() => calculateCorrectionCoefficients({
      baseAmount: 0,
      region: '東京',
      season: '通常期',
    })).toThrow(/金額/);

    // エラーケース: 地域が未指定
    expect(() => calculateCorrectionCoefficients({
      baseAmount: 1000000,
      region: '',
      season: '通常期',
    })).toThrow(/地域/);

    // エラーケース: 時期が未指定
    expect(() => calculateCorrectionCoefficients({
      baseAmount: 1000000,
      region: '東京',
      season: '',
    })).toThrow(/時期/);

    // エラーケース: 基準金額が負数
    expect(() => calculateCorrectionCoefficients({
      baseAmount: -1000000,
      region: '東京',
      season: '通常期',
    })).toThrow(/金額/);

    // エラーケース: 無効な地域コード
    expect(() => calculateCorrectionCoefficients({
      baseAmount: 1000000,
      region: '不正な地域',
      season: '通常期',
    })).toThrow(/地域/);

    // エラーケース: 無効な時期コード
    expect(() => calculateCorrectionCoefficients({
      baseAmount: 1000000,
      region: '東京',
      season: '不正な時期',
    })).toThrow(/時期/);
  });
});