import { updateInventoryOnProductionCompletion } from '../../src/logic/it-1-br-1-2-1';

describe("作業完了実績の登録と次工程引き継ぎ情報の記録機能", () => {
  test("在庫数量自動更新機能 - 作業完了実績承認時に在庫数量が正しく自動更新される", () => {
    // SCEN-408
    const workCompletionRecord = {
      productId: "PRODUCT_A",
      completedQuantity: 50
    };
    
    const approvalStatus = "approved";
    
    const currentInventoryLevels = [
      {
        productId: "PRODUCT_A",
        quantity: 100
      }
    ];

    const result = updateInventoryOnProductionCompletion(
      workCompletionRecord,
      approvalStatus,
      currentInventoryLevels
    );

    expect(result.updatedQuantity).toBe(150);
    expect(result.updateTimestamp).toBeInstanceOf(Date);
    expect(Array.isArray(result.notificationsSent)).toBe(true);
  });
});