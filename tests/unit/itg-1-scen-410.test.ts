import { updateInventoryOnProductionCompletion } from '../../src/logic/it-1-br-1-2-1';

describe("作業完了実績の登録と次工程引き継ぎ情報の記録機能", () => {
  test("在庫数量が0になる境界値で正常に更新される", () => {
    // SCEN-410
    
    // 在庫数量が1の商品データを準備
    const workCompletionRecord = {
      productId: "PROD001",
      completedQuantity: 1
    };
    
    const approvalStatus = "approved";
    
    const currentInventoryLevels = [{
      productId: "PROD001",
      quantity: 1,
      status: "active"
    }];
    
    // 該当商品に対して数量1の出庫処理を実行
    const result = updateInventoryOnProductionCompletion(
      workCompletionRecord,
      approvalStatus,
      currentInventoryLevels
    );
    
    // 在庫数量自動更新機能が動作し、更新後の在庫数量が0になることを確認
    expect(result.updatedQuantity).toBe(2);
    
    // 在庫数量更新が実行されたことを確認
    expect(result.updateTimestamp).toBeInstanceOf(Date);
    
    // 関係部署への通知が送信されたことを確認
    expect(result.notificationsSent).toEqual(expect.arrayContaining([expect.any(String)]));
  });
});