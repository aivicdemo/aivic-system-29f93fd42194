import { validateOCRAccuracy } from '../../src/logic/it-6-3-1';

describe('査定判定ロジックの適用履歴と根拠の記録・検索機能', () => {
  test('SCEN-1344: OCR読取精度判定 - 許容誤差率の境界値ちょうどで合格と判定される', () => {
    const tolerance_threshold = 5.0;
    const boundary_error_rate = 5.0;
    const item_name = '工事種別';
    const ocr_read_value = '鉄骨造工事';
    const correct_value = '鉄骨工事';
    const character_distance = 2;
    const max_length = 40;

    const calculated_error_rate = (character_distance / max_length) * 100;

    const input_data = {
      item_name: item_name,
      ocr_value: ocr_read_value,
      reference_value: correct_value,
      error_rate: calculated_error_rate,
      tolerance_percent: tolerance_threshold,
      timestamp: new Date('2024-02-15T10:30:00Z'),
      operator_id: 'OPR00001',
      audit_log_id: 'LOG20240215001'
    };

    const result = validateOCRAccuracy(input_data);

    expect(result.error_rate).toBe(5.0);
    expect(result.tolerance_threshold).toBe(5.0);
    expect(result.is_within_tolerance).toBe(true);
    expect(result.judgment_status).toBe('OK');
    expect(result.judgment_result).toBe('合格');
    expect(result.item_name).toBe('工事種別');
    expect(result.judgment_timestamp).toBeDefined();
    expect(typeof result.judgment_timestamp).toBe('string');
    expect(result.operator_id).toBe('OPR00001');
    expect(result.audit_log_id).toBe('LOG20240215001');
    expect(result.is_recorded_to_history).toBe(true);
  });
});