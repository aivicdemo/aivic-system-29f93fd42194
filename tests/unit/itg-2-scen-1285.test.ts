import { classifyMonthlyVariationPattern } from '../../src/logic/it-1-br-2-2-2-1';

describe('査定員ごとの判定結果と根拠の月次集計・分析ダッシュボード', () => {
  // SCEN-1285
  test('過去12ヶ月未満のデータでは月次変動パターン分類がエラーとなる', () => {
    const insufficient_months_data = [
      { month: '2024-01', assessment_count: 150 },
      { month: '2024-02', assessment_count: 165 },
      { month: '2024-03', assessment_count: 170 },
      { month: '2024-04', assessment_count: 158 },
      { month: '2024-05', assessment_count: 172 },
      { month: '2024-06', assessment_count: 180 },
    ];

    expect(() => {
      classifyMonthlyVariationPattern(insufficient_months_data);
    }).toThrow(/12ヶ月/);
  });

  test('正常系: 過去12ヶ月以上のデータで月次変動パターンが分類される', () => {
    const sufficient_months_data = [
      { month: '2023-01', assessment_count: 150 },
      { month: '2023-02', assessment_count: 165 },
      { month: '2023-03', assessment_count: 170 },
      { month: '2023-04', assessment_count: 158 },
      { month: '2023-05', assessment_count: 172 },
      { month: '2023-06', assessment_count: 180 },
      { month: '2023-07', assessment_count: 175 },
      { month: '2023-08', assessment_count: 168 },
      { month: '2023-09', assessment_count: 155 },
      { month: '2023-10', assessment_count: 160 },
      { month: '2023-11', assessment_count: 185 },
      { month: '2023-12', assessment_count: 190 },
    ];

    const result = classifyMonthlyVariationPattern(sufficient_months_data);

    expect(result).toEqual({
      status: 'success',
      classification: 'normal_period',
      average_monthly_count: 170,
      min_count: 150,
      max_count: 190,
      variance_ratio: 0.2353,
      required_staff_count: 6,
    });
  });

  test('境界値: ちょうど12ヶ月のデータで処理成功', () => {
    const exactly_12_months = [
      { month: '2023-01', assessment_count: 100 },
      { month: '2023-02', assessment_count: 110 },
      { month: '2023-03', assessment_count: 105 },
      { month: '2023-04', assessment_count: 115 },
      { month: '2023-05', assessment_count: 120 },
      { month: '2023-06', assessment_count: 125 },
      { month: '2023-07', assessment_count: 130 },
      { month: '2023-08', assessment_count: 128 },
      { month: '2023-09', assessment_count: 118 },
      { month: '2023-10', assessment_count: 112 },
      { month: '2023-11', assessment_count: 135 },
      { month: '2023-12', assessment_count: 140 },
    ];

    const result = classifyMonthlyVariationPattern(exactly_12_months);

    expect(result.status).toBe('success');
    expect(result.classification).toBeDefined();
    expect(result.required_staff_count).toBeGreaterThan(0);
  });

  test('繁忙期判定: 変動率が高いデータは繁忙期と分類される', () => {
    const high_variance_data = [
      { month: '2023-01', assessment_count: 50 },
      { month: '2023-02', assessment_count: 55 },
      { month: '2023-03', assessment_count: 52 },
      { month: '2023-04', assessment_count: 60 },
      { month: '2023-05', assessment_count: 65 },
      { month: '2023-06', assessment_count: 300 },
      { month: '2023-07', assessment_count: 310 },
      { month: '2023-08', assessment_count: 305 },
      { month: '2023-09', assessment_count: 70 },
      { month: '2023-10', assessment_count: 75 },
      { month: '2023-11', assessment_count: 320 },
      { month: '2023-12', assessment_count: 315 },
    ];

    const result = classifyMonthlyVariationPattern(high_variance_data);

    expect(result.status).toBe('success');
    expect(result.classification).toBe('busy_period');
    expect(result.required_staff_count).toBeGreaterThan(5);
  });

  test('通常期判定: 変動率が低いデータは通常期と分類される', () => {
    const low_variance_data = [
      { month: '2023-01', assessment_count: 200 },
      { month: '2023-02', assessment_count: 202 },
      { month: '2023-03', assessment_count: 201 },
      { month: '2023-04', assessment_count: 203 },
      { month: '2023-05', assessment_count: 199 },
      { month: '2023-06', assessment_count: 204 },
      { month: '2023-07', assessment_count: 200 },
      { month: '2023-08', assessment_count: 205 },
      { month: '2023-09', assessment_count: 198 },
      { month: '2023-10', assessment_count: 202 },
      { month: '2023-11', assessment_count: 201 },
      { month: '2023-12', assessment_count: 203 },
    ];

    const result = classifyMonthlyVariationPattern(low_variance_data);

    expect(result.status).toBe('success');
    expect(result.classification).toBe('normal_period');
    expect(result.variance_ratio).toBeLessThan(0.05);
  });
});