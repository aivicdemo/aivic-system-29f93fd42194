import { calculateDiscrepancyComprehensiveJudgment } from '../../src/logic/it-6-2-2-2';

describe('相場乖離総合判定と承認・修正決定', () => {
  // SCEN-838
  test('乖離率・乖離額・参照データ件数・補正係数を総合判定し、承認判定が正常に下される', () => {
    // 【基準値定義】
    // 乖離率許容閾値: ±15%
    // 乖離額許容範囲: ±500,000円
    // 参照データ最小件数: 10件
    // 補正係数有効範囲: 0.8～1.2

    // 【テストケース1: すべての基準を満たす場合 → 承認判定】
    const input_approve = {
      discrepancy_rate: 8.5, // 基準内: ±15%以内
      discrepancy_amount: 250000, // 基準内: ±500,000円以内
      reference_data_count: 25, // 基準内: 10件以上
      adjustment_coefficient: 1.05, // 基準内: 0.8～1.2
    };

    const result_approve = calculateDiscrepancyComprehensiveJudgment(input_approve);

    expect(result_approve).toEqual({
      judgment_status: 'approved',
      discrepancy_rate_valid: true,
      discrepancy_amount_valid: true,
      reference_data_count_valid: true,
      adjustment_coefficient_valid: true,
      overall_judgment: 'approved',
      judgment_timestamp: expect.any(String),
      audit_log_id: expect.any(String),
    });
    expect(result_approve.judgment_status).toBe('approved');
    expect(result_approve.overall_judgment).toBe('approved');

    // 【テストケース2: 乖離率が基準超過 → 修正判定】
    const input_rate_exceed = {
      discrepancy_rate: 18.0, // 基準外: ±15%超過
      discrepancy_amount: 250000,
      reference_data_count: 25,
      adjustment_coefficient: 1.05,
    };

    const result_rate_exceed = calculateDiscrepancyComprehensiveJudgment(input_rate_exceed);

    expect(result_rate_exceed).toEqual({
      judgment_status: 'requires_modification',
      discrepancy_rate_valid: false,
      discrepancy_amount_valid: true,
      reference_data_count_valid: true,
      adjustment_coefficient_valid: true,
      overall_judgment: 'requires_modification',
      judgment_timestamp: expect.any(String),
      audit_log_id: expect.any(String),
    });
    expect(result_rate_exceed.judgment_status).toBe('requires_modification');
    expect(result_rate_exceed.overall_judgment).toBe('requires_modification');

    // 【テストケース3: 乖離額が基準超過 → 修正判定】
    const input_amount_exceed = {
      discrepancy_rate: 8.5,
      discrepancy_amount: 600000, // 基準外: ±500,000円超過
      reference_data_count: 25,
      adjustment_coefficient: 1.05,
    };

    const result_amount_exceed = calculateDiscrepancyComprehensiveJudgment(input_amount_exceed);

    expect(result_amount_exceed).toEqual({
      judgment_status: 'requires_modification',
      discrepancy_rate_valid: true,
      discrepancy_amount_valid: false,
      reference_data_count_valid: true,
      adjustment_coefficient_valid: true,
      overall_judgment: 'requires_modification',
      judgment_timestamp: expect.any(String),
      audit_log_id: expect.any(String),
    });
    expect(result_amount_exceed.judgment_status).toBe('requires_modification');

    // 【テストケース4: 参照データ件数が最小未達 → 修正判定】
    const input_ref_data_insufficient = {
      discrepancy_rate: 8.5,
      discrepancy_amount: 250000,
      reference_data_count: 5, // 基準外: 10件未満
      adjustment_coefficient: 1.05,
    };

    const result_ref_data_insufficient = calculateDiscrepancyComprehensiveJudgment(input_ref_data_insufficient);

    expect(result_ref_data_insufficient).toEqual({
      judgment_status: 'requires_modification',
      discrepancy_rate_valid: true,
      discrepancy_amount_valid: true,
      reference_data_count_valid: false,
      adjustment_coefficient_valid: true,
      overall_judgment: 'requires_modification',
      judgment_timestamp: expect.any(String),
      audit_log_id: expect.any(String),
    });
    expect(result_ref_data_insufficient.judgment_status).toBe('requires_modification');

    // 【テストケース5: 補正係数が有効範囲外 → 修正判定】
    const input_coeff_invalid = {
      discrepancy_rate: 8.5,
      discrepancy_amount: 250000,
      reference_data_count: 25,
      adjustment_coefficient: 1.35, // 基準外: 1.2超過
    };

    const result_coeff_invalid = calculateDiscrepancyComprehensiveJudgment(input_coeff_invalid);

    expect(result_coeff_invalid).toEqual({
      judgment_status: 'requires_modification',
      discrepancy_rate_valid: true,
      discrepancy_amount_valid: true,
      reference_data_count_valid: true,
      adjustment_coefficient_valid: false,
      overall_judgment: 'requires_modification',
      judgment_timestamp: expect.any(String),
      audit_log_id: expect.any(String),
    });
    expect(result_coeff_invalid.judgment_status).toBe('requires_modification');

    // 【テストケース6: 複数の基準が同時に超過 → 修正判定】
    const input_multiple_exceed = {
      discrepancy_rate: 20.0, // 基準外
      discrepancy_amount: 700000, // 基準外
      reference_data_count: 8, // 基準外
      adjustment_coefficient: 0.7, // 基準外
    };

    const result_multiple_exceed = calculateDiscrepancyComprehensiveJudgment(input_multiple_exceed);

    expect(result_multiple_exceed).toEqual({
      judgment_status: 'requires_modification',
      discrepancy_rate_valid: false,
      discrepancy_amount_valid: false,
      reference_data_count_valid: false,
      adjustment_coefficient_valid: false,
      overall_judgment: 'requires_modification',
      judgment_timestamp: expect.any(String),
      audit_log_id: expect.any(String),
    });
    expect(result_multiple_exceed.overall_judgment).toBe('requires_modification');

    // 【テストケース7: 境界値テスト - 乖離率が上限ちょうど】
    const input_rate_boundary_upper = {
      discrepancy_rate: 15.0, // 上限ちょうど
      discrepancy_amount: 250000,
      reference_data_count: 25,
      adjustment_coefficient: 1.05,
    };

    const result_rate_boundary_upper = calculateDiscrepancyComprehensiveJudgment(input_rate_boundary_upper);

    expect(result_rate_boundary_upper.discrepancy_rate_valid).toBe(true);
    expect(result_rate_boundary_upper.overall_judgment).toBe('approved');

    // 【テストケース8: 境界値テスト - 乖離率が下限ちょうど】
    const input_rate_boundary_lower = {
      discrepancy_rate: -15.0, // 下限ちょうど
      discrepancy_amount: 250000,
      reference_data_count: 25,
      adjustment_coefficient: 1.05,
    };

    const result_rate_boundary_lower = calculateDiscrepancyComprehensiveJudgment(input_rate_boundary_lower);

    expect(result_rate_boundary_lower.discrepancy_rate_valid).toBe(true);
    expect(result_rate_boundary_lower.overall_judgment).toBe('approved');

    // 【テストケース9: 境界値テスト - 参照データ件数が最小ちょうど】
    const input_ref_min_boundary = {
      discrepancy_rate: 8.5,
      discrepancy_amount: 250000,
      reference_data_count: 10, // 最小ちょうど
      adjustment_coefficient: 1.05,
    };

    const result_ref_min_boundary = calculateDiscrepancyComprehensiveJudgment(input_ref_min_boundary);

    expect(result_ref_min_boundary.reference_data_count_valid).toBe(true);
    expect(result_ref_min_boundary.overall_judgment).toBe('approved');

    // 【テストケース10: 境界値テスト - 補正係数が下限ちょうど】
    const input_coeff_lower_boundary = {
      discrepancy_rate: 8.5,
      discrepancy_amount: 250000,
      reference_data_count: 25,
      adjustment_coefficient: 0.8, // 下限ちょうど
    };

    const result_coeff_lower_boundary = calculateDiscrepancyComprehensiveJudgment(input_coeff_lower_boundary);

    expect(result_coeff_lower_boundary.adjustment_coefficient_valid).toBe(true);
    expect(result_coeff_lower_boundary.overall_judgment).toBe('approved');

    // 【テストケース11: 境界値テスト - 補正係数が上限ちょうど】
    const input_coeff_upper_boundary = {
      discrepancy_rate: 8.5,
      discrepancy_amount: 250000,
      reference_data_count: 25,
      adjustment_coefficient: 1.2, // 上限ちょうど
    };

    const result_coeff_upper_boundary = calculateDiscrepancyComprehensiveJudgment(input_coeff_upper_boundary);

    expect(result_coeff_upper_boundary.adjustment_coefficient_valid).toBe(true);
    expect(result_coeff_upper_boundary.overall_judgment).toBe('approved');

    // 【テストケース12: エラーケース - 必須フィールド不足】
    const input_missing_field = {
      discrepancy_rate: 8.5,
      discrepancy_amount: 250000,
      // reference_data_count 欠落
      adjustment_coefficient: 1.05,
    } as any;

    expect(() => calculateDiscrepancyComprehensiveJudgment(input_missing_field)).toThrow(/参照データ件数/);

    // 【テストケース13: エラーケース - 不正な型】
    const input_invalid_type = {
      discrepancy_rate: 'invalid', // 文字列
      discrepancy_amount: 250000,
      reference_data_count: 25,
      adjustment_coefficient: 1.05,
    } as any;

    expect(() => calculateDiscrepancyComprehensiveJudgment(input_invalid_type)).toThrow(/乖離率/);
  });
});