import { validateInventoryDataConsistency } from '../../src/logic/it-1780551301636-1-2-1';

describe("生産実績データの異常値を自動検出し原因調査に必要な関連データを抽出する機能", () => {
  test("入力データと既存在庫記録に差異がある場合に警告を表示して修正を促す", () => {
    // SCEN-434
    const transactionData = {
      itemCode: "商品A",
      quantity: 80,
      transactionType: "入庫",
      inputMethod: "手入力",
      timestamp: "2024-01-15T10:00:00Z"
    };

    const currentInventory = {
      itemCode: "商品A",
      currentQuantity: 100,
      lastUpdatedDate: "2024-01-14T15:00:00Z"
    };

    const recentTransactions = [
      {
        itemCode: "商品A",
        quantity: 50,
        transactionType: "入庫",
        timestamp: "2024-01-14T09:00:00Z"
      }
    ];

    const result = validateInventoryDataConsistency(transactionData, currentInventory, recentTransactions);

    expect(result.isValid).toBe(false);
    expect(result.correctionRequired).toBe(true);
    expect(result.warningMessage).toBe("入力された在庫数量（80個）と既存記録（100個）に差異があります。データを確認して修正してください。");
  });
});