import { synchronizeInventoryWithAs400 } from "../../src/logic/it-1-br-1-2-1";

describe("AS400システム双方向同期機能", () => {
  test("製造実績データがAS400システムとリアルタイムで正常に同期される", () => {
    // SCEN-431
    
    // 新規製造実績データの入力・保存（生産管理システム → AS400）
    const inputMethod = "ハンディスキャナ";
    const inventoryTransactionData = {
      itemCode: "P001",
      quantity: 50,
      transactionType: "製品完成",
      workerId: "W123",
      completedTime: "2024-01-15T14:30:00Z"
    };
    const as400CurrentStock = 100;
    const departmentId = "PROD001";

    const syncResult = synchronizeInventoryWithAs400(
      inputMethod,
      inventoryTransactionData,
      as400CurrentStock,
      departmentId
    );

    // AS400への初回同期確認
    expect(syncResult.syncStatus).toBe("success");
    expect(syncResult.updatedStock).toBe(150); // 100 + 50
    expect(syncResult.dataConsistency).toBe(true);
    expect(syncResult.errorDetails).toBeNull();

    // 製造実績データ更新（数量変更：50 → 75）
    const updatedTransactionData = {
      itemCode: "P001",
      quantity: 75,
      transactionType: "製品完成",
      workerId: "W123",
      completedTime: "2024-01-15T14:35:00Z"
    };

    const updateSyncResult = synchronizeInventoryWithAs400(
      inputMethod,
      updatedTransactionData,
      as400CurrentStock,
      departmentId
    );

    // AS400への更新同期確認
    expect(updateSyncResult.syncStatus).toBe("success");
    expect(updateSyncResult.updatedStock).toBe(175); // 100 + 75
    expect(updateSyncResult.dataConsistency).toBe(true);
    expect(updateSyncResult.errorDetails).toBeNull();

    // AS400側からの逆方向更新確認（AS400 → 生産管理システム）
    const as400UpdateStock = 180;
    const reverseSyncData = {
      itemCode: "P001",
      quantity: 5,
      transactionType: "調整",
      workerId: "SYSTEM",
      completedTime: "2024-01-15T14:40:00Z"
    };

    const reverseSyncResult = synchronizeInventoryWithAs400(
      "手入力",
      reverseSyncData,
      as400UpdateStock,
      departmentId
    );

    // 逆方向同期確認
    expect(reverseSyncResult.syncStatus).toBe("success");
    expect(reverseSyncResult.updatedStock).toBe(185); // 180 + 5
    expect(reverseSyncResult.dataConsistency).toBe(true);
    expect(reverseSyncResult.errorDetails).toBeNull();
  });
});