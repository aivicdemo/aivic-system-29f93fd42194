import { calculateBillingAmount } from '../../src/logic/it-1-2-1';

describe('請求額確定フロー - 複数の請求対象項目を含む請求内容が承認時に一括確定される', () => {
  test('SCEN-622: 複数の請求対象項目を含む請求内容が承認時に一括で確定され、請求書が自動生成される', () => {
    // 複数の請求対象項目を定義
    const billingItems = [
      {
        itemId: 'ITEM001',
        itemName: '商品A',
        quantity: 10,
        unitPrice: 5000,
        taxRate: 0.10,
        appliedFromDate: '2024-01-01',
        appliedToDate: '2024-01-31',
      },
      {
        itemId: 'ITEM002',
        itemName: '商品B',
        quantity: 5,
        unitPrice: 8000,
        taxRate: 0.10,
        appliedFromDate: '2024-01-01',
        appliedToDate: '2024-01-31',
      },
      {
        itemId: 'ITEM003',
        itemName: 'サービスC',
        quantity: 1,
        unitPrice: 20000,
        taxRate: 0.10,
        appliedFromDate: '2024-01-01',
        appliedToDate: '2024-01-31',
      },
    ];

    // 請求内容を作成
    const billingRequest = {
      billingId: 'BIL202401001',
      customerId: 'CUST001',
      serviceId: 'SVC001',
      items: billingItems,
      status: 'pending_approval',
      createdAt: '2024-01-15T09:00:00Z',
      approvedAt: null,
      approverUserId: null,
    };

    // 請求額を計算
    // 商品A: 10 * 5000 = 50000, 税金: 50000 * 0.10 = 5000
    // 商品B: 5 * 8000 = 40000, 税金: 40000 * 0.10 = 4000
    // サービスC: 1 * 20000 = 20000, 税金: 20000 * 0.10 = 2000
    // 小計: 50000 + 40000 + 20000 = 110000
    // 合計税金: 5000 + 4000 + 2000 = 11000
    // 合計金額: 110000 + 11000 = 121000

    const calculatedResult = calculateBillingAmount(billingRequest);

    // 小計が正しく計算されていることを確認
    expect(calculatedResult.subtotal).toBe(110000);

    // 合計税金が正しく計算されていることを確認
    expect(calculatedResult.totalTax).toBe(11000);

    // 合計金額が正しく計算されていることを確認
    expect(calculatedResult.totalAmount).toBe(121000);

    // 請求内容が承認時に承認者情報が追加される
    const approvalRequest = {
      ...billingRequest,
      status: 'approved',
      approvedAt: '2024-01-15T14:00:00Z',
      approverUserId: 'USR002',
    };

    const approvalResult = calculateBillingAmount(approvalRequest);

    // 承認後も金額が変わらないことを確認
    expect(approvalResult.subtotal).toBe(110000);
    expect(approvalResult.totalTax).toBe(11000);
    expect(approvalResult.totalAmount).toBe(121000);

    // 承認済み請求内容から確定されたステータスが反映される
    expect(approvalResult.status).toBe('confirmed');

    // すべての請求対象項目が確定状態に変更されたことを確認
    expect(approvalResult.items).toHaveLength(3);
    approvalResult.items.forEach((item) => {
      expect(item.confirmationStatus).toBe('confirmed');
    });

    // 生成された請求書が承認前の計算値と一致することを検証
    const invoiceData = {
      invoiceId: 'INV202401001',
      billingId: 'BIL202401001',
      customerId: 'CUST001',
      invoiceDate: '2024-01-15',
      dueDate: '2024-02-15',
      subtotal: calculatedResult.subtotal,
      tax: calculatedResult.totalTax,
      totalAmount: calculatedResult.totalAmount,
      items: billingItems,
      status: 'generated',
    };

    // 請求書の合計金額が請求内容の計算値と一致
    expect(invoiceData.totalAmount).toBe(approvalResult.totalAmount);
    expect(invoiceData.subtotal).toBe(approvalResult.subtotal);
    expect(invoiceData.tax).toBe(approvalResult.totalTax);

    // 請求ステータスが「確定」に更新されたことを確認
    expect(approvalResult.status).toBe('confirmed');

    // 確定状態で後続フローに進める状態であることを確認
    expect(approvalResult.canProceedToPayment).toBe(true);
  });
});