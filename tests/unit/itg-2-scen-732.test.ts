import { describe, test, expect, beforeEach } from "@jest/globals";
import {
  calculateDeviationStatus,
  type DeviationAnalysisInput,
  type DeviationStatusResult,
} from "../../src/logic/it-6-2-2-2";

describe("査定員別判定精度・乖離パターン分析ダッシュボード", () => {
  // SCEN-732: [edge] 相場乖離率段階別表示 - 乖離率が±10%ちょうどの境界値で要注意表示に正確に変遷する
  test("乖離率の境界値（±10%）で要注意表示が正確に切り替わること", () => {
    const market_price = 10000;

    // ケース1: 査定価格9,000円（乖離率-10%ちょうど）
    const input_case1: DeviationAnalysisInput = {
      market_price: market_price,
      appraisal_price: 9000,
      timestamp: new Date("2024-01-15T11:00:00Z"),
      appraiser_id: "APP001",
      item_id: "ITEM001",
    };
    const result_case1: DeviationStatusResult =
      calculateDeviationStatus(input_case1);

    // 乖離率が-10%ちょうどの場合、警告ステータス（要注意）が表示される
    expect(result_case1.deviation_rate).toBe(-10.0);
    expect(result_case1.status).toBe("warning");
    expect(result_case1.status_label).toBe("要注意");

    // ケース2: 査定価格9,001円（乖離率-9.99%）
    const input_case2: DeviationAnalysisInput = {
      market_price: market_price,
      appraisal_price: 9001,
      timestamp: new Date("2024-01-15T11:05:00Z"),
      appraiser_id: "APP001",
      item_id: "ITEM001",
    };
    const result_case2: DeviationStatusResult =
      calculateDeviationStatus(input_case2);

    // 乖離率が-9.99%に変更されると警告ステータスが解除される
    expect(result_case2.deviation_rate).toBeCloseTo(-9.99, 1);
    expect(result_case2.status).toBe("normal");
    expect(result_case2.status_label).toBe("標準");

    // ケース3: 査定価格11,000円（乖離率+10%ちょうど）
    const input_case3: DeviationAnalysisInput = {
      market_price: market_price,
      appraisal_price: 11000,
      timestamp: new Date("2024-01-15T11:10:00Z"),
      appraiser_id: "APP001",
      item_id: "ITEM001",
    };
    const result_case3: DeviationStatusResult =
      calculateDeviationStatus(input_case3);

    // 乖離率が+10%ちょうどの場合、警告ステータス（要注意）が表示される
    expect(result_case3.deviation_rate).toBe(10.0);
    expect(result_case3.status).toBe("warning");
    expect(result_case3.status_label).toBe("要注意");

    // ケース4: 査定価格10,999円（乖離率+9.99%）
    const input_case4: DeviationAnalysisInput = {
      market_price: market_price,
      appraisal_price: 10999,
      timestamp: new Date("2024-01-15T11:15:00Z"),
      appraiser_id: "APP001",
      item_id: "ITEM001",
    };
    const result_case4: DeviationStatusResult =
      calculateDeviationStatus(input_case4);

    // 乖離率が+9.99%に変更されると警告ステータスが解除される
    expect(result_case4.deviation_rate).toBeCloseTo(9.99, 1);
    expect(result_case4.status).toBe("normal");
    expect(result_case4.status_label).toBe("標準");

    // ケース5: 乖離率がさらに大きい場合（-15%）は高リスク表示になる
    const input_case5: DeviationAnalysisInput = {
      market_price: market_price,
      appraisal_price: 8500,
      timestamp: new Date("2024-01-15T11:20:00Z"),
      appraiser_id: "APP001",
      item_id: "ITEM001",
    };
    const result_case5: DeviationStatusResult =
      calculateDeviationStatus(input_case5);

    // 乖離率が-15%の場合、高リスク表示（警告以上）になる
    expect(result_case5.deviation_rate).toBe(-15.0);
    expect(result_case5.status).toBe("alert");
    expect(result_case5.status_label).toBe("高リスク");

    // ケース6: 乖離率が0%（市場価格と一致）の場合は正常表示
    const input_case6: DeviationAnalysisInput = {
      market_price: market_price,
      appraisal_price: 10000,
      timestamp: new Date("2024-01-15T11:25:00Z"),
      appraiser_id: "APP001",
      item_id: "ITEM001",
    };
    const result_case6: DeviationStatusResult =
      calculateDeviationStatus(input_case6);

    // 乖離率が0%の場合、正常ステータスが表示される
    expect(result_case6.deviation_rate).toBe(0.0);
    expect(result_case6.status).toBe("normal");
    expect(result_case6.status_label).toBe("標準");

    // 境界値前後での遷移が正確であることを確認
    expect(result_case1.status).not.toBe(result_case2.status);
    expect(result_case3.status).not.toBe(result_case4.status);
  });
});