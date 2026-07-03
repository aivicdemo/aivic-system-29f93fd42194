import { compareReportDataWithSourceData } from '../../src/logic/it-1781935279444-2-2-1';

describe('レポート数値とソースデータの照合機能 - 許容誤差範囲内の数値差分を一致として判定', () => {
  // SCEN-1170
  test('許容誤差範囲内（±0.1%）の数値差分は一致として正しく判定され、範囲外の差分は不一致として判定される', () => {
    // 基準値: 1,000,000円
    const source_data_value = 1000000;
    // 許容誤差: 0.1% = ±1,000円
    const tolerance_percent = 0.1;

    // ケース1: 許容誤差範囲内（+500円）
    const report_value_within_upper = 1000500;
    const result_within_upper = compareReportDataWithSourceData({
      source_data_value,
      report_value: report_value_within_upper,
      tolerance_percent,
    });
    expect(result_within_upper.is_matched).toBe(true);
    expect(result_within_upper.difference).toBe(500);
    expect(result_within_upper.tolerance_upper_bound).toBe(1001000);
    expect(result_within_upper.tolerance_lower_bound).toBe(999000);

    // ケース2: 許容誤差上限値（+1,000円）
    const report_value_at_upper = 1001000;
    const result_at_upper = compareReportDataWithSourceData({
      source_data_value,
      report_value: report_value_at_upper,
      tolerance_percent,
    });
    expect(result_at_upper.is_matched).toBe(true);
    expect(result_at_upper.difference).toBe(1000);

    // ケース3: 許容誤差下限値（-1,000円）
    const report_value_at_lower = 999000;
    const result_at_lower = compareReportDataWithSourceData({
      source_data_value,
      report_value: report_value_at_lower,
      tolerance_percent,
    });
    expect(result_at_lower.is_matched).toBe(true);
    expect(result_at_lower.difference).toBe(-1000);

    // ケース4: 許容誤差範囲を超える値（+2,000円）
    const report_value_beyond_upper = 1002000;
    const result_beyond_upper = compareReportDataWithSourceData({
      source_data_value,
      report_value: report_value_beyond_upper,
      tolerance_percent,
    });
    expect(result_beyond_upper.is_matched).toBe(false);
    expect(result_beyond_upper.difference).toBe(2000);

    // ケース5: 許容誤差範囲を超える値（-2,000円）
    const report_value_beyond_lower = 998000;
    const result_beyond_lower = compareReportDataWithSourceData({
      source_data_value,
      report_value: report_value_beyond_lower,
      tolerance_percent,
    });
    expect(result_beyond_lower.is_matched).toBe(false);
    expect(result_beyond_lower.difference).toBe(-2000);

    // ケース6: 完全一致（差分0円）
    const report_value_exact = 1000000;
    const result_exact = compareReportDataWithSourceData({
      source_data_value,
      report_value: report_value_exact,
      tolerance_percent,
    });
    expect(result_exact.is_matched).toBe(true);
    expect(result_exact.difference).toBe(0);
  });
});