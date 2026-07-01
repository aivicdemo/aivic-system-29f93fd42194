import { extractBillingTargetItems } from "../../src/logic/it-1781935279444-1-1-1";

describe("営業データ項目のメタデータ管理機能 - 請求対象項目抽出", () => {
  test("SCEN-607: 請求対象外のデータが集計対象から除外される", () => {
    // テストデータ準備
    const billingRecords = [
      {
        id: "REC-001",
        customerId: "CUST-A",
        serviceId: "SVC-001",
        isBillingTarget: true,
        amount: 100000,
        taxAmount: 10000,
        discountAmount: 5000,
      },
      {
        id: "REC-002",
        customerId: "CUST-A",
        serviceId: "SVC-001",
        isBillingTarget: true,
        amount: 150000,
        taxAmount: 15000,
        discountAmount: 7500,
      },
      {
        id: "REC-003",
        customerId: "CUST-B",
        serviceId: "SVC-002",
        isBillingTarget: true,
        amount: 200000,
        taxAmount: 20000,
        discountAmount: 10000,
      },
      {
        id: "REC-004",
        customerId: "CUST-B",
        serviceId: "SVC-002",
        isBillingTarget: true,
        amount: 120000,
        taxAmount: 12000,
        discountAmount: 6000,
      },
      {
        id: "REC-005",
        customerId: "CUST-C",
        serviceId: "SVC-003",
        isBillingTarget: true,
        amount: 180000,
        taxAmount: 18000,
        discountAmount: 9000,
      },
      {
        id: "REC-EXC-001",
        customerId: "CUST-D",
        serviceId: "SVC-004",
        isBillingTarget: false,
        amount: 250000,
        taxAmount: 25000,
        discountAmount: 12500,
      },
      {
        id: "REC-EXC-002",
        customerId: "CUST-E",
        serviceId: "SVC-005",
        isBillingTarget: false,
        amount: 300000,
        taxAmount: 30000,
        discountAmount: 15000,
      },
      {
        id: "REC-EXC-003",
        customerId: "CUST-F",
        serviceId: "SVC-006",
        isBillingTarget: false,
        amount: 175000,
        taxAmount: 17500,
        discountAmount: 8750,
      },
    ];

    // 請求額集計処理を実行
    const result = extractBillingTargetItems(billingRecords);

    // 集計結果に含まれるレコード数を確認
    expect(result.extractedRecords.length).toBe(5);

    // 集計結果に請求対象フラグが'false'のレコードが存在しないことを検証
    const hasNonBillingTarget = result.extractedRecords.some(
      (rec) => rec.isBillingTarget === false
    );
    expect(hasNonBillingTarget).toBe(false);

    // 請求対象フラグが'true'のレコード5件のみが集計対象に含まれていることを確認
    const extractedIds = result.extractedRecords.map((rec) => rec.id).sort();
    const expectedIds = ["REC-001", "REC-002", "REC-003", "REC-004", "REC-005"];
    expect(extractedIds).toEqual(expectedIds);

    // 集計された合計金額が、請求対象のレコード5件のみの合計と一致することを検証
    const expectedTotalAmount =
      100000 + 150000 + 200000 + 120000 + 180000;
    expect(result.totalAmount).toBe(expectedTotalAmount);

    // 集計された合計税額が正確に計算されていることを検証
    const expectedTotalTaxAmount =
      10000 + 15000 + 20000 + 12000 + 18000;
    expect(result.totalTaxAmount).toBe(expectedTotalTaxAmount);

    // 集計された合計割引額が正確に計算されていることを検証
    const expectedTotalDiscountAmount =
      5000 + 7500 + 10000 + 6000 + 9000;
    expect(result.totalDiscountAmount).toBe(expectedTotalDiscountAmount);

    // 請求対象フラグが'false'のレコードが完全に除外されていることを確認
    const excludedIds = result.excludedRecords.map((rec) => rec.id).sort();
    const expectedExcludedIds = [
      "REC-EXC-001",
      "REC-EXC-002",
      "REC-EXC-003",
    ];
    expect(excludedIds).toEqual(expectedExcludedIds);

    // 除外されたレコード数が正確であることを検証
    expect(result.excludedRecords.length).toBe(3);

    // 請求対象外の合計金額が除外対象に正確に記録されていることを検証
    const expectedExcludedTotalAmount =
      250000 + 300000 + 175000;
    expect(result.excludedTotalAmount).toBe(expectedExcludedTotalAmount);
  });
});