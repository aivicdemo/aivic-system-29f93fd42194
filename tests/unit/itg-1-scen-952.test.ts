import { validateSalesData } from '../../src/logic/it-1781935279444-2-2-1';

describe('営業成果データの自動検証', () => {
  // SCEN-952: [normal] 営業成果データの自動検証 - 必須項目の欠落・データ型の不整合・異常値をすべて検出して検証結果に記録できる
  test('必須項目欠落、データ型不整合、異常値をすべて検出し検証結果に記録する', () => {
    const testDataset = [
      {
        rowNumber: 1,
        salesPersonId: 'SP001',
        salesAmount: 100000,
        transactionDate: '2024-01-15',
        customerName: 'Customer A',
        serviceType: 'Service 1',
        status: 'Confirmed'
      },
      {
        rowNumber: 2,
        salesPersonId: undefined,
        salesAmount: 50000,
        transactionDate: '2024-01-16',
        customerName: 'Customer B',
        serviceType: 'Service 2',
        status: 'Confirmed'
      },
      {
        rowNumber: 3,
        salesPersonId: 'SP003',
        salesAmount: '75000',
        transactionDate: '2024-01-17',
        customerName: 'Customer C',
        serviceType: 'Service 1',
        status: 'Confirmed'
      },
      {
        rowNumber: 4,
        salesPersonId: 'SP004',
        salesAmount: -30000,
        transactionDate: '2024-01-18',
        customerName: 'Customer D',
        serviceType: 'Service 3',
        status: 'Confirmed'
      },
      {
        rowNumber: 5,
        salesPersonId: 'SP005',
        salesAmount: 120000,
        transactionDate: '2099-12-31',
        customerName: 'Customer E',
        serviceType: 'Service 2',
        status: 'Confirmed'
      },
      {
        rowNumber: 6,
        salesPersonId: 'SP006',
        salesAmount: 80000,
        transactionDate: '2024-01-20',
        customerName: 'Customer F',
        serviceType: 'Service 1',
        status: 'Confirmed'
      }
    ];

    const result = validateSalesData(testDataset);

    expect(result.overallStatus).toBe('FAILED');
    expect(result.totalRecords).toBe(6);
    expect(result.validRecords).toBe(2);
    expect(result.invalidRecords).toBe(4);

    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          rowNumber: 2,
          errorType: 'MISSING_REQUIRED_FIELD',
          fieldName: 'salesPersonId',
          message: expect.stringContaining('salesPersonId')
        }),
        expect.objectContaining({
          rowNumber: 3,
          errorType: 'TYPE_MISMATCH',
          fieldName: 'salesAmount',
          message: expect.stringContaining('salesAmount')
        }),
        expect.objectContaining({
          rowNumber: 4,
          errorType: 'INVALID_VALUE',
          fieldName: 'salesAmount',
          message: expect.stringContaining('salesAmount')
        }),
        expect.objectContaining({
          rowNumber: 5,
          errorType: 'INVALID_VALUE',
          fieldName: 'transactionDate',
          message: expect.stringContaining('transactionDate')
        })
      ])
    );

    const row1Error = result.errors.find((e) => e.rowNumber === 1);
    expect(row1Error).toBeUndefined();

    const row6Error = result.errors.find((e) => e.rowNumber === 6);
    expect(row6Error).toBeUndefined();

    expect(result.errors.length).toBe(4);

    result.errors.forEach((error) => {
      expect(error).toHaveProperty('rowNumber');
      expect(error).toHaveProperty('errorType');
      expect(error).toHaveProperty('fieldName');
      expect(error).toHaveProperty('message');
    });

    const missingFieldErrors = result.errors.filter(
      (e) => e.errorType === 'MISSING_REQUIRED_FIELD'
    );
    expect(missingFieldErrors.length).toBe(1);
    expect(missingFieldErrors[0].rowNumber).toBe(2);

    const typeMismatchErrors = result.errors.filter(
      (e) => e.errorType === 'TYPE_MISMATCH'
    );
    expect(typeMismatchErrors.length).toBe(1);
    expect(typeMismatchErrors[0].rowNumber).toBe(3);

    const invalidValueErrors = result.errors.filter(
      (e) => e.errorType === 'INVALID_VALUE'
    );
    expect(invalidValueErrors.length).toBe(2);
    expect(invalidValueErrors.map((e) => e.rowNumber)).toEqual(
      expect.arrayContaining([4, 5])
    );
  });
});