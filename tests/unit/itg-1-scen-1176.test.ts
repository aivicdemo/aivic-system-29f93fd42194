import {
  generateAndDistributeMonthlyReport,
} from "../../src/logic/it-1-br-1781935279444-1-2-1";

describe("月次サマリーテンプレートの定義・管理機能", () => {
  test("SCEN-1176: レポート生成・配信期限管理 - 月次レポート生成から配信完了までが定められた期限内に完了する", () => {
    // ---- Precondition ----
    // 営業データ品質管理・請求自動化システムにログイン状態
    // 月次レポート生成機能にアクセス可能
    // 対象月のレポート生成準備が完了している
    const target_month = "2024-01";
    const generation_sla_hours = 24; // 営業日1日 = 24時間以内
    const generation_start_time = new Date("2024-02-01T09:00:00Z");
    const generation_end_time = new Date("2024-02-01T14:30:00Z");
    const distribution_end_time = new Date("2024-02-01T15:45:00Z");

    // ---- Input ----
    const input_params = {
      target_month: target_month,
      sla_hours: generation_sla_hours,
      generation_start: generation_start_time,
      generation_end: generation_end_time,
      distribution_end: distribution_end_time,
      report_template_id: "tpl_monthly_001",
      recipients: [
        {
          customer_id: "cust_A001",
          email: "sales@customerA.com",
          report_type: "monthly_summary",
        },
        {
          customer_id: "cust_B002",
          email: "finance@customerB.com",
          report_type: "monthly_summary",
        },
      ],
      distribution_status: "pending",
    };

    // ---- Expected Calculation ----
    // レポート生成所要時間 = generation_end - generation_start
    // = 14:30 - 09:00 = 5時間30分
    const generation_duration_ms =
      generation_end_time.getTime() - generation_start_time.getTime();
    const generation_duration_hours = generation_duration_ms / (1000 * 60 * 60);

    // 配信完了までの総所要時間 = distribution_end - generation_start
    // = 15:45 - 09:00 = 6時間45分
    const total_duration_ms =
      distribution_end_time.getTime() - generation_start_time.getTime();
    const total_duration_hours = total_duration_ms / (1000 * 60 * 60);

    // 期限内であるか判定: 総所要時間 <= SLA時間
    // 6.75時間 <= 24時間 ✓ 期限内
    const within_sla = total_duration_hours <= generation_sla_hours;

    // ---- Execute ----
    const result = generateAndDistributeMonthlyReport(input_params);

    // ---- Assertions ----
    // 1. レポート生成が完了しており、生成開始時刻が記録されている
    expect(result.generation_start_time).toEqual(generation_start_time);

    // 2. レポート生成の完了時刻が記録されている
    expect(result.generation_end_time).toEqual(generation_end_time);

    // 3. レポート生成所要時間が計算されている
    expect(result.generation_duration_hours).toBeCloseTo(
      generation_duration_hours,
      2
    );

    // 4. 配信完了時刻が記録されている
    expect(result.distribution_end_time).toEqual(distribution_end_time);

    // 5. レポート生成開始から配信完了までの総所要時間が計算されている
    expect(result.total_duration_hours).toBeCloseTo(total_duration_hours, 2);

    // 6. 総所要時間が定められた期限以内であることを確認
    expect(result.within_sla).toBe(true);
    expect(result.total_duration_hours).toBeLessThanOrEqual(
      generation_sla_hours
    );

    // 7. 配信ステータスが「完了」であることを確認
    expect(result.distribution_status).toBe("completed");

    // 8. 対象者数が正確に記録されている
    expect(result.recipients_count).toBe(2);

    // 9. すべての対象者への配信が成功していることを確認
    expect(result.delivery_results).toHaveLength(2);
    result.delivery_results.forEach((delivery) => {
      expect(delivery.status).toBe("success");
      expect(delivery.delivery_time).toBeDefined();
    });

    // 10. レポート生成対象月が正確に記録されている
    expect(result.target_month).toBe(target_month);

    // 11. レポートテンプレートIDが正確に適用されている
    expect(result.applied_template_id).toBe(input_params.report_template_id);

    // 12. SLA期限が適用されている
    expect(result.sla_hours).toBe(generation_sla_hours);

    // ---- Error Case: SLA超過 ----
    const late_distribution_end = new Date("2024-02-02T10:00:00Z"); // 翌日10:00
    const late_input = {
      ...input_params,
      distribution_end: late_distribution_end,
    };

    const late_result = generateAndDistributeMonthlyReport(late_input);
    const late_total_hours =
      (late_distribution_end.getTime() - generation_start_time.getTime()) /
      (1000 * 60 * 60);

    // SLA超過時は within_sla = false
    expect(late_result.within_sla).toBe(false);
    expect(late_total_hours).toBeGreaterThan(generation_sla_hours);

    // ---- Error Case: 空の配信対象者リスト ----
    const empty_recipients_input = {
      ...input_params,
      recipients: [],
    };

    expect(() => {
      generateAndDistributeMonthlyReport(empty_recipients_input);
    }).toThrow(/配信対象者/);

    // ---- Error Case: 無効な対象月フォーマット ----
    const invalid_month_input = {
      ...input_params,
      target_month: "2024-13", // 月が無効
    };

    expect(() => {
      generateAndDistributeMonthlyReport(invalid_month_input);
    }).toThrow(/対象月/);
  });
});