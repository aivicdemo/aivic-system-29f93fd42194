import { updateInventoryOnProductionCompletion } from '../../src/logic/it-1-br-1-2-1';

describe("作業完了実績の登録と次工程引き継ぎ情報の記録機能", () => {
  test("承認されていない実績では在庫更新が実行されない", () => {
    // SCEN-409
    const workCompletionRecord = {
      productId: "PROD-001",
      completedQuantity: 100
    };
    
    const approvalStatus = "unapproved";
    
    const currentInventoryLevels = [
      {
        productId: "PROD-001",
        quantity: 500
      }
    ];

    expect(() => 
      updateInventoryOnProductionCompletion(workCompletionRecord, approvalStatus, currentInventoryLevels)
    ).toThrow(/承認/);
  });
});