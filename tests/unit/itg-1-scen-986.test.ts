import { extractBillableItems } from '../../src/logic/it-1-2-1';

describe('請求対象項目の自動抽出・集計機能', () => {
  // SCEN-986
  test('請求ルール違反の営業データが除外される', () => {
    // テストデータ: 請求ルール違反フラグが立っているレコードを含む営業データセット
    const salesData = [
      {
        recordId: 'REC-001',
        customerId: 'CUST-A',
        serviceId: 'SVC-001',
        appointmentCount: 5,
        closureCount: 2,
        amount: 50000,
        billingRuleViolationFlag: false,
        transactionDate: '2024-01-15',
      },
      {
        recordId: 'REC-002',
        customerId: 'CUST-A',
        serviceId: 'SVC-001',
        appointmentCount: 3,
        closureCount: 1,
        amount: -10000, // マイナス値 → 請求ルール違反
        billingRuleViolationFlag: true,
        transactionDate: '2024-01-16',
      },
      {
        recordId: 'REC-003',
        customerId: 'CUST-B',
        serviceId: 'SVC-002',
        appointmentCount: 8,
        closureCount: 4,
        amount: 80000,
        billingRuleViolationFlag: false,
        transactionDate: '2024-01-17',
      },
      {
        recordId: 'REC-004',
        customerId: 'CUST-B',
        serviceId: 'SVC-002',
        appointmentCount: null, // 必須項目が空白 → 請求ルール違反
        closureCount: 1,
        amount: 30000,
        billingRuleViolationFlag: true,
        transactionDate: '2024-01-18',
      },
      {
        recordId: 'REC-005',
        customerId: 'CUST-A',
        serviceId: 'SVC-001',
        appointmentCount: 2,
        closureCount: 1,
        amount: 25000,
        billingRuleViolationFlag: false,
        transactionDate: '2024-01-19',
      },
    ];

    // 請求対象項目の自動抽出・集計機能を実行
    const result = extractBillableItems(salesData);

    // 抽出されたレコード一覧を確認
    expect(result.extractedRecords).toBeDefined();
    expect(Array.isArray(result.extractedRecords)).toBe(true);

    // 請求ルール違反フラグが立っているレコードが抽出結果に含まれていないことを検証
    const violationRecordIds = result.extractedRecords
      .filter((record: any) => record.billingRuleViolationFlag === true)
      .map((record: any) => record.recordId);
    expect(violationRecordIds.length).toBe(0);

    // 抽出されたレコード数が違反レコードを除いた正しい件数であることを確認
    // 入力: 5件、違反レコード: 2件 → 抽出対象: 3件
    expect(result.extractedRecords.length).toBe(3);

    // 抽出されたレコードの recordId を確認
    const extractedRecordIds = result.extractedRecords.map(
      (record: any) => record.recordId
    );
    expect(extractedRecordIds).toEqual(['REC-001', 'REC-003', 'REC-005']);

    // 顧客ごと・サービスごとの集計結果を確認
    expect(result.aggregatedByCustomerService).toBeDefined();

    // 顧客 CUST-A, サービス SVC-001 の集計
    const custA_svc001 = result.aggregatedByCustomerService.find(
      (agg: any) =>
        agg.customerId === 'CUST-A' && agg.serviceId === 'SVC-001'
    );
    expect(custA_svc001).toBeDefined();
    expect(custA_svc001.totalAmount).toBe(75000); // 50000 + 25000
    expect(custA_svc001.recordCount).toBe(2);
    expect(custA_svc001.totalAppointmentCount).toBe(7); // 5 + 2
    expect(custA_svc001.totalClosureCount).toBe(3); // 2 + 1

    // 顧客 CUST-B, サービス SVC-002 の集計
    const custB_svc002 = result.aggregatedByCustomerService.find(
      (agg: any) =>
        agg.customerId === 'CUST-B' && agg.serviceId === 'SVC-002'
    );
    expect(custB_svc002).toBeDefined();
    expect(custB_svc002.totalAmount).toBe(80000); // 80000 のみ
    expect(custB_svc002.recordCount).toBe(1);
    expect(custB_svc002.totalAppointmentCount).toBe(8);
    expect(custB_svc002.totalClosureCount).toBe(4);

    // 除外されたレコード一覧またはログに記録されていることを確認
    expect(result.excludedRecords).toBeDefined();
    expect(Array.isArray(result.excludedRecords)).toBe(true);
    expect(result.excludedRecords.length).toBe(2);

    // 除外されたレコードの詳細情報を確認
    const excludedRecordIds = result.excludedRecords.map(
      (record: any) => record.recordId
    );
    expect(excludedRecordIds).toEqual(['REC-002', 'REC-004']);

    // 除外理由が記録されていることを確認
    const rec002_excluded = result.excludedRecords.find(
      (record: any) => record.recordId === 'REC-002'
    );
    expect(rec002_excluded).toBeDefined();
    expect(rec002_excluded.exclusionReason).toMatch(/金額/);

    const rec004_excluded = result.excludedRecords.find(
      (record: any) => record.recordId === 'REC-004'
    );
    expect(rec004_excluded).toBeDefined();
    expect(rec004_excluded.exclusionReason).toMatch(/必須項目/);
  });
});