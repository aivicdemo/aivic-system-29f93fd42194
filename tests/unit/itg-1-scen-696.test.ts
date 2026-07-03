import { validateSalesData } from '../../src/logic/it-1781935279444-2-2-1';

describe('営業データの完全性・正確性自動検証', () => {
  // SCEN-696
  test('商談内容フィールドが空文字列の場合に欠落として検出される', () => {
    const salesDataWithEmptyDescription = {
      customer_name: 'テスト顧客A',
      contact_date: '2024-01-15',
      business_description: '',
      appointment_status: 'confirmed',
      service_type: 'standard',
    };

    const result = validateSalesData(salesDataWithEmptyDescription);

    expect(result.is_valid).toBe(false);
    expect(result.status).toBe('検証失敗');
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'business_description',
          error_type: '欠落',
          message: '商談内容：欠落',
        }),
      ])
    );
    expect(result.data_quality_status).toBe('データ品質問題あり');
  });
});