import { detectExceptionCases } from '../../src/logic/it-1781935279444-2-1-1';

describe('営業データ入力時の品質検証ルール定義・実行機能', () => {
  // SCEN-992: [normal] 例外ケース検出と手順書への追加判定 - 判断基準の曖昧さが原因である例外ケースが改善対象として抽出される
  test('判断基準が曖昧な営業データから例外ケースを検出し、改善対象として分類する', () => {
    // 判断基準が曖昧な営業データサンプル
    const ambiguousSalesData = {
      customer_id: 'CUST-001',
      service_type: 'premium',
      appointment_count: 5,
      contract_value: 250000,
      discount_rate: 0.15,
      execution_date: '2024-01-15',
      notes: '顧客反応が曖昧で判定困難'
    };

    // データ品質検証ルール定義（判断基準が曖昧なケース）
    const ambiguousValidationRules = [
      {
        rule_id: 'RULE-001',
        field_name: 'discount_rate',
        validation_type: 'range_check',
        min_value: 0,
        max_value: 0.5,
        description: '割引率の範囲チェック'
      },
      {
        rule_id: 'RULE-002',
        field_name: 'contract_value',
        validation_type: 'threshold',
        threshold_value: 200000,
        operator: 'gte',
        description: '契約金額の最小値チェック（判断基準が明確でない）'
      },
      {
        rule_id: 'RULE-003',
        field_name: 'appointment_count',
        validation_type: 'business_logic',
        expected_min: 3,
        expected_max: 10,
        description: 'アポイント数の合理性チェック（基準が曖昧）'
      }
    ];

    // データ品質分析を実行
    const analysisResult = detectExceptionCases({
      sales_data: ambiguousSalesData,
      validation_rules: ambiguousValidationRules,
      analysis_type: 'ambiguous_criteria_detection'
    });

    // 検出された例外ケースの一覧を確認
    expect(analysisResult).toHaveProperty('exception_cases');
    expect(Array.isArray(analysisResult.exception_cases)).toBe(true);
    expect(analysisResult.exception_cases.length).toBeGreaterThan(0);

    // 判断基準の曖昧さが原因である例外ケースが改善対象として分類されているか確認
    const ambiguousCriteriaCases = analysisResult.exception_cases.filter(
      (ec: any) => ec.root_cause === 'ambiguous_criteria'
    );
    expect(ambiguousCriteriaCases.length).toBeGreaterThan(0);

    // 検出された例外ケースの詳細を確認
    const firstAmbiguousCase = ambiguousCriteriaCases[0];
    expect(firstAmbiguousCase).toHaveProperty('exception_id');
    expect(firstAmbiguousCase).toHaveProperty('rule_id');
    expect(firstAmbiguousCase).toHaveProperty('detected_field');
    expect(firstAmbiguousCase).toHaveProperty('detected_value');
    expect(firstAmbiguousCase).toHaveProperty('root_cause');
    expect(firstAmbiguousCase).toHaveProperty('improvement_category');

    // 改善対象の判定内容を確認
    expect(firstAmbiguousCase.root_cause).toBe('ambiguous_criteria');
    expect(firstAmbiguousCase.improvement_category).toBe('clarify_judgment_criteria');

    // 手順書への追加判定処理を実行
    const manualAdditionResult = detectExceptionCases({
      sales_data: ambiguousSalesData,
      validation_rules: ambiguousValidationRules,
      analysis_type: 'ambiguous_criteria_detection',
      action: 'add_to_procedure_manual'
    });

    // 改善対象として手順書に追加される処理が実行されたか確認
    expect(manualAdditionResult).toHaveProperty('procedure_update_status');
    expect(manualAdditionResult.procedure_update_status).toBe('queued_for_addition');
    expect(manualAdditionResult).toHaveProperty('added_case_count');
    expect(manualAdditionResult.added_case_count).toBeGreaterThan(0);
    expect(manualAdditionResult).toHaveProperty('procedure_manual_version');
    expect(typeof manualAdditionResult.procedure_manual_version).toBe('string');

    // 改善対象ケースが正しく手順書に追加されるプロセスが進行していることを確認
    expect(manualAdditionResult).toHaveProperty('next_approval_step');
    expect(manualAdditionResult.next_approval_step).toBe('manager_review');
  });
});