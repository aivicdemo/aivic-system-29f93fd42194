import { extractBillableItemsAndCalculateBillingAmount } from '../../src/logic/it-1-2-1';

describe('営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能', () => {
  test('SCEN-1036: 請求ルールに該当しない営業データは請求対象から除外される', () => {
    // 【前提】営業データとして、請求ルール対象・非対象混在のデータを準備
    const salesData = [
      {
        id: 'sales_001',
        customerId: 'customer_A',
        serviceType: 'serviceX',
        appointmentCount: 10,
        contractCount: 5,
        amount: 50000,
        status: 'completed',
        cancellationFlag: false,
        returnFlag: false,
        trialFlag: false,
      },
      {
        id: 'sales_002',
        customerId: 'customer_A',
        serviceType: 'serviceX',
        appointmentCount: 5,
        contractCount: 2,
        amount: 20000,
        status: 'cancelled',
        cancellationFlag: true,
        returnFlag: false,
        trialFlag: false,
      },
      {
        id: 'sales_003',
        customerId: 'customer_B',
        serviceType: 'serviceY',
        appointmentCount: 8,
        contractCount: 3,
        amount: 30000,
        status: 'completed',
        cancellationFlag: false,
        returnFlag: true,
        trialFlag: false,
      },
      {
        id: 'sales_004',
        customerId: 'customer_B',
        serviceType: 'serviceY',
        appointmentCount: 6,
        contractCount: 2,
        amount: 15000,
        status: 'completed',
        cancellationFlag: false,
        returnFlag: false,
        trialFlag: true,
      },
      {
        id: 'sales_005',
        customerId: 'customer_C',
        serviceType: 'serviceZ',
        appointmentCount: 12,
        contractCount: 6,
        amount: 60000,
        status: 'completed',
        cancellationFlag: false,
        returnFlag: false,
        trialFlag: false,
      },
    ];

    // 【請求ルール定義】
    // - status が 'completed' であること
    // - cancellationFlag が false であること
    // - returnFlag が false であること
    // - trialFlag が false であること
    // すべての条件を満たすデータのみが請求対象
    const billingRules = {
      requiredStatus: 'completed',
      excludeCancelled: true,
      excludeReturned: true,
      excludeTrial: true,
    };

    // 【トリガー】請求対象抽出・請求額集計を実行
    const result = extractBillableItemsAndCalculateBillingAmount(
      salesData,
      billingRules
    );

    // 【期待結果の検証】
    // 1. 請求対象として抽出されたデータの確認
    // - sales_001: status=completed, cancellation=false, return=false, trial=false → 対象
    // - sales_002: cancellation=true → 除外
    // - sales_003: return=true → 除外
    // - sales_004: trial=true → 除外
    // - sales_005: status=completed, cancellation=false, return=false, trial=false → 対象
    expect(result.billableItems).toHaveLength(2);
    expect(result.billableItems.map((item: any) => item.id)).toEqual([
      'sales_001',
      'sales_005',
    ]);

    // 2. 顧客ごと・サービスごとの請求額集計確認
    // customer_A, serviceX: sales_001 のみ対象 → 50000
    // customer_C, serviceZ: sales_005 のみ対象 → 60000
    expect(result.billingByCustomerAndService).toEqual({
      'customer_A-serviceX': {
        customerId: 'customer_A',
        serviceType: 'serviceX',
        totalAmount: 50000,
        itemCount: 1,
      },
      'customer_C-serviceZ': {
        customerId: 'customer_C',
        serviceType: 'serviceZ',
        totalAmount: 60000,
        itemCount: 1,
      },
    });

    // 3. 除外されたデータの詳細をログに記録されていることを確認
    expect(result.excludedItems).toHaveLength(3);
    expect(result.excludedItems).toContainEqual({
      id: 'sales_002',
      reason: 'cancellation_flag_true',
    });
    expect(result.excludedItems).toContainEqual({
      id: 'sales_003',
      reason: 'return_flag_true',
    });
    expect(result.excludedItems).toContainEqual({
      id: 'sales_004',
      reason: 'trial_flag_true',
    });

    // 4. 請求額集計に除外データが含まれていないことを確認
    const allBillableIds = result.billableItems.map((item: any) => item.id);
    expect(allBillableIds).not.toContain('sales_002');
    expect(allBillableIds).not.toContain('sales_003');
    expect(allBillableIds).not.toContain('sales_004');

    // 5. 総請求額の検証
    const totalBillingAmount = Object.values(
      result.billingByCustomerAndService
    ).reduce(
      (sum: number, item: any) => sum + item.totalAmount,
      0
    );
    expect(totalBillingAmount).toBe(110000);

    // 6. 処理ステータスの確認
    expect(result.status).toBe('success');
    expect(result.processedAt).toBeDefined();
    expect(typeof result.processedAt).toBe('string');
  });
});