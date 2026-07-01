import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { validateDistributionJob } from "../../src/logic/it-1-1-1";

describe("営業成果データの自動検証ルール定義と異常検出機能", () => {
  // SCEN-1182: [edge] 配信成功・失敗判定・アラート管理 - 配信対象顧客が0件の場合の判定ロジック検証

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("配信対象顧客が0件の場合、システムが明確に成功と判定し、判定基準とアラート記録が一貫していることを検証", () => {
    // Arrange: 配信ジョブ作成（対象顧客0件の状態）
    const distribution_job_input = {
      job_id: "job_2024_01_001",
      job_name: "月次営業成果レポート配信",
      template_id: "template_monthly_report",
      target_customers: [] as string[],
      scheduled_at: "2024-01-15T09:00:00Z",
      created_by: "admin_user_001",
      created_at: "2024-01-15T08:30:00Z",
    };

    // Act & Assert - 初回実行: 対象顧客0件で配信ジョブを実行
    const first_execution_result = validateDistributionJob(
      distribution_job_input
    );

    // 期待値: 対象顧客0件の場合、成功と判定される（業務要件：異常値として失敗ではなく、「対象なし」を成功として扱う）
    expect(first_execution_result.status).toBe("success");
    expect(first_execution_result.distribution_count).toBe(0);
    expect(first_execution_result.success_count).toBe(0);
    expect(first_execution_result.failure_count).toBe(0);

    // 判定基準の確認：ドキュメント記載の判定ロジックに従っているか
    expect(first_execution_result.judgment_criteria).toBe(
      "target_customers_empty_success_logic"
    );
    expect(first_execution_result.judgment_reason).toBe(
      "配信対象顧客数0件は正常な状態として成功と判定"
    );

    // アラート記録の確認：適切なステータスが記録されているか
    expect(first_execution_result.alert_recorded).toBe(true);
    expect(first_execution_result.alert_level).toBe("info");
    expect(first_execution_result.alert_message).toMatch(/対象顧客/);

    // 一貫性検証：同じ条件で2回目実行
    const second_execution_result = validateDistributionJob(
      distribution_job_input
    );

    // 2回目実行結果が1回目と一貫しているか検証
    expect(second_execution_result.status).toBe(first_execution_result.status);
    expect(second_execution_result.distribution_count).toBe(
      first_execution_result.distribution_count
    );
    expect(second_execution_result.judgment_criteria).toBe(
      first_execution_result.judgment_criteria
    );

    // 複数回実行の一貫性：3回目実行も同じ結果か
    const third_execution_result = validateDistributionJob(
      distribution_job_input
    );
    expect(third_execution_result.status).toBe("success");
    expect(third_execution_result.judgment_criteria).toBe(
      "target_customers_empty_success_logic"
    );

    // 配信ジョブのタイムスタンプ検証：実行時刻が記録されているか
    expect(first_execution_result.executed_at).toBeDefined();
    expect(new Date(first_execution_result.executed_at as string).getTime()).toBeGreaterThan(
      0
    );

    // 判定ロジックの完全性検証：成功判定時に必須項目がすべて揃っているか
    expect(first_execution_result.judgment_criteria).toBeDefined();
    expect(first_execution_result.judgment_reason).toBeDefined();
    expect(first_execution_result.alert_recorded).toBe(true);
    expect(first_execution_result.alert_level).toBeDefined();

    // 境界値テスト：対象顧客が1件の場合との差分を確認
    const distribution_job_with_one_customer = {
      ...distribution_job_input,
      target_customers: ["customer_001"],
    };

    const one_customer_result = validateDistributionJob(
      distribution_job_with_one_customer
    );

    // 対象顧客0件と1件で判定が異なるか（0件は成功、1件は配信実행ロジックへ進む）
    expect(one_customer_result.distribution_count).toBe(1);
    expect(one_customer_result.distribution_count).not.toBe(
      first_execution_result.distribution_count
    );

    // エラーケース：不正な入力（null値の配列）で例外発生か
    const invalid_input = {
      ...distribution_job_input,
      target_customers: null as any,
    };

    expect(() => validateDistributionJob(invalid_input)).toThrow(/配信対象/);
  });
});