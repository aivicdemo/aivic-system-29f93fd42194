import { validateInventoryTransactionInput } from '../../src/logic/it-1';

describe("入出庫データ登録 - 必須項目検証機能", () => {
  test('必須項目がすべて正しく入力されている場合に登録処理が実行される', () => {
    // SCEN-421
    
    const itemCode = "P001";
    const transactionType = "入庫";
    const quantity = 100;
    const transactionDate = "2024/01/15";
    const operatorId = "OP001";
    const inputMethod = "手入力";

    const result = validateInventoryTransactionInput(
      itemCode,
      transactionType,
      quantity,
      transactionDate,
      operatorId,
      inputMethod
    );

    expect(result.isValid).toBe(true);
    expect(result.errorMessages).toEqual([]);
    expect(result.validatedData).toEqual({
      itemCode: "P001",
      transactionType: "入庫",
      quantity: 100,
      transactionDate: "2024/01/15",
      operatorId: "OP001",
      inputMethod: "手入力"
    });
  });
});