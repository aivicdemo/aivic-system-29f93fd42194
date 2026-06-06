import { validateInventoryTransactionInput } from '../../src/logic/it-1';

describe("入出庫データ登録機能 - 必須項目入力検証", () => {
  test("必須項目に不足がある場合にエラーメッセージを表示して登録を停止する", () => {
    // SCEN-422

    // 商品コードが空の場合
    const resultMissingItemCode = validateInventoryTransactionInput(
      "",
      "入庫",
      100,
      "2024-01-15",
      "USER001",
      "手入力"
    );
    
    expect(resultMissingItemCode.isValid).toBe(false);
    expect(resultMissingItemCode.errorMessages).toContain("品目コードが入力されていません");

    // 入出庫区分が無効な場合
    const resultInvalidType = validateInventoryTransactionInput(
      "ITEM001",
      "無効区分",
      100,
      "2024-01-15",
      "USER001",
      "手入力"
    );
    
    expect(resultInvalidType.isValid).toBe(false);
    expect(resultInvalidType.errorMessages).toContain("入出庫区分は入庫または出庫を選択してください");

    // 数量が0の場合
    const resultZeroQuantity = validateInventoryTransactionInput(
      "ITEM001",
      "入庫",
      0,
      "2024-01-15",
      "USER001",
      "手入力"
    );
    
    expect(resultZeroQuantity.isValid).toBe(false);
    expect(resultZeroQuantity.errorMessages).toContain("数量は1以上の数値を入力してください");

    // 作業日付が未来日の場合
    const resultFutureDate = validateInventoryTransactionInput(
      "ITEM001",
      "入庫",
      100,
      "2025-12-31",
      "USER001",
      "手入力"
    );
    
    expect(resultFutureDate.isValid).toBe(false);
    expect(resultFutureDate.errorMessages).toContain("作業日付は正しい日付を入力してください");

    // 担当者IDが空の場合
    const resultMissingOperator = validateInventoryTransactionInput(
      "ITEM001",
      "入庫",
      100,
      "2024-01-15",
      "",
      "手入力"
    );
    
    expect(resultMissingOperator.isValid).toBe(false);
    expect(resultMissingOperator.errorMessages).toContain("担当者IDが入力されていません");

    // 入力方式が無効な場合
    const resultInvalidMethod = validateInventoryTransactionInput(
      "ITEM001",
      "入庫",
      100,
      "2024-01-15",
      "USER001",
      "無効方式"
    );
    
    expect(resultInvalidMethod.isValid).toBe(false);
    expect(resultInvalidMethod.errorMessages).toContain("入力方式を選択してください");

    // 全項目が正常な場合
    const resultValid = validateInventoryTransactionInput(
      "ITEM001",
      "入庫",
      100,
      "2024-01-15",
      "USER001",
      "手入力"
    );
    
    expect(resultValid.isValid).toBe(true);
    expect(resultValid.errorMessages).toEqual([]);
    expect(resultValid.validatedData).toEqual({
      itemCode: "ITEM001",
      transactionType: "入庫",
      quantity: 100,
      transactionDate: "2024-01-15",
      operatorId: "USER001",
      inputMethod: "手入力"
    });
  });
});