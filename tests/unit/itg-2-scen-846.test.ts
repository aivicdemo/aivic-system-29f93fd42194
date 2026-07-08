import { recordJudgmentBasisWithMissingReference } from '../../src/logic/it-6-3-1';

describe('判定根拠自動記録機能 - 参照データ欠落時の処理', () => {
  // SCEN-846
  test('参照データが欠落している場合でも判定根拠の記録が完了し、欠落フラグが立つ', () => {
    // Arrange: テストデータ準備
    const input = {
      case_id: 'CASE20240115001',
      assessor_id: 'ASSESSOR00001',
      assessment_datetime: '2024-01-15T11:00:00Z',
      quotation_amount: 5000000,
      deviation_rate: 8.5,
      deviation_amount: 425000,
      reference_data_count: 0,
      reference_source: '',
      correction_coefficient: 1.0,
      judgment_logic_id: 'LOGIC_STANDARD_001',
      judgment_reason: '市場相場と比較して適正範囲内と判定。ただし参照データ不足のため条件付き承認。',
      is_reference_missing: true,
    };

    // Act: 判定根拠記録処理を実行
    const result = recordJudgmentBasisWithMissingReference(input);

    // Assert: 成功結果の検証
    expect(result.success).toBe(true);
    expect(result.message).toBe('記録完了');
    expect(result.recorded_basis_id).toMatch(/^BASIS_/);

    // 記録されたデータの検証
    expect(result.recorded_data.case_id).toBe('CASE20240115001');
    expect(result.recorded_data.assessor_id).toBe('ASSESSOR00001');
    expect(result.recorded_data.quotation_amount).toBe(5000000);
    expect(result.recorded_data.deviation_rate).toBe(8.5);
    expect(result.recorded_data.deviation_amount).toBe(425000);
    expect(result.recorded_data.judgment_reason).toBe(
      '市場相場と比較して適正範囲内と判定。ただし参照データ不足のため条件付き承認。'
    );

    // 欠落フラグの検証
    expect(result.recorded_data.missing_reference_flag).toBe(true);
    expect(result.recorded_data.missing_reference_status).toBe('MISSING');

    // エラーメッセージが表示されていないことを確認
    expect(result.error_message).toBeUndefined();
    expect(result.warning_message).toBeUndefined();
  });
});