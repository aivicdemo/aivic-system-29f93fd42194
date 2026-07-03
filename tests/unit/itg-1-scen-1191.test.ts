import { validateSalesDataExistence } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データの完全性・正確性を自動検証", () => {
  // SCEN-1191: [error] データ不一致の自動判定機能 - 判定対象となる営業データが存在しない場合、エラーハンドリングが正常に機能する
  test("判定対象の営業データが存在しない場合、適切なエラーハンドリングが機能すること", () => {
    // 準備: 存在しない営業データIDを指定
    const nonExistentSalesDataId = "sales_data_not_found_12345";

    // 実行: 自動判定処理を実行
    expect(() => {
      validateSalesDataExistence(nonExistentSalesDataId);
    }).toThrow(/営業データ/);

    // 検証: エラーが適切に投げられることを確認
    // エラーメッセージに営業データに関するキーワードが含まれていることを確認
  });
});