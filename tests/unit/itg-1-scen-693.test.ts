import { validateSalesDataCompleteness } from '../../src/logic/it-1781935279444-2-2-1';

describe('営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能', () => {
  test('SCEN-693: [normal] 営業データ完全性検証機能 - 保存済みの営業データにおいて必須項目がすべて入力されている場合に完全性チェックが合格する', () => {
    // テストデータ: すべての必須項目が入力された営業データ
    const salesData = {
      customerId: 'CUST-001',
      contactDate: '2024-01-15',
      contactTime: '10:30',
      outcome: '提案資料配布',
      appointmentStatus: '確定',
      appointmentDate: '2024-01-20',
      serviceType: 'コンサルティング',
      amount: 150000,
      notes: '顧客が興味を示した',
      staffId: 'STAFF-001',
      recordedAt: '2024-01-15T11:00:00Z'
    };

    // 完全性チェック機能を実行
    const result = validateSalesDataCompleteness(salesData);

    // 期待結果: 完全性チェックが合格
    expect(result.status).toBe('合格');
    expect(result.isComplete).toBe(true);
    expect(result.missingFields).toEqual([]);
    expect(result.errorMessage).toBeNull();
    expect(result.validationDetails.customerIdPresent).toBe(true);
    expect(result.validationDetails.contactDatePresent).toBe(true);
    expect(result.validationDetails.outcomePresent).toBe(true);
    expect(result.validationDetails.appointmentStatusPresent).toBe(true);
    expect(result.validationDetails.serviceTypePresent).toBe(true);
    expect(result.validationDetails.amountPresent).toBe(true);
  });
});