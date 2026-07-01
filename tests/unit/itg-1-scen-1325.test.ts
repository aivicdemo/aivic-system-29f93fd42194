import { extractAndAggregateBillingItems } from '../../src/logic/it-1-2-1';

describe('営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能', () => {
  // SCEN-1325
  test('マッピング定義が不正な場合、請求額集計処理がエラーとなる', () => {
    // 準備: 営業データ
    const salesData = [
      {
        customerId: 'CUST001',
        serviceCode: 'SVC_A',
        appointmentCount: 10,
        contractAmount: 100000,
        processDate: '2024-01-15',
      },
      {
        customerId: 'CUST001',
        serviceCode: 'SVC_B',
        appointmentCount: 5,
        contractAmount: 50000,
        processDate: '2024-01-15',
      },
    ];

    // ケース 1: 必須フィールド (customerId) が欠落したマッピング定義
    const invalidMappingMissingField = [
      {
        // customerId フィールドが欠落
        serviceCode: 'SVC_A',
        billingItemCode: 'BILL_APT',
        sourceField: 'appointmentCount',
        unitPrice: 5000,
      },
    ];

    expect(() =>
      extractAndAggregateBillingItems(salesData, invalidMappingMissingField)
    ).toThrow(/customerId/);

    // ケース 2: 必須フィールド (serviceCode) が null のマッピング定義
    const invalidMappingNullField = [
      {
        customerId: 'CUST001',
        serviceCode: null,
        billingItemCode: 'BILL_APT',
        sourceField: 'appointmentCount',
        unitPrice: 5000,
      },
    ];

    expect(() =>
      extractAndAggregateBillingItems(salesData, invalidMappingNullField)
    ).toThrow(/serviceCode/);

    // ケース 3: 必須フィールド (unitPrice) が不正な型 (文字列) のマッピング定義
    const invalidMappingInvalidType = [
      {
        customerId: 'CUST001',
        serviceCode: 'SVC_A',
        billingItemCode: 'BILL_APT',
        sourceField: 'appointmentCount',
        unitPrice: 'not_a_number',
      },
    ];

    expect(() =>
      extractAndAggregateBillingItems(salesData, invalidMappingInvalidType)
    ).toThrow(/unitPrice/);

    // ケース 4: 必須フィールド (sourceField) が欠落したマッピング定義
    const invalidMappingMissingSourceField = [
      {
        customerId: 'CUST001',
        serviceCode: 'SVC_A',
        billingItemCode: 'BILL_APT',
        // sourceField が欠落
        unitPrice: 5000,
      },
    ];

    expect(() =>
      extractAndAggregateBillingItems(
        salesData,
        invalidMappingMissingSourceField
      )
    ).toThrow(/sourceField/);

    // ケース 5: 必須フィールド (billingItemCode) が空文字列のマッピング定義
    const invalidMappingEmptyBillingCode = [
      {
        customerId: 'CUST001',
        serviceCode: 'SVC_A',
        billingItemCode: '',
        sourceField: 'appointmentCount',
        unitPrice: 5000,
      },
    ];

    expect(() =>
      extractAndAggregateBillingItems(
        salesData,
        invalidMappingEmptyBillingCode
      )
    ).toThrow(/billingItemCode/);

    // ケース 6: マッピング配列が空の場合
    const emptyMapping: never[] = [];

    expect(() =>
      extractAndAggregateBillingItems(salesData, emptyMapping)
    ).toThrow(/マッピング定義/);

    // ケース 7: マッピング配列が null の場合
    expect(() => extractAndAggregateBillingItems(salesData, null as any)).toThrow(
      /マッピング定義/
    );

    // ケース 8: マッピング定義内の sourceField が存在しないカラム名の場合
    const invalidMappingNonExistentField = [
      {
        customerId: 'CUST001',
        serviceCode: 'SVC_A',
        billingItemCode: 'BILL_APT',
        sourceField: 'nonExistentColumn',
        unitPrice: 5000,
      },
    ];

    expect(() =>
      extractAndAggregateBillingItems(
        salesData,
        invalidMappingNonExistentField
      )
    ).toThrow(/sourceField/);

    // ケース 9: unitPrice が負の数値のマッピング定義
    const invalidMappingNegativePrice = [
      {
        customerId: 'CUST001',
        serviceCode: 'SVC_A',
        billingItemCode: 'BILL_APT',
        sourceField: 'appointmentCount',
        unitPrice: -5000,
      },
    ];

    expect(() =>
      extractAndAggregateBillingItems(salesData, invalidMappingNegativePrice)
    ).toThrow(/unitPrice/);

    // ケース 10: マッピング定義が不正な形式 (オブジェクトではなく文字列) の場合
    const invalidMappingWrongFormat = 'not_an_object' as any;

    expect(() =>
      extractAndAggregateBillingItems(salesData, invalidMappingWrongFormat)
    ).toThrow(/マッピング定義/);
  });
});