import { describe, test, expect } from "@jest/globals";
import { calculateCorrectionCoefficient } from "../../src/logic/it-1-br-2-2-2-1";

describe("査定員ごとの判定結果と根拠の月次集計・分析ダッシュボード", () => {
  // SCEN-1000: [error] 地域・時期補正係数の自動算出 - 補正係数がマスタに存在しない地域・時期の場合、補正不可の警告が表示される
  test("should throw warning when correction coefficient master data does not exist for specified region and period", () => {
    const input_region = "未登録地域";
    const input_period = "未登録時期";
    const input_item_id = "ITEM-001";

    expect(() =>
      calculateCorrectionCoefficient({
        region: input_region,
        period: input_period,
        item_id: input_item_id,
      })
    ).toThrow(/補正係数/);
  });
});