import { validateSalesData } from '../../src/logic/it-1781935279444-2-2-1';

describe('営業データ品質自動検証・通知機能', () => {
  // SCEN-684
  test('検出されたエラーデータがリスト化され、補正が必要なデータとして通知される', () => {
    const test_sales_data = [
      {
        id: 1,
        customer_name: 'ABC株式会社',
        contact_date: '2024-01-15',
        activity_type: 'appointment',
        appointment_confirmed: true,
        deal_amount: 500000,
      },
      {
        id: 2,
        customer_name: '',
        contact_date: '2024-01-16',
        activity_type: 'inquiry',
        appointment_confirmed: false,
        deal_amount: 250000,
      },
      {
        id: 3,
        customer_name: 'XYZ企業',
        contact_date: 'invalid-date',
        activity_type: 'contract',
        appointment_confirmed: true,
        deal_amount: 1000000,
      },
      {
        id: 4,
        customer_name: 'DEF有限会社',
        contact_date: '2024-01-18',
        activity_type: 'contact',
        appointment_confirmed: true,
        deal_amount: -100000,
      },
      {
        id: 5,
        customer_name: 'GHI株式会社',
        contact_date: '2024-01-19',
        activity_type: 'meeting',
        appointment_confirmed: false,
        deal_amount: 750000,
      },
    ];

    const validation_result = validateSalesData(test_sales_data);

    expect(validation_result).toEqual(
      expect.objectContaining({
        is_valid: false,
        total_records: 5,
        valid_records: 2,
        error_records: 3,
        errors: expect.arrayContaining([
          expect.objectContaining({
            record_id: 2,
            error_type: '必須項目欠落',
            error_field: 'customer_name',
            error_message: expect.stringContaining('顧客名'),
            correction_required: true,
          }),
          expect.objectContaining({
            record_id: 3,
            error_type: 'データ型不整合',
            error_field: 'contact_date',
            error_message: expect.stringContaining('日付'),
            correction_required: true,
          }),
          expect.objectContaining({
            record_id: 4,
            error_type: '値の範囲外',
            error_field: 'deal_amount',
            error_message: expect.stringContaining('金額'),
            correction_required: true,
          }),
        ]),
      })
    );

    expect(validation_result.errors.length).toBe(3);
    expect(validation_result.valid_records).toBe(2);

    const error_ids = validation_result.errors.map(
      (err: { record_id: number }) => err.record_id
    );
    expect(error_ids.sort()).toEqual([2, 3, 4]);

    const notification_content = {
      notification_type: 'validation_error',
      recipient: 'operator@example.com',
      subject: '営業データ検証エラー通知',
      error_count: 3,
      error_list: validation_result.errors,
      correction_instructions: expect.any(String),
      timestamp: expect.any(String),
    };

    expect(notification_content.error_count).toBe(3);
    expect(notification_content.error_list.length).toBe(3);
    expect(
      notification_content.error_list.every(
        (err: { correction_required: boolean }) => err.correction_required
      )
    ).toBe(true);

    expect(validation_result.notification_sent).toBe(true);
    expect(validation_result.notification_timestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
    );
  });
});