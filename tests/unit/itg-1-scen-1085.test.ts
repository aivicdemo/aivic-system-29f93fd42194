import { detectAndClassifyExceptionCases } from '../../src/logic/it-1781935279444-2-1-1';

describe('営業データ検証・異常検出機能', () => {
  // SCEN-1085
  test('新入スタッフの実行結果から発見された例外ケースが優先度順に分類される', () => {
    const validation_results = [
      {
        record_id: 'rec_001',
        field_name: 'contact_date',
        error_type: 'format_error',
        error_message: '日付形式が不正です',
        severity: 'high',
        affected_field: 'contact_date',
      },
      {
        record_id: 'rec_002',
        field_name: 'amount',
        error_type: 'invalid_amount',
        error_message: '金額が負の値です',
        severity: 'high',
        affected_field: 'amount',
      },
      {
        record_id: 'rec_003',
        field_name: 'customer_name',
        error_type: 'duplicate_record',
        error_message: '同一顧客の重複レコードです',
        severity: 'medium',
        affected_field: 'customer_name',
      },
      {
        record_id: 'rec_004',
        field_name: 'service_type',
        error_type: 'missing_required_field',
        error_message: '必須項目が入力されていません',
        severity: 'low',
        affected_field: 'service_type',
      },
      {
        record_id: 'rec_005',
        field_name: 'appointment_status',
        error_type: 'invalid_enum_value',
        error_message: 'ステータス値が無効です',
        severity: 'medium',
        affected_field: 'appointment_status',
      },
    ];

    const result = detectAndClassifyExceptionCases(validation_results);

    // 全ての例外ケースが検出されることを確認
    expect(result.total_cases_detected).toBe(5);

    // 優先度ごとの分類数を確認
    expect(result.cases_by_severity.high).toBe(2);
    expect(result.cases_by_severity.medium).toBe(2);
    expect(result.cases_by_severity.low).toBe(1);

    // 優先度の高い順に整列されていることを確認
    expect(result.classified_cases).toHaveLength(5);
    expect(result.classified_cases[0].severity).toBe('high');
    expect(result.classified_cases[1].severity).toBe('high');
    expect(result.classified_cases[2].severity).toBe('medium');
    expect(result.classified_cases[3].severity).toBe('medium');
    expect(result.classified_cases[4].severity).toBe('low');

    // 各優先度レベルに正しい例外ケースが割り当てられていることを確認
    const high_priority_cases = result.classified_cases.filter(
      (c) => c.severity === 'high'
    );
    expect(high_priority_cases).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          error_type: 'format_error',
          severity: 'high',
        }),
        expect.objectContaining({
          error_type: 'invalid_amount',
          severity: 'high',
        }),
      ])
    );

    const medium_priority_cases = result.classified_cases.filter(
      (c) => c.severity === 'medium'
    );
    expect(medium_priority_cases).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          error_type: 'duplicate_record',
          severity: 'medium',
        }),
        expect.objectContaining({
          error_type: 'invalid_enum_value',
          severity: 'medium',
        }),
      ])
    );

    const low_priority_cases = result.classified_cases.filter(
      (c) => c.severity === 'low'
    );
    expect(low_priority_cases).toHaveLength(1);
    expect(low_priority_cases[0]).toEqual(
      expect.objectContaining({
        error_type: 'missing_required_field',
        severity: 'low',
      })
    );

    // 同一優先度内での順序が一貫していることを確認
    expect(result.classified_cases[0].record_id).toBe('rec_001');
    expect(result.classified_cases[1].record_id).toBe('rec_002');
    expect(result.classified_cases[2].record_id).toBe('rec_003');
    expect(result.classified_cases[3].record_id).toBe('rec_005');
    expect(result.classified_cases[4].record_id).toBe('rec_004');

    // 全ての例外ケースが分類されたことを確認
    expect(result.all_cases_classified).toBe(true);
  });
});