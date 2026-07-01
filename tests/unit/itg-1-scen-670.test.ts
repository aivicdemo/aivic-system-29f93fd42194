import { validateSalesDataCompleteness } from '../../src/logic/it-1781935279444-2-2-1';

describe('営業データ品質自動検証 - 必須項目欠落検出', () => {
  // SCEN-670: [normal] 営業データ品質自動検証機能 - 営業データの必須項目欠落が検出されて通知される
  test('必須項目が欠落した営業データを検証すると欠落項目が識別され通知が送信される', () => {
    const incompleteSalesData = {
      customer_name: '',
      contact_date: '2024-01-15',
      amount: 50000,
      service_type: 'A',
      status: 'pending',
      contact_person: 'Tanaka'
    };

    const requiredFields = [
      'customer_name',
      'contact_date',
      'amount',
      'service_type'
    ];

    const validationResult = validateSalesDataCompleteness(
      incompleteSalesData,
      requiredFields
    );

    expect(validationResult.is_valid).toBe(false);
    expect(validationResult.missing_fields).toEqual(['customer_name']);
    expect(validationResult.missing_fields.length).toBe(1);
    expect(validationResult.error_details).toContain('customer_name');
    expect(validationResult.notification_sent).toBe(true);
    expect(validationResult.notification_recipient).toBe('system_admin');
    expect(validationResult.notification_content).toContain('customer_name');
    expect(validationResult.notification_timestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/
    );
  });
});