import { validateStandardFormatMapping } from '../../src/logic/it-1-br-1781935279444-1-2-1';

describe('月次サマリーテンプレートの標準フォーマット変換検証', () => {
  // SCEN-1145: [error] 標準フォーマット変換検証 - マッピング定義に存在しない営業データ項目が変換対象として指定された場合、マッピングエラーが検出される
  test('SCEN-1145: マッピング定義に存在しない営業データ項目を指定した場合、マッピングエラーが発生する', () => {
    // テストデータ: マッピング定義に存在しない項目を含む変換リクエスト
    const validMappingDefinition = {
      appointmentCount: { fieldName: 'appointment_count', dataType: 'integer', unit: '件' },
      contractCount: { fieldName: 'contract_count', dataType: 'integer', unit: '件' },
      customerResponse: { fieldName: 'customer_response', dataType: 'string', unit: 'category' },
    };

    const conversionRequest = {
      sourceFields: ['appointmentCount', 'contractCount', 'nonExistentField1', 'nonExistentField2'],
      targetTemplate: 'monthly_summary_v1',
      periodStartDate: '2024-01-01',
      periodEndDate: '2024-01-31',
    };

    // 期待結果: 存在しない項目（nonExistentField1, nonExistentField2）についてマッピングエラーが発生
    expect(() =>
      validateStandardFormatMapping({
        mappingDefinition: validMappingDefinition,
        conversionRequest: conversionRequest,
      })
    ).toThrow(/マッピング定義/);

    // エラーメッセージには該当項目名を含む
    try {
      validateStandardFormatMapping({
        mappingDefinition: validMappingDefinition,
        conversionRequest: conversionRequest,
      });
    } catch (error) {
      if (error instanceof Error) {
        expect(error.message).toMatch(/nonExistentField/);
      }
    }
  });

  // 境界値テスト: マッピング定義が空の場合、すべての項目がエラーになる
  test('SCEN-1145-BV1: マッピング定義が空の場合、すべての項目がマッピングエラーになる', () => {
    const emptyMappingDefinition = {};

    const conversionRequest = {
      sourceFields: ['appointmentCount', 'contractCount'],
      targetTemplate: 'monthly_summary_v1',
      periodStartDate: '2024-01-01',
      periodEndDate: '2024-01-31',
    };

    expect(() =>
      validateStandardFormatMapping({
        mappingDefinition: emptyMappingDefinition,
        conversionRequest: conversionRequest,
      })
    ).toThrow(/マッピング定義/);
  });

  // 成功ケース: すべての項目がマッピング定義に存在する場合、検証に成功する
  test('SCEN-1145-OK: すべての項目がマッピング定義に存在する場合、検証に成功する', () => {
    const validMappingDefinition = {
      appointmentCount: { fieldName: 'appointment_count', dataType: 'integer', unit: '件' },
      contractCount: { fieldName: 'contract_count', dataType: 'integer', unit: '件' },
      customerResponse: { fieldName: 'customer_response', dataType: 'string', unit: 'category' },
    };

    const conversionRequest = {
      sourceFields: ['appointmentCount', 'contractCount', 'customerResponse'],
      targetTemplate: 'monthly_summary_v1',
      periodStartDate: '2024-01-01',
      periodEndDate: '2024-01-31',
    };

    const result = validateStandardFormatMapping({
      mappingDefinition: validMappingDefinition,
      conversionRequest: conversionRequest,
    });

    expect(result).toEqual({
      isValid: true,
      errorCode: null,
      errorMessage: null,
      validatedFields: ['appointmentCount', 'contractCount', 'customerResponse'],
      totalFieldCount: 3,
      invalidFieldCount: 0,
    });
  });

  // 混合ケース: 有効な項目と無効な項目が混在する場合
  test('SCEN-1145-MIX: 有効な項目と無効な項目が混在する場合、無効な項目についてエラー情報を返す', () => {
    const validMappingDefinition = {
      appointmentCount: { fieldName: 'appointment_count', dataType: 'integer', unit: '件' },
      contractCount: { fieldName: 'contract_count', dataType: 'integer', unit: '件' },
    };

    const conversionRequest = {
      sourceFields: ['appointmentCount', 'invalidField1', 'contractCount', 'invalidField2'],
      targetTemplate: 'monthly_summary_v1',
      periodStartDate: '2024-01-01',
      periodEndDate: '2024-01-31',
    };

    try {
      validateStandardFormatMapping({
        mappingDefinition: validMappingDefinition,
        conversionRequest: conversionRequest,
      });
      fail('Should have thrown an error');
    } catch (error) {
      if (error instanceof Error) {
        expect(error.message).toMatch(/マッピング定義/);
        expect(error.message).toMatch(/invalidField/);
      }
    }
  });

  // エラーコード検証: マッピングエラーのエラーコードが正しく記録される
  test('SCEN-1145-EC: マッピングエラーのエラーコードが E001 として記録される', () => {
    const validMappingDefinition = {
      appointmentCount: { fieldName: 'appointment_count', dataType: 'integer', unit: '件' },
    };

    const conversionRequest = {
      sourceFields: ['appointmentCount', 'nonExistentField'],
      targetTemplate: 'monthly_summary_v1',
      periodStartDate: '2024-01-01',
      periodEndDate: '2024-01-31',
    };

    try {
      validateStandardFormatMapping({
        mappingDefinition: validMappingDefinition,
        conversionRequest: conversionRequest,
      });
      fail('Should have thrown an error');
    } catch (error) {
      if (error instanceof Error) {
        const errorDetails = JSON.parse(error.message);
        expect(errorDetails.errorCode).toBe('E001');
        expect(errorDetails.invalidFields).toContain('nonExistentField');
      }
    }
  });
});