import { validateUnifiedFormatConversion } from '../../src/logic/it-1';

describe("入出庫データ統一フォーマット変換機能", () => {
  test("変換後データの整合性と完全性が確保される", () => {
    // SCEN-428
    
    // テスト用の入庫・出庫データを準備
    const rawInputData = [
      // 入庫データ（ハンディスキャナ）
      {
        method: 'scanner' as const,
        departmentId: 'DEPT-001',
        itemCode: 'ITEM-A001',
        quantity: 100,
        timestamp: '2024-01-15T10:00:00Z',
        operatorId: 'OP-001'
      },
      {
        method: 'scanner' as const,
        departmentId: 'DEPT-001',
        itemCode: 'ITEM-B002',
        quantity: 50,
        timestamp: '2024-01-15T11:00:00Z',
        operatorId: 'OP-002'
      },
      // 出庫データ（手入力）
      {
        method: 'manual' as const,
        departmentId: 'DEPT-002',
        itemCode: 'ITEM-C003',
        quantity: 25,
        timestamp: '2024-01-15T12:00:00Z',
        operatorId: 'OP-003'
      },
      {
        method: 'manual' as const,
        departmentId: 'DEPT-002',
        itemCode: 'ITEM-D004',
        quantity: 75,
        timestamp: '2024-01-15T13:00:00Z',
        operatorId: 'OP-004'
      }
    ];

    // 部署別の変換ルール設定
    const conversionRules = [
      {
        departmentId: 'DEPT-001',
        inputMethod: 'scanner',
        fieldMapping: {
          itemCode: 'itemCode',
          quantity: 'quantity',
          transactionType: 'inbound',
          timestamp: 'timestamp',
          operatorId: 'operatorId'
        }
      },
      {
        departmentId: 'DEPT-002',
        inputMethod: 'manual',
        fieldMapping: {
          itemCode: 'itemCode',
          quantity: 'quantity',
          transactionType: 'outbound',
          timestamp: 'timestamp',
          operatorId: 'operatorId'
        }
      }
    ];

    // 入出庫データ統一フォーマット変換機能を実行
    const result = validateUnifiedFormatConversion(rawInputData, conversionRules);

    // 変換前のデータ件数と変換後のデータ件数を比較
    expect(result.convertedData).toHaveLength(4);
    expect(result.convertedData.length).toBe(rawInputData.length);

    // 変換前後で品目コード、数量、日時の値が一致することを検証
    expect(result.convertedData[0]).toEqual({
      itemCode: 'ITEM-A001',
      quantity: 100,
      transactionType: 'inbound',
      timestamp: '2024-01-15T10:00:00Z',
      departmentId: 'DEPT-001',
      operatorId: 'OP-001'
    });

    expect(result.convertedData[1]).toEqual({
      itemCode: 'ITEM-B002',
      quantity: 50,
      transactionType: 'inbound',
      timestamp: '2024-01-15T11:00:00Z',
      departmentId: 'DEPT-001',
      operatorId: 'OP-002'
    });

    expect(result.convertedData[2]).toEqual({
      itemCode: 'ITEM-C003',
      quantity: 25,
      transactionType: 'outbound',
      timestamp: '2024-01-15T12:00:00Z',
      departmentId: 'DEPT-002',
      operatorId: 'OP-003'
    });

    expect(result.convertedData[3]).toEqual({
      itemCode: 'ITEM-D004',
      quantity: 75,
      transactionType: 'outbound',
      timestamp: '2024-01-15T13:00:00Z',
      departmentId: 'DEPT-002',
      operatorId: 'OP-004'
    });

    // 統一フォーマットの必須項目がすべて設定されていることを確認
    result.convertedData.forEach(item => {
      expect(item.itemCode).toBeDefined();
      expect(item.quantity).toBeDefined();
      expect(item.transactionType).toBeDefined();
      expect(item.timestamp).toBeDefined();
      expect(item.departmentId).toBeDefined();
      expect(item.operatorId).toBeDefined();
    });

    // データ型が統一フォーマットの仕様通りに変換されていることを検証
    result.convertedData.forEach(item => {
      expect(typeof item.itemCode).toBe('string');
      expect(typeof item.quantity).toBe('number');
      expect(typeof item.transactionType).toBe('string');
      expect(typeof item.timestamp).toBe('string');
      expect(typeof item.departmentId).toBe('string');
      expect(typeof item.operatorId).toBe('string');
    });

    // 変換処理中にデータの欠損や重複が発生していないことを確認
    expect(result.isValid).toBe(true);
    expect(result.validationErrors).toEqual([]);

    // 品目コードの一意性確認（重複検証）
    const itemCodes = result.convertedData.map(item => item.itemCode);
    const uniqueItemCodes = [...new Set(itemCodes)];
    expect(itemCodes.length).toBe(uniqueItemCodes.length);
  });
});