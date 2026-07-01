import { describe, test, expect } from "@jest/globals";
import { calculateWithUnitConversion } from "../../src/logic/it-1781935279444-2-1-1";

describe("営業データメタデータに基づく集計検証 - 単位変換を含む複数項目の計算", () => {
  test("SCEN-1143: 異なる単位の営業データ項目が計算式に含まれる場合、単位変換が正確に実行される", () => {
    // テストケース1: 基本的な数量×単価×割引率計算
    // 期待: 数量(100個) × 単価(1000円/個) × (1 - 10%/100) = 90,000円
    const testCase1_result = calculateWithUnitConversion({
      items: [
        { name: "quantity", value: 100, unit: "個" },
        { name: "unitPrice", value: 1000, unit: "円/個" },
        { name: "discountRate", value: 10, unit: "%" }
      ],
      formula: "quantity * unitPrice * (1 - discountRate / 100)",
      expectedOutputUnit: "円"
    });
    expect(testCase1_result.calculatedValue).toBe(90000);
    expect(testCase1_result.outputUnit).toBe("円");

    // テストケース2: 距離の単位変換（km → m）
    // 期待: 5km = 5000m
    const testCase2_result = calculateWithUnitConversion({
      items: [
        { name: "distance", value: 5, unit: "km" }
      ],
      formula: "distance",
      expectedOutputUnit: "m"
    });
    expect(testCase2_result.calculatedValue).toBe(5000);
    expect(testCase2_result.outputUnit).toBe("m");

    // テストケース3: 重量の単位変換（kg → g）
    // 期待: 2.5kg = 2500g
    const testCase3_result = calculateWithUnitConversion({
      items: [
        { name: "weight", value: 2.5, unit: "kg" }
      ],
      formula: "weight",
      expectedOutputUnit: "g"
    });
    expect(testCase3_result.calculatedValue).toBe(2500);
    expect(testCase3_result.outputUnit).toBe("g");

    // テストケース4: 時間の単位変換（時間 → 分）
    // 期待: 3時間 = 180分
    const testCase4_result = calculateWithUnitConversion({
      items: [
        { name: "workHours", value: 3, unit: "時間" }
      ],
      formula: "workHours",
      expectedOutputUnit: "分"
    });
    expect(testCase4_result.calculatedValue).toBe(180);
    expect(testCase4_result.outputUnit).toBe("分");

    // テストケース5: 複数項目の混合計算（売上 = 成約数 × 単価 × (1 + 手数料率/100)）
    // 期待: 50(件) × 200000(円/件) × (1 + 15/100) = 11,500,000円
    const testCase5_result = calculateWithUnitConversion({
      items: [
        { name: "contracts", value: 50, unit: "件" },
        { name: "pricePerContract", value: 200000, unit: "円/件" },
        { name: "feeRate", value: 15, unit: "%" }
      ],
      formula: "contracts * pricePerContract * (1 + feeRate / 100)",
      expectedOutputUnit: "円"
    });
    expect(testCase5_result.calculatedValue).toBe(11500000);
    expect(testCase5_result.outputUnit).toBe("円");

    // テストケース6: マイナス計算を含む場合（在庫変動 = 期末在庫 - 期首在庫）
    // 期待: 1500(個) - 800(個) = 700個
    const testCase6_result = calculateWithUnitConversion({
      items: [
        { name: "endInventory", value: 1500, unit: "個" },
        { name: "beginInventory", value: 800, unit: "個" }
      ],
      formula: "endInventory - beginInventory",
      expectedOutputUnit: "個"
    });
    expect(testCase6_result.calculatedValue).toBe(700);
    expect(testCase6_result.outputUnit).toBe("個");

    // テストケース7: 単位不整合でエラー（異なる単位のまま加算を試みる場合）
    // 期待: 単位の不統合エラー
    expect(() =>
      calculateWithUnitConversion({
        items: [
          { name: "distance", value: 5, unit: "km" },
          { name: "weight", value: 2, unit: "kg" }
        ],
        formula: "distance + weight",
        expectedOutputUnit: "m"
      })
    ).toThrow(/単位/);
  });
});