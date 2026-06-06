import { synchronizeInventoryWithAs400 } from '../../src/logic/it-1';

describe("製品仕様・納期・工程・資材・担当者情報を統合して標準化された生産指示書を自動生成する機能", () => {
  test("AS400システムとの通信エラー時に同期処理が失敗する", () => {
    // SCEN-432
    const inputMethod = "ハンディスキャナ";
    const inventoryTransactionData = {
      itemCode: "ITEM001",
      quantity: 50,
      transactionType: "入庫",
      operatorId: "OP001",
      datetime: "2024-01-15T10:00:00Z"
    };
    const as400CurrentStock = 100;
    const departmentId = "DEPT001";

    expect(() => synchronizeInventoryWithAs400(
      inputMethod,
      inventoryTransactionData,
      as400CurrentStock,
      departmentId
    )).toThrow(/基幹システム/);
  });
});