import { detectInvalidDateFormats } from '../../src/logic/it-1781935279444-2-2-1';

describe('営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能', () => {
  test('SCEN-1135: 不正な日付フォーマット（例：YYYY-MM-DD以外）が異常値として検出される', () => {
    // 正常なレコード
    const validRecords = [
      { id: 1, customer_name: 'Customer A', contact_date: '2024-01-15', appointment_status: 'confirmed' },
      { id: 2, customer_name: 'Customer B', contact_date: '2024-02-20', appointment_status: 'pending' },
    ];

    // 不正な日付フォーマットを含むレコード
    const invalidRecords = [
      { id: 3, customer_name: 'Customer C', contact_date: '15-01-2024', appointment_status: 'confirmed' },
      { id: 4, customer_name: 'Customer D', contact_date: '01/15/2024', appointment_status: 'pending' },
      { id: 5, customer_name: 'Customer E', contact_date: '2024年1月15日', appointment_status: 'confirmed' },
      { id: 6, customer_name: 'Customer F', contact_date: '2024/01/15', appointment_status: 'pending' },
    ];

    const allRecords = [...validRecords, ...invalidRecords];

    // 異常値検出を実行
    const result = detectInvalidDateFormats(allRecords);

    // 検出結果の検証
    expect(result.valid_records).toHaveLength(2);
    expect(result.invalid_records).toHaveLength(4);

    // 正常なレコードが正しく抽出されたか検証
    expect(result.valid_records[0]).toEqual({
      id: 1,
      customer_name: 'Customer A',
      contact_date: '2024-01-15',
      appointment_status: 'confirmed',
    });
    expect(result.valid_records[1]).toEqual({
      id: 2,
      customer_name: 'Customer B',
      contact_date: '2024-02-20',
      appointment_status: 'pending',
    });

    // 不正なレコードが正しく検出されたか検証
    expect(result.invalid_records[0]).toEqual({
      record_id: 3,
      customer_name: 'Customer C',
      field_name: 'contact_date',
      invalid_value: '15-01-2024',
      expected_format: 'YYYY-MM-DD',
      error_message: '日付フォーマットが正しくありません。YYYY-MM-DD形式で入力してください。',
      line_number: 4,
    });

    expect(result.invalid_records[1]).toEqual({
      record_id: 4,
      customer_name: 'Customer D',
      field_name: 'contact_date',
      invalid_value: '01/15/2024',
      expected_format: 'YYYY-MM-DD',
      error_message: '日付フォーマットが正しくありません。YYYY-MM-DD形式で入力してください。',
      line_number: 5,
    });

    expect(result.invalid_records[2]).toEqual({
      record_id: 5,
      customer_name: 'Customer E',
      field_name: 'contact_date',
      invalid_value: '2024年1月15日',
      expected_format: 'YYYY-MM-DD',
      error_message: '日付フォーマットが正しくありません。YYYY-MM-DD形式で入力してください。',
      line_number: 6,
    });

    expect(result.invalid_records[3]).toEqual({
      record_id: 6,
      customer_name: 'Customer F',
      field_name: 'contact_date',
      invalid_value: '2024/01/15',
      expected_format: 'YYYY-MM-DD',
      error_message: '日付フォーマットが正しくありません。YYYY-MM-DD形式で入力してください。',
      line_number: 7,
    });

    // エラーサマリーの検証
    expect(result.error_summary).toEqual({
      total_records: 6,
      valid_count: 2,
      invalid_count: 4,
      error_types: [
        { type: '日付フォーマット', count: 4 },
      ],
    });

    // インポート状態の検証
    expect(result.import_status).toBe('partial');
    expect(result.records_excluded_from_import).toBe(4);
  });
});