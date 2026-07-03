import { detectAnomaliesAndMissingData } from '../../src/logic/it-1781935279444-2-2-1';

describe('営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能', () => {
  // SCEN-1108: [edge] 異常値・欠落データ自動検出 - 空文字列と NULL が区別され、どちらも欠落として検出される
  test('SCEN-1108: 空文字列と NULL 値の両方が欠落データとして正確に検出され、同じ欠落カテゴリに統一分類される', () => {
    const testDataset = [
      {
        record_id: 'REC001',
        customer_name: '',
        contact_date: '2024-01-15',
        deal_content: 'Sample deal',
        appointment_status: 'confirmed',
      },
      {
        record_id: 'REC002',
        customer_name: null,
        contact_date: '2024-01-16',
        deal_content: 'Sample deal 2',
        appointment_status: 'pending',
      },
      {
        record_id: 'REC003',
        customer_name: 'Valid Customer',
        contact_date: '2024-01-17',
        deal_content: 'Sample deal 3',
        appointment_status: 'confirmed',
      },
    ];

    const detection_result = detectAnomaliesAndMissingData(testDataset);

    expect(detection_result.missing_data_records).toHaveLength(2);

    const missing_record_ids = detection_result.missing_data_records.map(
      (record: any) => record.record_id
    );
    expect(missing_record_ids).toContain('REC001');
    expect(missing_record_ids).toContain('REC002');

    const empty_string_record = detection_result.missing_data_records.find(
      (record: any) => record.record_id === 'REC001'
    );
    const null_record = detection_result.missing_data_records.find(
      (record: any) => record.record_id === 'REC002'
    );

    expect(empty_string_record.classification).toBe('missing_data');
    expect(null_record.classification).toBe('missing_data');
    expect(empty_string_record.missing_field).toBe('customer_name');
    expect(null_record.missing_field).toBe('customer_name');

    expect(detection_result.quality_score).toBe(66.67);
    expect(detection_result.valid_record_count).toBe(1);
    expect(detection_result.missing_data_count).toBe(2);
  });
});