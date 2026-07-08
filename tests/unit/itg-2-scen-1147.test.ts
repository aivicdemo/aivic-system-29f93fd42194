import { detectPrecisionDeclineThreshold } from "../../src/logic/it-1-br-6-2-1";

describe("査定員別の判定ばらつき率と相場乖離傾向の自動集計・分析", () => {
  // SCEN-1147: [edge] 精度低下兆候検知機能 - 精度低下の閾値が0.1%未満の微細な変化では低下と判定されない
  test("0.1%未満の微細な精度変化では精度低下と判定されないこと", () => {
    // 基準となる精度値を95.5000%に設定
    const baselinePrecision = 95.5000;

    // 精度値を95.4995%に変更する（低下幅0.0005%）
    const precision_001 = 95.4995;
    const decline_001 = baselinePrecision - precision_001; // 0.0005%

    // 精度低下判定ロジックを実行
    const result_001 = detectPrecisionDeclineThreshold({
      baselinePrecision: baselinePrecision,
      currentPrecision: precision_001,
      declineThreshold: 0.1,
    });

    // 判定結果を確認：0.0005%の低下は0.1%未満のため、低下なし
    expect(result_001.hasDecline).toBe(false);
    expect(result_001.declinePercentage).toBe(decline_001);
    expect(result_001.status).toBe("normal");

    // 精度値を95.4999%に変更する（低下幅0.0001%）
    const precision_002 = 95.4999;
    const decline_002 = baselinePrecision - precision_002; // 0.0001%

    // 精度低下判定ロジックを再度実行
    const result_002 = detectPrecisionDeclineThreshold({
      baselinePrecision: baselinePrecision,
      currentPrecision: precision_002,
      declineThreshold: 0.1,
    });

    // 判定結果を確認：0.0001%の低下は0.1%未満のため、低下なし
    expect(result_002.hasDecline).toBe(false);
    expect(result_002.declinePercentage).toBe(decline_002);
    expect(result_002.status).toBe("normal");
  });
});