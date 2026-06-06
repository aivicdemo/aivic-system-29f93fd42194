import { synchronizeInventoryWithAs400 } from '../../src/logic/it-1';

describe("AS400システム双方向同期機能", () => {
  test('入出庫データがAS400システムとリアルタイムで正常に同期される', () => {
    // SCEN-430
    
    // 入庫データ登録（100個入庫）
    const inboundTransactionData = {
      itemCode: "P001",
      quantity: 100,
      transactionType: "入庫",
      operatorId: "USER001",
      transactionDate: "2024-01-15"
    };
    
    const currentAs400Stock = 0;
    
    const inboundResult = synchronizeInventoryWithAs400(
      "ハンディスキャナ",
      inboundTransactionData,
      currentAs400Stock,
      "DEPT001"
    );
    
    expect(inboundResult.syncStatus).toBe("success");
    expect(inboundResult.updatedStock).toBe(100);
    expect(inboundResult.dataConsistency).toBe(true);
    expect(inboundResult.errorDetails).toBe(null);
    
    // AS400システム側で出庫データ登録（30個出庫）
    const outboundTransactionData = {
      itemCode: "P001",
      quantity: -30,
      transactionType: "出庫",
      operatorId: "USER002",
      transactionDate: "2024-01-15"
    };
    
    const updatedAs400Stock = 100;
    
    const outboundResult = synchronizeInventoryWithAs400(
      "手入力",
      outboundTransactionData,
      updatedAs400Stock,
      "DEPT002"
    );
    
    expect(outboundResult.syncStatus).toBe("success");
    expect(outboundResult.updatedStock).toBe(70);
    expect(outboundResult.dataConsistency).toBe(true);
    expect(outboundResult.errorDetails).toBe(null);
  });
});