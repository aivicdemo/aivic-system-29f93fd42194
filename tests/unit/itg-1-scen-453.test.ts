import { classifyInventoryDiscrepancyCause } from '../../src/logic/it-1780551315784-1-2-1';

describe("工程別作業履歴と担当者情報の検索・照合機能", () => {
  test("差異原因自動分類機能 - 調査優先度と推定原因が適切に提示される", () => {
    // SCEN-453
    const itemCode = "PROD-001";
    const systemQuantity = 1000;
    const actualQuantity = 850;
    const transactionHistory = [
      { date: "2024-01-10", type: "manual", quantity: -50, operator: "WORKER-A" },
      { date: "2024-01-15", type: "manual", quantity: -30, operator: "WORKER-A" },
      { date: "2024-01-20", type: "scanner", quantity: -40, operator: "WORKER-B" },
      { date: "2024-01-25", type: "manual", quantity: -20, operator: "WORKER-A" },
      { date: "2024-01-30", type: "scanner", quantity: -10, operator: "WORKER-C" }
    ];

    const result = classifyInventoryDiscrepancyCause(
      itemCode,
      systemQuantity,
      actualQuantity,
      transactionHistory
    );

    expect(result.causeCategory).toBe("過剰計上");
    expect(result.priority).toBe("中優先度");
    expect(result.estimatedCause).toBe("入力ミス");
    expect(result.investigationSteps).toContain("作業履歴確認");
  });
});