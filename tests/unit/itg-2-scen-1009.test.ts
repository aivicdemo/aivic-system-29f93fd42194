import { calculateApprovalDecision } from "../../src/logic/it-6-2-1-1";

describe("査定部署長による妥当性判定結果の確認・承認", () => {
  test("SCEN-1009: 相場乖離率が承認基準の境界値である場合に正確に判定される", () => {
    // ケース1: 相場乖離率が +5.0%（上限境界値）
    const result_upper_boundary = calculateApprovalDecision({
      deviation_rate_percent: 5.0,
      approval_threshold_percent: 5.0,
    });
    expect(result_upper_boundary.approval_status).toBe("承認基準内");
    expect(result_upper_boundary.is_approved).toBe(true);
    expect(result_upper_boundary.deviation_rate_percent).toBe(5.0);

    // ケース2: 相場乖離率が -5.0%（下限境界値）
    const result_lower_boundary = calculateApprovalDecision({
      deviation_rate_percent: -5.0,
      approval_threshold_percent: 5.0,
    });
    expect(result_lower_boundary.approval_status).toBe("承認基準内");
    expect(result_lower_boundary.is_approved).toBe(true);
    expect(result_lower_boundary.deviation_rate_percent).toBe(-5.0);

    // ケース3: 相場乖離率が +5.01%（上限超過）
    const result_upper_exceed = calculateApprovalDecision({
      deviation_rate_percent: 5.01,
      approval_threshold_percent: 5.0,
    });
    expect(result_upper_exceed.approval_status).toBe("承認基準外");
    expect(result_upper_exceed.is_approved).toBe(false);
    expect(result_upper_exceed.deviation_rate_percent).toBe(5.01);

    // ケース4: 相場乖離率が -5.01%（下限超過）
    const result_lower_exceed = calculateApprovalDecision({
      deviation_rate_percent: -5.01,
      approval_threshold_percent: 5.0,
    });
    expect(result_lower_exceed.approval_status).toBe("承認基準外");
    expect(result_lower_exceed.is_approved).toBe(false);
    expect(result_lower_exceed.deviation_rate_percent).toBe(-5.01);

    // 承認処理実行確認: すべての判定結果が正確に返却される
    const all_results = [
      result_upper_boundary,
      result_lower_boundary,
      result_upper_exceed,
      result_lower_exceed,
    ];
    expect(all_results).toHaveLength(4);
    expect(
      all_results.filter((r) => r.approval_status === "承認基準内")
    ).toHaveLength(2);
    expect(
      all_results.filter((r) => r.approval_status === "承認基準外")
    ).toHaveLength(2);
    expect(
      all_results.filter((r) => r.is_approved === true)
    ).toHaveLength(2);
    expect(
      all_results.filter((r) => r.is_approved === false)
    ).toHaveLength(2);
  });
});