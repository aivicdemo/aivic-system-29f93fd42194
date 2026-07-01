import { validateSalesDataSchema } from '../../src/logic/it-1781935279444-2-2-1';

describe('営業データ品質検証・異常検出 - データ型不一致検出', () => {
  // SCEN-604
  test('数値型フィールドに文字列が入力された場合、データ型不一致エラーが正常に検出される', () => {
    const schema = {
      salesAmount: { type: 'number', fieldName: '売上金額' },
      quantity: { type: 'number', fieldName: '数量' },
      customerName: { type: 'string', fieldName: '顧客名' },
    };

    const testDataWithStringInNumericField = {
      salesAmount: 'ABC',
      quantity: 5,
      customerName: '株式会社A',
    };

    expect(() => validateSalesDataSchema(schema, testDataWithStringInNumericField)).toThrow(
      /データ型/
    );
  });

  test('複数の数値型フィールドに文字列が入力された場合、最初のエラーが検出される', () => {
    const schema = {
      salesAmount: { type: 'number', fieldName: '売上金額' },
      quantity: { type: 'number', fieldName: '数量' },
      rate: { type: 'number', fieldName: '成約率' },
      customerName: { type: 'string', fieldName: '顧客名' },
    };

    const testDataWithMultipleStringFields = {
      salesAmount: '12,345',
      quantity: '10',
      rate: 0.8,
      customerName: '株式会社B',
    };

    expect(() => validateSalesDataSchema(schema, testDataWithMultipleStringFields)).toThrow(
      /売上金額/
    );
  });

  test('正しいデータ型で入力された場合、検証は合格する', () => {
    const schema = {
      salesAmount: { type: 'number', fieldName: '売上金額' },
      quantity: { type: 'number', fieldName: '数量' },
      customerName: { type: 'string', fieldName: '顧客名' },
    };

    const validTestData = {
      salesAmount: 150000,
      quantity: 10,
      customerName: '株式会社C',
    };

    const result = validateSalesDataSchema(schema, validTestData);
    expect(result).toEqual({ valid: true, errors: [] });
  });

  test('数値フィールドにnullが入力された場合、データ型不一致エラーが検出される', () => {
    const schema = {
      salesAmount: { type: 'number', fieldName: '売上金額' },
      quantity: { type: 'number', fieldName: '数量' },
    };

    const testDataWithNull = {
      salesAmount: null,
      quantity: 5,
    };

    expect(() => validateSalesDataSchema(schema, testDataWithNull)).toThrow(/売上金額/);
  });

  test('数値フィールドに配列が入力された場合、データ型不一致エラーが検出される', () => {
    const schema = {
      salesAmount: { type: 'number', fieldName: '売上金額' },
      quantity: { type: 'number', fieldName: '数量' },
    };

    const testDataWithArray = {
      salesAmount: [1000, 2000],
      quantity: 5,
    };

    expect(() => validateSalesDataSchema(schema, testDataWithArray)).toThrow(/売上金額/);
  });

  test('文字列フィールドに数値が入力された場合、データ型不一致エラーが検出される', () => {
    const schema = {
      customerName: { type: 'string', fieldName: '顧客名' },
      salesAmount: { type: 'number', fieldName: '売上金額' },
    };

    const testDataWithNumberInStringField = {
      customerName: 12345,
      salesAmount: 100000,
    };

    expect(() => validateSalesDataSchema(schema, testDataWithNumberInStringField)).toThrow(
      /顧客名/
    );
  });

  test('エラーメッセージに期待される型と実際の型が含まれる', () => {
    const schema = {
      salesAmount: { type: 'number', fieldName: '売上金額' },
    };

    const testDataWithWrongType = {
      salesAmount: 'invalid_amount',
    };

    expect(() => validateSalesDataSchema(schema, testDataWithWrongType)).toThrow(/number/);
  });
});