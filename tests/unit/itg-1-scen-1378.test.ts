import { defineCalculationLogic } from "../../src/logic/it-1781935279444-1-1-1";

describe("営業データ項目のメタデータ管理機能", () => {
  // SCEN-1378
  test("無効な計算ロジック定義が拒否される", () => {
    const invalidLogicDef = {
      name: "テスト計算ロジック",
      formula: "=SUM(A1:B2",
      description: "テスト用計算ロジック",
    };

    expect(() => defineCalculationLogic(invalidLogicDef)).toThrow(/計算式の構文/);
  });
});