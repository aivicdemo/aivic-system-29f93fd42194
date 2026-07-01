import { extractBillingTargetItems, aggregateBillingAmountByCustomer } from '../../src/logic/it-1781935279444-1-1-1';

describe('営業データ項目のメタデータ管理機能 - 請求対象項目抽出・請求額集計', () => {
  test('SCEN-608: 複数顧客の営業データが顧客ごとに正確に分離集計される', () => {
    // ========== テストデータ準備 ==========
    // 3社以上の異なる顧客データを準備（顧客ID、売上金額、請求対象項目を含む）
    const salesData = [
      {
        customerId: 'CUST-001',
        customerName: '顧客A',
        saleAmount: 100000,
        serviceType: 'SERVICE_A',
        appointmentCount: 5,
        contractCount: 2,
        isInvoicingTarget: true,
      },
      {
        customerId: 'CUST-001',
        customerName: '顧客A',
        saleAmount: 50000,
        serviceType: 'SERVICE_B',
        appointmentCount: 3,
        contractCount: 1,
        isInvoicingTarget: true,
      },
      {
        customerId: 'CUST-002',
        customerName: '顧客B',
        saleAmount: 200000,
        serviceType: 'SERVICE_A',
        appointmentCount: 10,
        contractCount: 4,
        isInvoicingTarget: true,
      },
      {
        customerId: 'CUST-002',
        customerName: '顧客B',
        saleAmount: 75000,
        serviceType: 'SERVICE_C',
        appointmentCount: 2,
        contractCount: 1,
        isInvoicingTarget: true,
      },
      {
        customerId: 'CUST-003',
        customerName: '顧客C',
        saleAmount: 150000,
        serviceType: 'SERVICE_B',
        appointmentCount: 8,
        contractCount: 3,
        isInvoicingTarget: true,
      },
      {
        customerId: 'CUST-003',
        customerName: '顧客C',
        saleAmount: 125000,
        serviceType: 'SERVICE_A',
        appointmentCount: 6,
        contractCount: 2,
        isInvoicingTarget: true,
      },
    ];

    // ========== 請求対象項目抽出機能を実行 ==========
    const extractedBillingItems = extractBillingTargetItems(salesData);

    // ========== 各顧客のデータが顧客IDごとに正確に分離されていることを確認 ==========
    // 抽出結果に含まれる顧客IDのセット
    const uniqueCustomerIds = new Set(
      extractedBillingItems.map((item) => item.customerId)
    );
    expect(uniqueCustomerIds.size).toBe(3);
    expect(uniqueCustomerIds.has('CUST-001')).toBe(true);
    expect(uniqueCustomerIds.has('CUST-002')).toBe(true);
    expect(uniqueCustomerIds.has('CUST-003')).toBe(true);

    // 顧客Aのデータ件数が正確に2件であることを確認
    const custAItems = extractedBillingItems.filter(
      (item) => item.customerId === 'CUST-001'
    );
    expect(custAItems.length).toBe(2);

    // 顧客Bのデータ件数が正確に2件であることを確認
    const custBItems = extractedBillingItems.filter(
      (item) => item.customerId === 'CUST-002'
    );
    expect(custBItems.length).toBe(2);

    // 顧客Cのデータ件数が正確に2件であることを確認
    const custCItems = extractedBillingItems.filter(
      (item) => item.customerId === 'CUST-003'
    );
    expect(custCItems.length).toBe(2);

    // ========== 顧客ごとの請求額集計機能を実行 ==========
    const billingAggregation = aggregateBillingAmountByCustomer(
      extractedBillingItems
    );

    // ========== 顧客Aの売上データを集計し、合計金額を検証 ==========
    // 顧客A: 100,000 + 50,000 = 150,000
    const custABillingAmount = billingAggregation.find(
      (agg) => agg.customerId === 'CUST-001'
    );
    expect(custABillingAmount).toBeDefined();
    expect(custABillingAmount?.totalBillingAmount).toBe(150000);
    expect(custABillingAmount?.customerName).toBe('顧客A');
    expect(custABillingAmount?.itemCount).toBe(2);

    // ========== 顧客Bの売上データを集計し、合計金額を検証 ==========
    // 顧客B: 200,000 + 75,000 = 275,000
    const custBBillingAmount = billingAggregation.find(
      (agg) => agg.customerId === 'CUST-002'
    );
    expect(custBBillingAmount).toBeDefined();
    expect(custBBillingAmount?.totalBillingAmount).toBe(275000);
    expect(custBBillingAmount?.customerName).toBe('顧客B');
    expect(custBBillingAmount?.itemCount).toBe(2);

    // ========== 顧客Cの売上データを集計し、合計金額を検証 ==========
    // 顧客C: 150,000 + 125,000 = 275,000
    const custCBillingAmount = billingAggregation.find(
      (agg) => agg.customerId === 'CUST-003'
    );
    expect(custCBillingAmount).toBeDefined();
    expect(custCBillingAmount?.totalBillingAmount).toBe(275000);
    expect(custCBillingAmount?.customerName).toBe('顧客C');
    expect(custCBillingAmount?.itemCount).toBe(2);

    // ========== 各顧客の請求対象項目が他の顧客と混在していないことを確認 ==========
    // 顧客Aのアイテムはすべて顧客A IDのみであることを確認
    const custAHasMixedCustomerId = custAItems.some(
      (item) => item.customerId !== 'CUST-001'
    );
    expect(custAHasMixedCustomerId).toBe(false);

    // 顧客Bのアイテムはすべて顧客B IDのみであることを確認
    const custBHasMixedCustomerId = custBItems.some(
      (item) => item.customerId !== 'CUST-002'
    );
    expect(custBHasMixedCustomerId).toBe(false);

    // 顧客Cのアイテムはすべて顧客C IDのみであることを確認
    const custCHasMixedCustomerId = custCItems.some(
      (item) => item.customerId !== 'CUST-003'
    );
    expect(custCHasMixedCustomerId).toBe(false);

    // ========== 全顧客の集計合計が元データの総合計と一致することを確認 ==========
    // 元データの総合計: 100,000 + 50,000 + 200,000 + 75,000 + 150,000 + 125,000 = 700,000
    const expectedTotalAmount = 700000;
    const actualTotalAmount = billingAggregation.reduce(
      (sum, agg) => sum + agg.totalBillingAmount,
      0
    );
    expect(actualTotalAmount).toBe(expectedTotalAmount);

    // 集計結果の顧客数が3であることを確認
    expect(billingAggregation.length).toBe(3);

    // 各顧客の集計結果がすべて有効な正の金額であることを確認
    billingAggregation.forEach((agg) => {
      expect(agg.totalBillingAmount).toBeGreaterThan(0);
      expect(agg.customerId).toMatch(/^CUST-\d{3}$/);
      expect(agg.itemCount).toBeGreaterThan(0);
    });

    // ========== 詳細な集計値の正確性を最終検証 ==========
    expect(billingAggregation).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          customerId: 'CUST-001',
          customerName: '顧客A',
          totalBillingAmount: 150000,
          itemCount: 2,
        }),
        expect.objectContaining({
          customerId: 'CUST-002',
          customerName: '顧客B',
          totalBillingAmount: 275000,
          itemCount: 2,
        }),
        expect.objectContaining({
          customerId: 'CUST-003',
          customerName: '顧客C',
          totalBillingAmount: 275000,
          itemCount: 2,
        }),
      ])
    );
  });
});