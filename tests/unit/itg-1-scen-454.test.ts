import { classifyInventoryDiscrepancyCause } from '../../src/logic/it-1780551315784-1-2-1';

describe("工程別作業履歴と担当者情報の検索・照合機能", () => {
  test("履歴パターンが存在しない場合のデフォルト分類処理", () => {
    // SCEN-454
    const itemCode = "ITEM001";
    const systemQuantity = 100;
    const actualQuantity = 80;
    const transactionHistory = []; // 履歴パターンが存在しない状況
    
    const result = classifyInventoryDiscrepancyCause(
      itemCode,
      systemQuantity,
      actualQuantity,
      transactionHistory
    );
    
    // 差異が負（過剰計上）であることを確認
    expect(result.causeCategory).toBe("過剰計上");
    
    // 履歴がないため物理的移動と推定されることを確認
    expect(result.estimatedCause).toBe("物理的移動");
    
    // 差異率が10%のため中優先度となることを確認
    expect(result.priority).toBe("中優先度");
    
    // 調査手順が含まれることを確認
    expect(Array.isArray(result.investigationSteps)).toBe(true);
    expect(result.investigationSteps.length).toBeGreaterThan(0);
  });
});