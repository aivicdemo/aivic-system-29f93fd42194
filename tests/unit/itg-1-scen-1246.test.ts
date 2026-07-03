import { validateSalesDataCompleteness } from '../../src/logic/it-1781935279444-2-2-1';

describe('営業データの完全性・正確性検証', () => {
  // SCEN-1246: [error] 月次営業データの完全性・正確性検証機能 - 必須項目が欠落している場合、検証エラーと欠落項目情報を検出・通知する
  test('必須項目が欠落している場合、検証エラーと欠落項目情報を検出・通知する', () => {
    const testDataWithMissingFields = [
      {
        rowNumber: 1,
        customerId: 'CUST001',
        salesAmount: undefined,
        salesDate: '2024-01-15',
        salesPersonId: 'SALES001'
      },
      {
        rowNumber: 2,
        customerId: undefined,
        salesAmount: 150000,
        salesDate: '2024-01-16',
        salesPersonId: 'SALES002'
      },
      {
        rowNumber: 3,
        customerId: 'CUST003',
        salesAmount: 200000,
        salesDate: undefined,
        salesPersonId: 'SALES003'
      },
      {
        rowNumber: 4,
        customerId: 'CUST004',
        salesAmount: 100000,
        salesDate: '2024-01-18',
        salesPersonId: undefined
      }
    ];

    const validationResult = validateSalesDataCompleteness(testDataWithMissingFields);

    expect(validationResult.isValid).toBe(false);
    expect(validationResult.errorCount).toBe(4);
    
    expect(validationResult.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          rowNumber: 1,
          missingFields: ['salesAmount'],
          message: expect.stringMatching(/salesAmount/)
        }),
        expect.objectContaining({
          rowNumber: 2,
          missingFields: ['customerId'],
          message: expect.stringMatching(/customerId/)
        }),
        expect.objectContaining({
          rowNumber: 3,
          missingFields: ['salesDate'],
          message: expect.stringMatching(/salesDate/)
        }),
        expect.objectContaining({
          rowNumber: 4,
          missingFields: ['salesPersonId'],
          message: expect.stringMatching(/salesPersonId/)
        })
      ])
    );

    expect(validationResult.errors.length).toBe(4);
    
    validationResult.errors.forEach((error: any) => {
      expect(error.rowNumber).toBeGreaterThanOrEqual(1);
      expect(error.rowNumber).toBeLessThanOrEqual(4);
      expect(Array.isArray(error.missingFields)).toBe(true);
      expect(error.missingFields.length).toBeGreaterThan(0);
      expect(typeof error.message).toBe('string');
      expect(error.message.length).toBeGreaterThan(0);
    });

    expect(validationResult.notification).toBeDefined();
    expect(validationResult.notification.status).toBe('error');
    expect(validationResult.notification.message).toMatch(/欠落/);
    expect(validationResult.notification.affectedRows).toEqual([1, 2, 3, 4]);
    expect(validationResult.notification.timestamp).toBeDefined();
  });
});