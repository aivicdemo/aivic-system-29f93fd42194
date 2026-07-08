import { describe, test, expect, beforeEach } from '@jest/globals';
import { validateCriteriaSystemCompatibility } from '../../src/logic/it-6-2-2-1';

describe('査定員別・案件別の判定ロジック・乖離パターン履歴の記録・抽出機能', () => {
  // SCEN-899: [edge] 基準の完全性・一貫性・互換性自動検証 - システム互換性チェックで許容値範囲の制約違反が検出される
  test('system compatibility check detects constraint violations outside tolerance range', () => {
    // Precondition: テストデータとして、許容値範囲を超える制約値を持つ基準定義JSONを準備
    const invalidCriteriaDefinition = {
      criteria_id: 'CRT-20240115-001',
      criteria_name: '地盤改良工・基準単価判定',
      work_type_code: 'G001',
      region_code: 'TK',
      season_code: 'WINTER',
      price_band_code: 'M',
      lower_limit_percentage: -150, // 違反: 許容範囲は -50 ～ +50
      upper_limit_percentage: 200,  // 違反: 許容範囲は -50 ～ +50
      base_unit_price: 25000,
      adjustment_coefficient: 1.8,  // 違反: 許容範囲は 0.5 ～ 1.5
      reference_data_count: 2,       // 違反: 最小要件は 5
      reference_data_coverage: 30,   // 違反: 最小要件は 60
      version: '1.0',
      created_date: '2024-01-15T08:00:00Z',
      updated_date: '2024-01-15T09:30:00Z',
    };

    // Trigger: システム互換性チェック機能に上記のJSONを入力して自動検証プロセスを実行
    const validationResult = validateCriteriaSystemCompatibility(invalidCriteriaDefinition);

    // Outcome: システムが許容値範囲外の制約違反を正確に検出し、違反箇所を特定したエラーレポートを返す

    // 1. 違反検出が成功したことを確認
    expect(validationResult.is_valid).toBe(false);

    // 2. 検出された違反情報が正確に識別されたことを確認
    expect(validationResult.violation_count).toBe(5);

    // 3. 各違反について、違反した項目名が正確に記録されていることを確認
    expect(validationResult.violations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field_name: 'lower_limit_percentage',
          violation_type: 'CONSTRAINT_OUT_OF_RANGE',
        }),
        expect.objectContaining({
          field_name: 'upper_limit_percentage',
          violation_type: 'CONSTRAINT_OUT_OF_RANGE',
        }),
        expect.objectContaining({
          field_name: 'adjustment_coefficient',
          violation_type: 'CONSTRAINT_OUT_OF_RANGE',
        }),
        expect.objectContaining({
          field_name: 'reference_data_count',
          violation_type: 'MINIMUM_THRESHOLD_VIOLATION',
        }),
        expect.objectContaining({
          field_name: 'reference_data_coverage',
          violation_type: 'MINIMUM_THRESHOLD_VIOLATION',
        }),
      ])
    );

    // 4. lower_limit_percentage の違反詳細を検証
    const lower_limit_violation = validationResult.violations.find(
      (v: any) => v.field_name === 'lower_limit_percentage'
    );
    expect(lower_limit_violation).toBeDefined();
    expect(lower_limit_violation.set_value).toBe(-150);
    expect(lower_limit_violation.tolerance_min).toBe(-50);
    expect(lower_limit_violation.tolerance_max).toBe(50);
    expect(lower_limit_violation.violation_message).toMatch(/lower_limit_percentage/);

    // 5. upper_limit_percentage の違反詳細を検証
    const upper_limit_violation = validationResult.violations.find(
      (v: any) => v.field_name === 'upper_limit_percentage'
    );
    expect(upper_limit_violation).toBeDefined();
    expect(upper_limit_violation.set_value).toBe(200);
    expect(upper_limit_violation.tolerance_min).toBe(-50);
    expect(upper_limit_violation.tolerance_max).toBe(50);

    // 6. adjustment_coefficient の違反詳細を検証
    const adjustment_coefficient_violation = validationResult.violations.find(
      (v: any) => v.field_name === 'adjustment_coefficient'
    );
    expect(adjustment_coefficient_violation).toBeDefined();
    expect(adjustment_coefficient_violation.set_value).toBe(1.8);
    expect(adjustment_coefficient_violation.tolerance_min).toBe(0.5);
    expect(adjustment_coefficient_violation.tolerance_max).toBe(1.5);

    // 7. reference_data_count の最小要件違反を検証
    const ref_count_violation = validationResult.violations.find(
      (v: any) => v.field_name === 'reference_data_count'
    );
    expect(ref_count_violation).toBeDefined();
    expect(ref_count_violation.set_value).toBe(2);
    expect(ref_count_violation.minimum_required).toBe(5);

    // 8. reference_data_coverage の最小要件違反を検証
    const ref_coverage_violation = validationResult.violations.find(
      (v: any) => v.field_name === 'reference_data_coverage'
    );
    expect(ref_coverage_violation).toBeDefined();
    expect(ref_coverage_violation.set_value).toBe(30);
    expect(ref_coverage_violation.minimum_required).toBe(60);

    // 9. エラーレポートが構造化されて出力されていることを確認
    expect(validationResult.error_report).toBeDefined();
    expect(validationResult.error_report.criteria_id).toBe('CRT-20240115-001');
    expect(validationResult.error_report.validation_timestamp).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z/);
    expect(validationResult.error_report.total_violations).toBe(5);

    // 10. システム互換性チェックが失敗状態で終了することを確認
    expect(validationResult.compatibility_check_status).toBe('FAILED');
    expect(validationResult.can_register_to_system).toBe(false);
  });
});