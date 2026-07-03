import { validateSalesData } from '../../src/logic/it-1781935279444-2-2-1';

describe('営業データの完全性・正確性を自動検証', () => {
  // SCEN-953: [edge] 営業成果データの自動検証 - アポ数が0件の場合も有効なデータとして検証を完了できる
  test('アポ数が0件の営業成果レコードは有効なデータとして検証完了する', () => {
    const sales_data = {
      sales_person_id: 'SP001',
      period_start: new Date('2024-01-15'),
      period_end: new Date('2024-01-31'),
      appointment_count: 0,
      visit_count: 5,
      contract_count: 2,
      customer_feedback: '良好',
      service_type: 'premium',
    };

    const result = validateSalesData(sales_data);

    expect(result.is_valid).toBe(true);
    expect(result.status).toBe('approved');
    expect(result.errors).toEqual([]);
    expect(result.validation_log).toContain('検証完了');
  });
});