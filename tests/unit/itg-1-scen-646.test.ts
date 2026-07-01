import { describe, test, expect } from '@jest/globals';
import { validateReportGenerationParameters } from '../../src/logic/it-1781935279444-1-1-1';

describe('営業データ項目メタデータ管理 - レポート生成パラメータ検証', () => {
  test('SCEN-646: 契約期間開始日と終了日が同一日の場合、境界値として正しく検証される', () => {
    // Arrange: 契約開始日と終了日が同一日付（2024年1月15日）のパラメータを設定
    const same_date = '2024-01-15';
    const report_params = {
      contract_start_date: same_date,
      contract_end_date: same_date,
      customer_id: 'CUST_001',
      service_id: 'SVC_001',
      report_template_id: 'TPL_MONTHLY_001',
      include_optional_fields: false,
      calculation_logic_version: '1.0'
    };

    // Act: レポート生成パラメータの検証を実行
    const validation_result = validateReportGenerationParameters(report_params);

    // Assert: バリデーション成功を確認
    expect(validation_result.is_valid).toBe(true);
    expect(validation_result.error_messages).toEqual([]);
    expect(validation_result.error_count).toBe(0);

    // Assert: パラメータが正常に受け入れられていることを確認
    expect(validation_result.accepted_parameters).toBeDefined();
    expect(validation_result.accepted_parameters.contract_start_date).toBe('2024-01-15');
    expect(validation_result.accepted_parameters.contract_end_date).toBe('2024-01-15');

    // Assert: 対象期間が0日間として正常に処理されていることを確認
    expect(validation_result.period_days).toBe(0);
    expect(validation_result.period_is_valid).toBe(true);

    // Assert: データベースに保存されるパラメータが正確に記録されていることを確認
    expect(validation_result.saved_parameters).toBeDefined();
    expect(validation_result.saved_parameters.contract_start_date).toBe('2024-01-15');
    expect(validation_result.saved_parameters.contract_end_date).toBe('2024-01-15');
    expect(validation_result.saved_parameters.customer_id).toBe('CUST_001');
    expect(validation_result.saved_parameters.service_id).toBe('SVC_001');
    expect(validation_result.saved_parameters.report_template_id).toBe('TPL_MONTHLY_001');

    // Assert: レポート生成が正常に処理されることを確認
    expect(validation_result.report_generation_enabled).toBe(true);
    expect(validation_result.same_date_boundary_recognized).toBe(true);

    // Assert: タイムスタンプが記録されていることを確認
    expect(validation_result.validation_timestamp).toBeDefined();
    expect(typeof validation_result.validation_timestamp).toBe('string');
  });
});