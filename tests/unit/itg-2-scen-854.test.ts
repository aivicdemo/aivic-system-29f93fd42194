import { calculateJudgmentDeviation } from "../../src/logic/it-6-2-2-2";

describe("査定員別の判定精度・乖離パターン分析ダッシュボード", () => {
  test("SCEN-854: 判定基準の上限閾値を1円超過した判定を逸脱と判定する", () => {
    // 判定基準の上限閾値: 100,000円
    const upper_threshold = 100000;
    
    // 上限閾値を1円超過した判定データ
    const judgment_amount = 100001;
    
    // 判定逸脱を判定する
    const result = calculateJudgmentDeviation({
      judgment_amount: judgment_amount,
      upper_threshold: upper_threshold,
      lower_threshold: 50000,
    });
    
    // 期待結果: 逸脱判定は true、逸脱理由は "upper_threshold_exceeded"
    expect(result.is_deviation).toBe(true);
    expect(result.deviation_reason).toBe("upper_threshold_exceeded");
    expect(result.deviation_amount).toBe(1);
    expect(result.judgment_status).toBe("deviation");
    
    // 判定逸脱パターンがシステムに記録されている
    expect(result.recorded_in_system).toBe(true);
    expect(result.record_timestamp).toBeDefined();
  });
});