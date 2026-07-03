import { determineMultipleContractChangePriority } from "../../src/logic/it-1781935279444-2-1-1";

describe("営業データ入力時の品質検証ルール定義・実行機能", () => {
  // SCEN-1235: [normal] 複数契約変更優先順位自動判定機能 - 3件以上の同時契約変更が登録された場合、すべての影響度が正確に評価される
  test("複数の同時契約変更について影響度が正確に評価され、優先順位が自動付与される", () => {
    const contractChanges = [
      {
        contractChangeId: "CC001",
        customerId: "CUST-A",
        contractAmount: 500000,
        changeType: "price_increase",
        affectedCustomerCount: 5,
        billingCycleDays: 30,
        changeDescription: "契約金額を50%増加",
      },
      {
        contractChangeId: "CC002",
        customerId: "CUST-B",
        contractAmount: 200000,
        changeType: "service_scope_expansion",
        affectedCustomerCount: 15,
        billingCycleDays: 30,
        changeDescription: "提供サービス範囲を拡大",
      },
      {
        contractChangeId: "CC003",
        customerId: "CUST-C",
        contractAmount: 800000,
        changeType: "billing_cycle_change",
        affectedCustomerCount: 3,
        billingCycleDays: 15,
        changeDescription: "請求周期を30日から15日に変更",
      },
      {
        contractChangeId: "CC004",
        customerId: "CUST-D",
        contractAmount: 350000,
        changeType: "price_decrease",
        affectedCustomerCount: 8,
        billingCycleDays: 60,
        changeDescription: "契約金額を20%減少",
      },
    ];

    const result = determineMultipleContractChangePriority(contractChanges);

    // 結果の構造検証
    expect(result).toHaveProperty("prioritizedChanges");
    expect(result).toHaveProperty("evaluationSummary");
    expect(Array.isArray(result.prioritizedChanges)).toBe(true);
    expect(result.prioritizedChanges.length).toBe(4);

    // 優先順位付きの契約変更が返されることを確認
    const cc001 = result.prioritizedChanges.find(
      (c: any) => c.contractChangeId === "CC001"
    );
    const cc002 = result.prioritizedChanges.find(
      (c: any) => c.contractChangeId === "CC002"
    );
    const cc003 = result.prioritizedChanges.find(
      (c: any) => c.contractChangeId === "CC003"
    );
    const cc004 = result.prioritizedChanges.find(
      (c: any) => c.contractChangeId === "CC004"
    );

    expect(cc001).toBeDefined();
    expect(cc002).toBeDefined();
    expect(cc003).toBeDefined();
    expect(cc004).toBeDefined();

    // 影響度スコアが評価されていることを確認
    expect(cc001).toHaveProperty("impactScore");
    expect(cc002).toHaveProperty("impactScore");
    expect(cc003).toHaveProperty("impactScore");
    expect(cc004).toHaveProperty("impactScore");

    expect(typeof cc001.impactScore).toBe("number");
    expect(typeof cc002.impactScore).toBe("number");
    expect(typeof cc003.impactScore).toBe("number");
    expect(typeof cc004.impactScore).toBe("number");

    // 優先度が付与されていることを確認
    expect(cc001).toHaveProperty("priority");
    expect(cc002).toHaveProperty("priority");
    expect(cc003).toHaveProperty("priority");
    expect(cc004).toHaveProperty("priority");

    expect(typeof cc001.priority).toBe("number");
    expect(typeof cc002.priority).toBe("number");
    expect(typeof cc003.priority).toBe("number");
    expect(typeof cc004.priority).toBe("number");

    // 優先度は1から4の範囲内であることを確認
    expect(cc001.priority).toBeGreaterThanOrEqual(1);
    expect(cc001.priority).toBeLessThanOrEqual(4);
    expect(cc002.priority).toBeGreaterThanOrEqual(1);
    expect(cc002.priority).toBeLessThanOrEqual(4);
    expect(cc003.priority).toBeGreaterThanOrEqual(1);
    expect(cc003.priority).toBeLessThanOrEqual(4);
    expect(cc004.priority).toBeGreaterThanOrEqual(1);
    expect(cc004.priority).toBeLessThanOrEqual(4);

    // 優先度が1つだけ存在することを確認（重複なし）
    const priorities = [cc001.priority, cc002.priority, cc003.priority, cc004.priority];
    const uniquePriorities = new Set(priorities);
    expect(uniquePriorities.size).toBe(4);

    // 影響範囲が評価されていることを確認
    expect(cc001).toHaveProperty("impactScope");
    expect(cc002).toHaveProperty("impactScope");
    expect(cc003).toHaveProperty("impactScope");
    expect(cc004).toHaveProperty("impactScope");

    // 影響度の内訳が含まれていることを確認
    expect(cc001).toHaveProperty("impactBreakdown");
    expect(cc002).toHaveProperty("impactBreakdown");
    expect(cc003).toHaveProperty("impactBreakdown");
    expect(cc004).toHaveProperty("impactBreakdown");

    expect(cc001.impactBreakdown).toHaveProperty("contractAmountImpact");
    expect(cc001.impactBreakdown).toHaveProperty("customerCountImpact");
    expect(cc001.impactBreakdown).toHaveProperty("billingCycleImpact");

    expect(typeof cc001.impactBreakdown.contractAmountImpact).toBe("number");
    expect(typeof cc001.impactBreakdown.customerCountImpact).toBe("number");
    expect(typeof cc001.impactBreakdown.billingCycleImpact).toBe("number");

    // CC003（契約金額800000円、請求周期15日変更）が最も影響度が高いはず
    // 影響度スコアが最高のものが優先度1として設定されていることを確認
    const maxImpactScore = Math.max(
      cc001.impactScore,
      cc002.impactScore,
      cc003.impactScore,
      cc004.impactScore
    );
    const highestPriorityChange = result.prioritizedChanges.find(
      (c: any) => c.impactScore === maxImpactScore
    );
    expect(highestPriorityChange.priority).toBe(1);

    // 評価サマリーが提供されていることを確認
    expect(result.evaluationSummary).toHaveProperty("totalChanges");
    expect(result.evaluationSummary.totalChanges).toBe(4);

    expect(result.evaluationSummary).toHaveProperty("highestImpactChangeId");
    expect(result.evaluationSummary.highestImpactChangeId).toBe(
      highestPriorityChange.contractChangeId
    );

    expect(result.evaluationSummary).toHaveProperty("highestImpactScore");
    expect(result.evaluationSummary.highestImpactScore).toBe(maxImpactScore);

    // 処理ログが含まれていることを確認
    expect(result).toHaveProperty("processingLog");
    expect(Array.isArray(result.processingLog)).toBe(true);
    expect(result.processingLog.length).toBeGreaterThan(0);

    // すべての契約変更がログに記録されていることを確認
    const loggedChangeIds = result.processingLog
      .filter((log: any) => log.event === "evaluated")
      .map((log: any) => log.contractChangeId);
    expect(loggedChangeIds).toContain("CC001");
    expect(loggedChangeIds).toContain("CC002");
    expect(loggedChangeIds).toContain("CC003");
    expect(loggedChangeIds).toContain("CC004");

    // 優先度順にソートされていることを確認
    for (let i = 0; i < result.prioritizedChanges.length - 1; i++) {
      expect(result.prioritizedChanges[i].priority).toBeLessThan(
        result.prioritizedChanges[i + 1].priority
      );
    }
  });
});