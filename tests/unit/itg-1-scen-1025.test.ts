import { defineExtractionRule } from "../../src/logic/it-1-br-1781935279444-1-2-1";

describe("月次サマリーテンプレートの定義・管理機能", () => {
  test("SCEN-1025: 抽出ルールが未定義の状態ではエラーが返却される", () => {
    // 抽出ルールが未定義（null/undefined）の状態でデータ抽出処理を実行
    const undefinedExtractionRule = null;

    // エラーが発生することを検証
    expect(() => {
      defineExtractionRule(undefinedExtractionRule);
    }).toThrow(/抽出ルール/);
  });
});