import { classifyInventoryDiscrepancyCause } from '../../src/logic/it-1780551315784-1-2-1';

describe("工程別作業履歴と担当者情報の検索・照合機能", () => {
  test("差異原因自動分類機能 - 入出庫履歴パターンから正常に原因が分類される", () => {
    // SCEN-452
    const itemCode = "ITEM-001";
    const systemQuantity = 100;
    const actualQuantity = 85;
    
    const transactionHistory = [
      { date: "2024-01-10", type: "manual", quantity: 20, operator: "worker001" },
      { date: "2024-01-12", type: "manual", quantity: 15, operator: "worker001" },
      { date: "2024-01-15", type: "scanner", quantity: 25, operator: "worker002" },
      { date: "2024-01-18", type: "manual", quantity: 10, operator: "worker001" },
      { date: "2024-01-20", type: "manual", quantity: 12, operator: "worker001" }
    ];

    const result = classifyInventoryDiscrepancyCause(
      itemCode,
      systemQuantity,
      actualQuantity,
      transactionHistory
    );

    expect(result.causeCategory).toBe("過剰計上");
    expect(result.priority).toBe("低優先度");
    expect(result.estimatedCause).toBe("入力ミス");
    expect(Array.isArray(result.investigationSteps)).toBe(true);
    expect(result.investigationSteps.length).toBeGreaterThan(0);
  });
});