import { prioritizeImprovementItems } from "../../src/logic/it-1-br-1781935279444-1-2-1";

describe("月次サマリーテンプレートの定義・管理機能", () => {
  test("SCEN-914: 改善項目優先度判定機能 - 例外ケース入力が空集合である場合、改善対象なしとして空配列を返す", () => {
    // 初期化
    const exceptionCasesInput: Array<{
      exceptionType: string;
      priority: number;
      description: string;
    }> = [];

    // 改善項目優先度判定機能に空集合を入力として渡す
    const result = prioritizeImprovementItems(exceptionCasesInput);

    // 戻り値が配列型であることを確認
    expect(Array.isArray(result)).toBe(true);

    // 戻り値の配列が空であることを確認
    expect(result).toEqual([]);
    expect(result.length).toBe(0);
  });
});