import { calculateBillingAmountWithRetroactiveApplication } from "../../src/logic/it-1-2-1";

describe("営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能", () => {
  test("SCEN-1015: 複数の割引ルール変更が異なる時期に発生した場合、全ての変更が時系列で正確に適用される", () => {
    // テストデータセットアップ
    const baseDiscountRule = {
      ruleId: "rule_001",
      discountRate: 0.1,
      effectiveDate: new Date("2024-01-01T00:00:00Z"),
    };

    const salesData = [
      {
        month: "2024-01",
        customerId: "cust_001",
        serviceId: "svc_001",
        grossAmount: 1000000,
      },
      {
        month: "2024-02",
        customerId: "cust_001",
        serviceId: "svc_001",
        grossAmount: 1000000,
      },
      {
        month: "2024-03",
        customerId: "cust_001",
        serviceId: "svc_001",
        grossAmount: 1000000,
      },
    ];

    // ルール変更履歴
    const discountRuleChanges = [
      {
        changeId: "change_001",
        ruleId: "rule_001",
        previousDiscountRate: 0.1,
        newDiscountRate: 0.15,
        effectiveDate: new Date("2024-02-01T00:00:00Z"),
        changeOrder: 1,
      },
      {
        changeId: "change_002",
        ruleId: "rule_001",
        previousDiscountRate: 0.15,
        newDiscountRate: 0.2,
        effectiveDate: new Date("2024-03-01T00:00:00Z"),
        changeOrder: 2,
      },
    ];

    const result = calculateBillingAmountWithRetroactiveApplication(
      baseDiscountRule,
      salesData,
      discountRuleChanges
    );

    // 1月分の請求額検証（基本割引ルール10%が適用）
    const januaryBillingAmount = result.billingResults.find(
      (r) => r.month === "2024-01"
    );
    expect(januaryBillingAmount).toBeDefined();
    expect(januaryBillingAmount?.appliedDiscountRate).toBe(0.1);
    expect(januaryBillingAmount?.discountAmount).toBe(100000); // 1000000 * 0.1
    expect(januaryBillingAmount?.netAmount).toBe(900000); // 1000000 - 100000

    // 2月分の請求額検証（2月1日変更後の15%が適用）
    const februaryBillingAmount = result.billingResults.find(
      (r) => r.month === "2024-02"
    );
    expect(februaryBillingAmount).toBeDefined();
    expect(februaryBillingAmount?.appliedDiscountRate).toBe(0.15);
    expect(februaryBillingAmount?.discountAmount).toBe(150000); // 1000000 * 0.15
    expect(februaryBillingAmount?.netAmount).toBe(850000); // 1000000 - 150000

    // 3月分の請求額検証（3月1日変更後の20%が適用）
    const marchBillingAmount = result.billingResults.find(
      (r) => r.month === "2024-03"
    );
    expect(marchBillingAmount).toBeDefined();
    expect(marchBillingAmount?.appliedDiscountRate).toBe(0.2);
    expect(marchBillingAmount?.discountAmount).toBe(200000); // 1000000 * 0.2
    expect(marchBillingAmount?.netAmount).toBe(800000); // 1000000 - 200000

    // 合計請求額検証
    const totalNetAmount =
      januaryBillingAmount!.netAmount +
      februaryBillingAmount!.netAmount +
      marchBillingAmount!.netAmount;
    expect(result.totalNetAmount).toBe(2550000); // 900000 + 850000 + 800000

    // 変更履歴ログの検証
    expect(result.changeHistory).toBeDefined();
    expect(result.changeHistory.length).toBe(2);

    // 変更1の検証（2024年2月1日）
    expect(result.changeHistory[0].changeId).toBe("change_001");
    expect(result.changeHistory[0].previousDiscountRate).toBe(0.1);
    expect(result.changeHistory[0].newDiscountRate).toBe(0.15);
    expect(result.changeHistory[0].effectiveDate).toEqual(
      new Date("2024-02-01T00:00:00Z")
    );
    expect(result.changeHistory[0].changeOrder).toBe(1);

    // 変更2の検証（2024年3月1日）
    expect(result.changeHistory[1].changeId).toBe("change_002");
    expect(result.changeHistory[1].previousDiscountRate).toBe(0.15);
    expect(result.changeHistory[1].newDiscountRate).toBe(0.2);
    expect(result.changeHistory[1].effectiveDate).toEqual(
      new Date("2024-03-01T00:00:00Z")
    );
    expect(result.changeHistory[1].changeOrder).toBe(2);

    // システムイベントログの検証
    expect(result.systemEventLog).toBeDefined();
    expect(result.systemEventLog.status).toBe("COMPLETED");
    expect(result.systemEventLog.retroactiveApplicationStartedAt).toBeDefined();
    expect(result.systemEventLog.retroactiveApplicationCompletedAt).toBeDefined();
    expect(result.systemEventLog.processedRuleChangeCount).toBe(2);

    // イベントログのタイムスタンプが有効であることを確認
    const startTime = new Date(
      result.systemEventLog.retroactiveApplicationStartedAt
    ).getTime();
    const endTime = new Date(
      result.systemEventLog.retroactiveApplicationCompletedAt
    ).getTime();
    expect(endTime).toBeGreaterThanOrEqual(startTime);

    // 全体の処理結果確認
    expect(result.isRetroactivelyApplied).toBe(true);
    expect(result.affectedBillingMonths).toEqual(["2024-01", "2024-02", "2024-03"]);
  });
});