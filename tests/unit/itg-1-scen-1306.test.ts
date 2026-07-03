import { describe, test, expect } from "@jest/globals";
import {
  resolveSalesDataItemDependencies,
} from "../../src/logic/it-1781935279444-1-1-1";

describe("営業データ項目メタデータ管理機能 - 循環参照検出と依存関係解決", () => {
  test("SCEN-1306: 循環参照を含む複数項目の依存関係が正確に解決され、トポロジカルソートに基づく計算順序が決定される", () => {
    // 循環参照を含むメタデータ定義
    // 項目A → 項目B → 項目C → 項目Aの循環
    const salesDataItems = [
      {
        itemId: "item_A",
        itemName: "項目A",
        dataType: "number",
        unit: "件",
        dependsOn: ["item_B"],
        calculationLogic: "item_B * 1.1",
      },
      {
        itemId: "item_B",
        itemName: "項目B",
        dataType: "number",
        unit: "件",
        dependsOn: ["item_C"],
        calculationLogic: "item_C + 5",
      },
      {
        itemId: "item_C",
        itemName: "項目C",
        dataType: "number",
        unit: "件",
        dependsOn: ["item_A"],
        calculationLogic: "item_A * 2",
      },
      {
        itemId: "item_D",
        itemName: "項目D",
        dataType: "number",
        unit: "件",
        dependsOn: [],
        calculationLogic: "10",
      },
      {
        itemId: "item_E",
        itemName: "項目E",
        dataType: "number",
        unit: "件",
        dependsOn: ["item_D"],
        calculationLogic: "item_D + 3",
      },
    ];

    const baseValues = {
      item_D: 10,
    };

    // 依存関係の解決処理を実行
    const result = resolveSalesDataItemDependencies({
      items: salesDataItems,
      baseValues: baseValues,
    });

    // 循環参照が正確に検出される
    expect(result.hasCycle).toBe(true);
    expect(result.cycleItems).toContain("item_A");
    expect(result.cycleItems).toContain("item_B");
    expect(result.cycleItems).toContain("item_C");
    expect(result.cycleItems.length).toBe(3);

    // 循環参照を排除した依存関係グラフが生成される
    expect(result.acyclicDependencyGraph).toBeDefined();
    expect(result.acyclicDependencyGraph.item_D).toEqual([]);
    expect(result.acyclicDependencyGraph.item_E).toEqual(["item_D"]);
    // 循環参照に関連する項目はグラフから除外されるか、依存関係が削除される
    expect(Array.isArray(result.acyclicDependencyGraph.item_A)).toBe(true);

    // トポロジカルソートに基づいた計算順序が決定される
    expect(result.computationOrder).toBeDefined();
    expect(Array.isArray(result.computationOrder)).toBe(true);
    // 循環参照を排除した項目のみが計算対象になる（または警告付きで計算）
    expect(result.computationOrder.indexOf("item_D")).toBeGreaterThanOrEqual(0);
    expect(result.computationOrder.indexOf("item_E")).toBeGreaterThan(
      result.computationOrder.indexOf("item_D")
    );

    // 計算順序に基づいて各項目が正確に計算される
    expect(result.calculatedValues).toBeDefined();
    // 循環参照のない項目は正確に計算される
    expect(result.calculatedValues.item_D).toBe(10);
    expect(result.calculatedValues.item_E).toBe(13); // item_D(10) + 3 = 13

    // 循環参照情報が適切に記録される
    expect(result.warnings).toBeDefined();
    expect(Array.isArray(result.warnings)).toBe(true);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0]).toMatch(/循環参照/);

    // エラーメッセージに循環参照に関連する項目が含まれる
    const warningMessage = result.warnings.join("|");
    expect(warningMessage).toMatch(/item_A/);
    expect(warningMessage).toMatch(/item_B/);
    expect(warningMessage).toMatch(/item_C/);

    // 依存関係解決が部分的に成功していることを示す
    expect(result.resolveStatus).toBe("partially_resolved");
    expect(result.successfulItems).toContain("item_D");
    expect(result.successfulItems).toContain("item_E");
    expect(result.failedItems).toContain("item_A");
    expect(result.failedItems).toContain("item_B");
    expect(result.failedItems).toContain("item_C");
  });
});