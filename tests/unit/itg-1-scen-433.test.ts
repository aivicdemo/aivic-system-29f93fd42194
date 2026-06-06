import { validateInventoryDataConsistency } from '../../src/logic/it-1780551301636-1-2-1';

describe("在庫データ整合性チェック機能", () => {
  test('入力データが既存在庫記録と整合性が取れている場合に正式登録される', () => {
    // SCEN-433
    const transactionData = {
      itemCode: "P001",
      quantity: 50,
      transactionType: "入庫",
      inputMethod: "scanner",
      timestamp: "2024-01-15T10:00:00Z"
    };

    const currentInventory = {
      itemCode: "P001",
      currentQuantity: 100,
      warehouseId: "W001",
      lastUpdated: "2024-01-15T08:00:00Z"
    };

    const recentTransactions = [
      {
        itemCode: "P001",
        transactionType: "出庫",
        quantity: 20,
        timestamp: "2024-01-14T15:00:00Z"
      },
      {
        itemCode: "P001", 
        transactionType: "入庫",
        quantity: 30,
        timestamp: "2024-01-13T10:00:00Z"
      }
    ];

    const result = validateInventoryDataConsistency(transactionData, currentInventory, recentTransactions);

    expect(result.isValid).toBe(true);
    expect(result.correctionRequired).toBe(false);
    expect(result.warningMessage).toBe("");
  });
});