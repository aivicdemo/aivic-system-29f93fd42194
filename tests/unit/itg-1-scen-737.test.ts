import { validateSalesData } from '../../src/logic/it-1781935279444-2-1-1';

describe('営業データ入力時の品質検証ルール定義・実行機能', () => {
  // SCEN-737: [edge] 営業データ自動検証ルール実行 - 空文字列・NULL値・ゼロ値などの境界値が検証ルールで正しく判定される
  test('should correctly validate boundary values (empty string, null, zero, empty array, false) and distinguish them with appropriate error codes', () => {
    // 準備: 境界値を含むテストデータセット
    const testDataset = {
      customerName: '',              // 空文字列 - 必須項目チェックで検出
      salesAmount: null,             // NULL値 - 必須項目チェックで検出
      transactionCount: 0,           // ゼロ値 - 有効な数値として処理
      tags: [],                      // 空配列 - 処理対象の境界値
      isActive: false                // false値 - 有効なブール値として処理
    };

    // 検証ルール実行
    const result = validateSalesData(testDataset);

    // 期待結果の検証
    // 1. 空文字列はNULL値と区別して検出される
    expect(result.errors).toEqual(expect.arrayContaining([
      expect.objectContaining({
        field: 'customerName',
        errorCode: 'EMPTY_STRING',
        severity: 'error',
        message: expect.stringContaining('顧客名')
      })
    ]));

    // 2. NULL値は空文字列と異なるエラーコードで報告される
    expect(result.errors).toEqual(expect.arrayContaining([
      expect.objectContaining({
        field: 'salesAmount',
        errorCode: 'NULL_VALUE',
        severity: 'error',
        message: expect.stringContaining('売上金額')
      })
    ]));

    // 3. ゼロ値は有効な数値として正しく判定され、エラーにはならない
    const zeroValueError = result.errors.find((err: any) => err.field === 'transactionCount');
    expect(zeroValueError).toBeUndefined();

    // 4. 検証結果のサマリー確認
    expect(result.validationSummary).toEqual({
      totalFields: 5,
      passedFields: 2,  // transactionCount(0), isActive(false)
      failedFields: 2,  // customerName(''), salesAmount(null)
      warningFields: 1  // tags([])
    });

    // 5. エラーハンドリングが適切に機能している
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(2);

    // 6. すべての検証結果がシステムログに正確に記録されている
    expect(result.logEntries).toEqual(expect.arrayContaining([
      expect.objectContaining({
        timestamp: expect.any(String),
        ruleName: '必須項目チェック',
        targetField: 'customerName',
        result: 'FAILED',
        errorCode: 'EMPTY_STRING'
      }),
      expect.objectContaining({
        timestamp: expect.any(String),
        ruleName: '必須項目チェック',
        targetField: 'salesAmount',
        result: 'FAILED',
        errorCode: 'NULL_VALUE'
      }),
      expect.objectContaining({
        timestamp: expect.any(String),
        ruleName: 'データ型チェック',
        targetField: 'transactionCount',
        result: 'PASSED',
        value: 0
      }),
      expect.objectContaining({
        timestamp: expect.any(String),
        ruleName: 'データ型チェック',
        targetField: 'isActive',
        result: 'PASSED',
        value: false
      })
    ]));

    // 7. 詳細なエラー情報が記録されている
    expect(result.errors[0]).toEqual(expect.objectContaining({
      field: expect.any(String),
      errorCode: expect.any(String),
      severity: expect.stringMatching(/^(error|warning)$/),
      message: expect.any(String),
      ruleApplied: expect.any(String),
      timestamp: expect.any(String)
    }));

    // 8. ゼロ値は有効なデータとして値欠損ではないことを確認
    expect(result.validData).toEqual(expect.objectContaining({
      transactionCount: 0,
      isActive: false
    }));
  });
});