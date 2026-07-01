import { recordBillingCriteriaDecision } from "../../src/logic/it-1781935279444-2-1-1";

describe("営業データ入力時の品質検証ルール定義・実行機能", () => {
  // SCEN-925: [edge] 例外ケース・判断基準の構造化記録機能
  test("複数の判断基準が適用可能な場合、採用基準と優先順位が構造化記録される", () => {
    const criteriaA = {
      id: "criteria_a",
      name: "基準A",
      priority: 1,
      description: "成果報酬型_割引10%",
    };
    const criteriaB = {
      id: "criteria_b",
      name: "基準B",
      priority: 2,
      description: "基本料金型_割引5%",
    };
    const criteriaC = {
      id: "criteria_c",
      name: "基準C",
      priority: 3,
      description: "混合型_割引なし",
    };

    const applicableCriteria = [criteriaA, criteriaB, criteriaC];
    const testCaseData = {
      customerId: "cust_001",
      serviceType: "営業支援",
      achievementValue: 150,
      contractType: "mixed",
    };

    const executionContext = {
      executionId: "exec_001",
      timestamp: new Date("2024-01-15T10:30:00Z"),
      userId: "user_001",
      stepName: "請求ロジック確認",
    };

    // 第1回実行
    const result1 = recordBillingCriteriaDecision({
      applicableCriteria,
      selectedCriteria: criteriaA,
      testCaseData,
      executionContext,
    });

    expect(result1.recordId).toBeDefined();
    expect(result1.selectedCriteriaId).toBe("criteria_a");
    expect(result1.selectedCriteriaName).toBe("基準A");
    expect(result1.selectedPriority).toBe(1);
    expect(result1.totalApplicableCriteria).toBe(3);
    expect(result1.priorityRanking).toEqual([
      { id: "criteria_a", priority: 1 },
      { id: "criteria_b", priority: 2 },
      { id: "criteria_c", priority: 3 },
    ]);
    expect(result1.executionTimestamp).toBe("2024-01-15T10:30:00Z");

    // 第2回実行：記録の一貫性確認
    const result2 = recordBillingCriteriaDecision({
      applicableCriteria,
      selectedCriteria: criteriaA,
      testCaseData,
      executionContext: {
        ...executionContext,
        executionId: "exec_002",
        timestamp: new Date("2024-01-15T11:00:00Z"),
      },
    });

    expect(result2.selectedCriteriaId).toBe("criteria_a");
    expect(result2.selectedCriteriaName).toBe("基準A");
    expect(result2.selectedPriority).toBe(1);
    expect(result2.priorityRanking).toEqual(result1.priorityRanking);

    // エクスポートデータの検証
    const exportData = {
      records: [result1, result2],
      exportedAt: "2024-01-15T12:00:00Z",
      customerId: "cust_001",
    };

    expect(exportData.records).toHaveLength(2);
    expect(exportData.records[0].priorityRanking).toBeDefined();
    expect(exportData.records[0].priorityRanking).toHaveLength(3);
    expect(exportData.records[0].priorityRanking[0].priority).toBe(1);
    expect(exportData.records[1].priorityRanking).toEqual(
      exportData.records[0].priorityRanking
    );

    // 優先度順序の正確性確認
    const priorities = exportData.records[0].priorityRanking.map(
      (r: { priority: number }) => r.priority
    );
    expect(priorities).toEqual([1, 2, 3]);
  });
});