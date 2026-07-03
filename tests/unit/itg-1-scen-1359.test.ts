import { extractBillingItems, aggregateBillingByCustomerAndService } from '../../src/logic/it-1-2-1';

describe('請求対象項目自動抽出・集計機能', () => {
  test('SCEN-1359: 検証済み営業データから請求対象項目が正確に抽出され、顧客ごと・サービスごとに集計される', () => {
    // ===== セットアップ：サンプル営業データ（複数顧客、複数サービス、検証済みステータス） =====
    const verifiedSalesData = [
      {
        id: 'sales_001',
        customerId: 'cust_A',
        serviceId: 'svc_X',
        appointmentCount: 10,
        contractCount: 5,
        unitPrice: 1000,
        verificationStatus: 'verified',
      },
      {
        id: 'sales_002',
        customerId: 'cust_A',
        serviceId: 'svc_X',
        appointmentCount: 8,
        contractCount: 4,
        unitPrice: 1000,
        verificationStatus: 'verified',
      },
      {
        id: 'sales_003',
        customerId: 'cust_A',
        serviceId: 'svc_Y',
        appointmentCount: 6,
        contractCount: 3,
        unitPrice: 2000,
        verificationStatus: 'verified',
      },
      {
        id: 'sales_004',
        customerId: 'cust_B',
        serviceId: 'svc_X',
        appointmentCount: 12,
        contractCount: 6,
        unitPrice: 1000,
        verificationStatus: 'verified',
      },
      {
        id: 'sales_005',
        customerId: 'cust_B',
        serviceId: 'svc_Y',
        appointmentCount: 5,
        contractCount: 2,
        unitPrice: 2000,
        verificationStatus: 'verified',
      },
    ];

    // ===== 請求対象項目の定義 =====
    const billingItemMapping = [
      {
        dataField: 'contractCount',
        billingField: 'contractCountBilling',
        isBillingTarget: true,
      },
      {
        dataField: 'unitPrice',
        billingField: 'unitPriceBilling',
        isBillingTarget: true,
      },
      {
        dataField: 'appointmentCount',
        billingField: 'appointmentCountBilling',
        isBillingTarget: false,
      },
    ];

    // ===== 手順1: 請求対象項目自動抽出機能を実行 =====
    const extractedItems = extractBillingItems(verifiedSalesData, billingItemMapping);

    // ===== 検証1: 抽出されたデータがすべての請求対象項目を含んでいること =====
    expect(extractedItems).toBeDefined();
    expect(Array.isArray(extractedItems)).toBe(true);
    expect(extractedItems.length).toBe(5);

    // すべての抽出データが contractCountBilling と unitPriceBilling を含むこと
    extractedItems.forEach((item) => {
      expect(item).toHaveProperty('contractCountBilling');
      expect(item).toHaveProperty('unitPriceBilling');
      expect(item).not.toHaveProperty('appointmentCountBilling');
    });

    // ===== 手順2: 顧客ごと・サービスごとの集計結果を確認 =====
    const aggregatedResult = aggregateBillingByCustomerAndService(extractedItems);

    // ===== 検証2: 集計結果の構造を確認 =====
    expect(aggregatedResult).toBeDefined();
    expect(typeof aggregatedResult).toBe('object');

    // ===== 手順3: 手動計算した期待値と比較検証 =====
    // 顧客A・サービスX: sales_001 + sales_002
    // contractCount: 5 + 4 = 9, unitPrice: 1000
    // 請求額 = 9 * 1000 = 9000
    const custA_svcX_Expected = {
      customerId: 'cust_A',
      serviceId: 'svc_X',
      totalContractCount: 9,
      unitPrice: 1000,
      billingAmount: 9000,
    };

    // 顧客A・サービスY: sales_003
    // contractCount: 3, unitPrice: 2000
    // 請求額 = 3 * 2000 = 6000
    const custA_svcY_Expected = {
      customerId: 'cust_A',
      serviceId: 'svc_Y',
      totalContractCount: 3,
      unitPrice: 2000,
      billingAmount: 6000,
    };

    // 顧客B・サービスX: sales_004
    // contractCount: 6, unitPrice: 1000
    // 請求額 = 6 * 1000 = 6000
    const custB_svcX_Expected = {
      customerId: 'cust_B',
      serviceId: 'svc_X',
      totalContractCount: 6,
      unitPrice: 1000,
      billingAmount: 6000,
    };

    // 顧客B・サービスY: sales_005
    // contractCount: 2, unitPrice: 2000
    // 請求額 = 2 * 2000 = 4000
    const custB_svcY_Expected = {
      customerId: 'cust_B',
      serviceId: 'svc_Y',
      totalContractCount: 2,
      unitPrice: 2000,
      billingAmount: 4000,
    };

    // 集計結果に期待値が含まれていることを確認
    expect(aggregatedResult).toEqual(
      expect.arrayContaining([
        expect.objectContaining(custA_svcX_Expected),
        expect.objectContaining(custA_svcY_Expected),
        expect.objectContaining(custB_svcX_Expected),
        expect.objectContaining(custB_svcY_Expected),
      ])
    );

    // ===== 検証3: 顧客間のデータ混在がないこと =====
    const custA_Items = aggregatedResult.filter((item) => item.customerId === 'cust_A');
    const custB_Items = aggregatedResult.filter((item) => item.customerId === 'cust_B');

    expect(custA_Items.length).toBe(2);
    expect(custB_Items.length).toBe(2);

    custA_Items.forEach((item) => {
      expect(item.customerId).toBe('cust_A');
      expect(['svc_X', 'svc_Y']).toContain(item.serviceId);
    });

    custB_Items.forEach((item) => {
      expect(item.customerId).toBe('cust_B');
      expect(['svc_X', 'svc_Y']).toContain(item.serviceId);
    });

    // ===== 検証4: サービス間のデータ混在がないこと =====
    const svcX_Items = aggregatedResult.filter((item) => item.serviceId === 'svc_X');
    const svcY_Items = aggregatedResult.filter((item) => item.serviceId === 'svc_Y');

    expect(svcX_Items.length).toBe(2);
    expect(svcY_Items.length).toBe(2);

    svcX_Items.forEach((item) => {
      expect(item.serviceId).toBe('svc_X');
      expect(['cust_A', 'cust_B']).toContain(item.customerId);
      expect(item.unitPrice).toBe(1000);
    });

    svcY_Items.forEach((item) => {
      expect(item.serviceId).toBe('svc_Y');
      expect(['cust_A', 'cust_B']).toContain(item.customerId);
      expect(item.unitPrice).toBe(2000);
    });

    // ===== 検証5: 集計値の正確性を再確認 =====
    const custA_svcX_Actual = aggregatedResult.find(
      (item) => item.customerId === 'cust_A' && item.serviceId === 'svc_X'
    );
    expect(custA_svcX_Actual.totalContractCount).toBe(9);
    expect(custA_svcX_Actual.billingAmount).toBe(9000);

    const custA_svcY_Actual = aggregatedResult.find(
      (item) => item.customerId === 'cust_A' && item.serviceId === 'svc_Y'
    );
    expect(custA_svcY_Actual.totalContractCount).toBe(3);
    expect(custA_svcY_Actual.billingAmount).toBe(6000);

    const custB_svcX_Actual = aggregatedResult.find(
      (item) => item.customerId === 'cust_B' && item.serviceId === 'svc_X'
    );
    expect(custB_svcX_Actual.totalContractCount).toBe(6);
    expect(custB_svcX_Actual.billingAmount).toBe(6000);

    const custB_svcY_Actual = aggregatedResult.find(
      (item) => item.customerId === 'cust_B' && item.serviceId === 'svc_Y'
    );
    expect(custB_svcY_Actual.totalContractCount).toBe(2);
    expect(custB_svcY_Actual.billingAmount).toBe(4000);
  });
});