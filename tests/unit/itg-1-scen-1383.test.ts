import { extractAndAggregateInvoiceItems } from '../../src/logic/it-1-2-1';

describe('営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能', () => {
  // SCEN-1383: [edge] 請求対象項目自動抽出・集計機能 - 請求対象が0件または金額がゼロの場合の集計結果が正確に算出される
  test('請求対象が0件または金額ゼロの場合の集計結果が正確に算出される', () => {
    // ケース1: 請求対象項目が0件の場合
    const emptyInvoiceItems = [];
    const resultEmpty = extractAndAggregateInvoiceItems(emptyInvoiceItems);

    expect(resultEmpty.itemCount).toBe(0);
    expect(resultEmpty.totalAmount).toBe(0);
    expect(resultEmpty.errors).toEqual([]);
    expect(resultEmpty.isSuccess).toBe(true);

    // ケース2: 請求対象項目は存在するが全て金額ゼロの場合
    const zeroAmountInvoiceItems = [
      {
        customerId: 'CUST001',
        serviceType: 'SERVICE_A',
        quantity: 5,
        unitPrice: 0,
        amount: 0,
      },
      {
        customerId: 'CUST001',
        serviceType: 'SERVICE_B',
        quantity: 3,
        unitPrice: 0,
        amount: 0,
      },
      {
        customerId: 'CUST002',
        serviceType: 'SERVICE_A',
        quantity: 2,
        unitPrice: 0,
        amount: 0,
      },
    ];
    const resultZeroAmount = extractAndAggregateInvoiceItems(zeroAmountInvoiceItems);

    expect(resultZeroAmount.itemCount).toBe(3);
    expect(resultZeroAmount.totalAmount).toBe(0);
    expect(resultZeroAmount.errors).toEqual([]);
    expect(resultZeroAmount.isSuccess).toBe(true);

    // ケース1とケース2の比較検証
    const resultEmptyIsValidWhenNoItems = resultEmpty.itemCount === 0 && resultEmpty.totalAmount === 0;
    const resultZeroAmountIsValidWhenAllZero = resultZeroAmount.itemCount === 3 && resultZeroAmount.totalAmount === 0;

    expect(resultEmptyIsValidWhenNoItems).toBe(true);
    expect(resultZeroAmountIsValidWhenAllZero).toBe(true);

    // システムエラーが発生していないことを確認
    expect(resultEmpty.isSuccess).toBe(true);
    expect(resultZeroAmount.isSuccess).toBe(true);
  });
});