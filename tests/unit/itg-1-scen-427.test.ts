import { validateUnifiedFormatConversion } from '../../src/logic/it-1';

describe('入出庫データ統一フォーマット変換機能', () => {
  // SCEN-427
  test('ハンディスキャナと手入力データが統一フォーマットに正しく変換される', () => {
    const rawInputData = [
      {
        method: 'scanner' as const,
        departmentId: 'DEPT001',
        itemCode: 'ITEM001',
        quantity: 100,
        timestamp: '2024-01-15T10:00:00',
        operatorId: 'USER001'
      },
      {
        method: 'manual' as const,
        departmentId: 'DEPT001', 
        itemCode: 'ITEM002',
        quantity: 50,
        timestamp: '2024-01-15T11:00:00',
        operatorId: 'USER002'
      }
    ];

    const conversionRules = [
      {
        departmentId: 'DEPT001',
        inputMethod: 'scanner',
        fieldMapping: {
          itemCode: 'itemCode',
          quantity: 'quantity',
          timestamp: 'timestamp',
          operatorId: 'operatorId'
        }
      },
      {
        departmentId: 'DEPT001',
        inputMethod: 'manual',
        fieldMapping: {
          itemCode: 'itemCode',
          quantity: 'quantity', 
          timestamp: 'timestamp',
          operatorId: 'operatorId'
        }
      }
    ];

    const result = validateUnifiedFormatConversion(rawInputData, conversionRules);

    expect(result.isValid).toBe(true);
    expect(result.convertedData).toHaveLength(2);
    expect(result.validationErrors).toHaveLength(0);
    
    expect(result.convertedData[0]).toEqual({
      itemCode: 'ITEM001',
      quantity: 100,
      transactionType: 'inbound',
      timestamp: '2024-01-15T10:00:00',
      departmentId: 'DEPT001',
      operatorId: 'USER001'
    });
    
    expect(result.convertedData[1]).toEqual({
      itemCode: 'ITEM002', 
      quantity: 50,
      transactionType: 'outbound',
      timestamp: '2024-01-15T11:00:00',
      departmentId: 'DEPT001',
      operatorId: 'USER002'
    });
  });
});