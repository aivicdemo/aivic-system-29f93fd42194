import { validateInventoryTransactionInput } from '../../src/logic/it-1';

describe('入出庫データ登録機能 - 入力データの形式エラー検証', () => {
  test('SCEN-423: 入力データに形式エラーがある場合にエラーメッセージを表示して登録を停止する', () => {
    // 無効な形式のデータを入力
    const result = validateInventoryTransactionInput(
      "ABC@#$%123456789", // 特殊文字を含む無効な商品コード
      "入庫",
      0, // 数量に0を入力
      "2024/13/35", // 無効な日付形式
      "OP001",
      "手入力"
    );

    // エラーメッセージが表示され登録が停止されることを確認
    expect(result.isValid).toBe(false);
    expect(result.errorMessages).toContain("品目コードが正しく入力されていません。登録済みの品目コードを入力してください。");
    expect(result.errorMessages).toContain("数量は1以上の数値を入力してください。");
    expect(result.errorMessages).toContain("作業日付は今日以前の正しい日付を入力してください。");
    expect(result.validatedData).toEqual({
      itemCode: "ABC@#$%123456789",
      transactionType: "入庫", 
      quantity: 0,
      transactionDate: "2024/13/35",
      operatorId: "OP001",
      inputMethod: "手入力"
    });
  });
});