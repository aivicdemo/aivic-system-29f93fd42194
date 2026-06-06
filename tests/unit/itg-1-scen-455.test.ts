import { classifyInventoryDiscrepancyCause } from '../../src/logic/it-1780551315784-1-2-1';

describe("工程別作業履歴と担当者情報の検索・照合機能", () => {
  test("差異原因自動分類機能 - 不正な履歴データで分類エラーが発生する", () => {
    // SCEN-455
    
    // 不正な履歴データを準備（欠損値、異常値、フォーマット不正を含む）
    const itemCodeValid = "ITEM-001";
    const systemQuantity = 100;
    const actualQuantity = 85;
    
    // 不正な履歴データ - 欠損値と異常値を含む
    const invalidTransactionHistory = [
      {
        date: "", // 欠損値
        type: "manual",
        quantity: -50, // 異常値
        operator: "OP001"
      },
      {
        date: "invalid-date-format", // フォーマット不正
        type: "scanner",
        quantity: 25,
        operator: ""  // 欠損値
      },
      {
        date: "2024-01-15",
        type: "unknown_type", // 不正な種別
        quantity: null, // null値
        operator: "OP002"
      }
    ];
    
    // 不正な履歴データでの分類実行
    expect(() => 
      classifyInventoryDiscrepancyCause(
        itemCodeValid,
        systemQuantity,
        actualQuantity,
        invalidTransactionHistory
      )
    ).toThrow(/履歴/);
  });
});