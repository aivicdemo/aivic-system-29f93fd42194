import { defineContractChangeSLAManagement } from "../../src/logic/it-1-br-1781935279444-1-2-1";

describe("月次サマリーテンプレート定義・管理機能", () => {
  test("SCEN-1229: 契約変更SLA自動管理機能 - 顧客営業責任者による合意から契約・請求データ反映までが定義SLA時間内に完了する", () => {
    // 固定タイムスタンプを使用（動的な new Date() は使わない）
    const application_sent_at = new Date("2024-06-15T09:00:00Z"); // 申請送信時刻
    const approval_completed_at = new Date("2024-06-15T10:30:00Z"); // 承認完了時刻
    const billing_data_reflected_at = new Date("2024-06-15T11:45:00Z"); // 請求データ反映完了時刻
    const sla_time_limit_hours = 24; // 定義SLA時間（営業時間内24時間以内）
    const contract_id = "CONT-2024-001";
    const customer_user_id = "USR-CUST-001";
    const change_content = {
      service_name: "Premium Service",
      billing_amount: 150000,
      effective_date: "2024-07-01",
    };

    // 関数を呼び出し（仕様に基づいて入力パラメータを構成）
    const result = defineContractChangeSLAManagement({
      contract_id,
      customer_user_id,
      application_sent_at,
      approval_completed_at,
      billing_data_reflected_at,
      sla_time_limit_hours,
      change_content,
    });

    // 期待結果1: 申請から請求データ反映完了までの経過時間を計算
    // 2024-06-15T09:00:00Z から 2024-06-15T11:45:00Z までは 2時間45分 = 2.75時間
    const expected_elapsed_hours = 2.75;
    expect(result.elapsed_hours_decimal).toBe(expected_elapsed_hours);

    // 期待結果2: SLA内完了フラグ（2.75時間 < 24時間なので true）
    expect(result.is_within_sla).toBe(true);

    // 期待結果3: SLA違反アラート
    expect(result.sla_violation_alert_issued).toBe(false);

    // 期待結果4: 各フェーズの完了時刻が正確に記録されている
    expect(result.application_sent_at).toEqual(application_sent_at);
    expect(result.approval_completed_at).toEqual(approval_completed_at);
    expect(result.billing_data_reflected_at).toEqual(billing_data_reflected_at);

    // 期待結果5: 契約マスター更新フラグ
    expect(result.contract_master_updated).toBe(true);

    // 期待結果6: 請求データベース反映フラグ
    expect(result.billing_database_reflected).toBe(true);

    // 期待結果7: 契約変更内容が正確に記録されている
    expect(result.recorded_change_content).toEqual(change_content);

    // 期待結果8: 処理ステータスが「完了」
    expect(result.process_status).toBe("completed");

    // 期待結果9: 契約ID、顧客ユーザーIDが保持されている
    expect(result.contract_id).toBe(contract_id);
    expect(result.customer_user_id).toBe(customer_user_id);
  });

  test("SCEN-1229: SLA超過時のアラート発生（SLA違反ケース）", () => {
    // SLA超過シナリオ: 申請から請求反映まで30時間かかった場合
    const application_sent_at = new Date("2024-06-15T09:00:00Z");
    const approval_completed_at = new Date("2024-06-15T15:00:00Z");
    const billing_data_reflected_at = new Date("2024-06-16T15:00:00Z"); // 翌日15:00（30時間後）
    const sla_time_limit_hours = 24;
    const contract_id = "CONT-2024-002";
    const customer_user_id = "USR-CUST-002";
    const change_content = {
      service_name: "Standard Service",
      billing_amount: 100000,
      effective_date: "2024-07-15",
    };

    const result = defineContractChangeSLAManagement({
      contract_id,
      customer_user_id,
      application_sent_at,
      approval_completed_at,
      billing_data_reflected_at,
      sla_time_limit_hours,
      change_content,
    });

    // 期待結果: 30時間経過（24時間超過）
    const expected_elapsed_hours = 30;
    expect(result.elapsed_hours_decimal).toBe(expected_elapsed_hours);

    // SLA違反（30時間 > 24時間）
    expect(result.is_within_sla).toBe(false);

    // SLA違反アラート発行
    expect(result.sla_violation_alert_issued).toBe(true);

    // 処理ステータスが「完了（SLA超過）」
    expect(result.process_status).toBe("completed_sla_exceeded");
  });

  test("SCEN-1229: エラーケース - 必須パラメータ欠落", () => {
    // 申請送信時刻が null の場合
    expect(() => {
      defineContractChangeSLAManagement({
        contract_id: "CONT-2024-003",
        customer_user_id: "USR-CUST-003",
        application_sent_at: null as any,
        approval_completed_at: new Date("2024-06-15T10:00:00Z"),
        billing_data_reflected_at: new Date("2024-06-15T11:00:00Z"),
        sla_time_limit_hours: 24,
        change_content: {
          service_name: "Test Service",
          billing_amount: 50000,
          effective_date: "2024-07-01",
        },
      });
    }).toThrow(/申請送信時刻/);
  });

  test("SCEN-1229: エラーケース - 時刻順序が不正", () => {
    // 承認完了が申請送信より前の場合
    expect(() => {
      defineContractChangeSLAManagement({
        contract_id: "CONT-2024-004",
        customer_user_id: "USR-CUST-004",
        application_sent_at: new Date("2024-06-15T10:00:00Z"),
        approval_completed_at: new Date("2024-06-15T09:00:00Z"), // 申請より前
        billing_data_reflected_at: new Date("2024-06-15T11:00:00Z"),
        sla_time_limit_hours: 24,
        change_content: {
          service_name: "Test Service",
          billing_amount: 50000,
          effective_date: "2024-07-01",
        },
      });
    }).toThrow(/時刻順序/);
  });

  test("SCEN-1229: エラーケース - SLA時間が不正", () => {
    // SLA時間が0以下の場合
    expect(() => {
      defineContractChangeSLAManagement({
        contract_id: "CONT-2024-005",
        customer_user_id: "USR-CUST-005",
        application_sent_at: new Date("2024-06-15T09:00:00Z"),
        approval_completed_at: new Date("2024-06-15T10:00:00Z"),
        billing_data_reflected_at: new Date("2024-06-15T11:00:00Z"),
        sla_time_limit_hours: -1, // 不正な値
        change_content: {
          service_name: "Test Service",
          billing_amount: 50000,
          effective_date: "2024-07-01",
        },
      });
    }).toThrow(/SLA時間/);
  });

  test("SCEN-1229: エラーケース - 契約ID形式が不正", () => {
    expect(() => {
      defineContractChangeSLAManagement({
        contract_id: "", // 空の契約ID
        customer_user_id: "USR-CUST-006",
        application_sent_at: new Date("2024-06-15T09:00:00Z"),
        approval_completed_at: new Date("2024-06-15T10:00:00Z"),
        billing_data_reflected_at: new Date("2024-06-15T11:00:00Z"),
        sla_time_limit_hours: 24,
        change_content: {
          service_name: "Test Service",
          billing_amount: 50000,
          effective_date: "2024-07-01",
        },
      });
    }).toThrow(/契約ID/);
  });

  test("SCEN-1229: SLA正常完了 - 複数フェーズの時刻記録精度", () => {
    // より正確なタイムスタンプ検証
    const application_sent_at = new Date("2024-06-20T14:30:45Z");
    const approval_completed_at = new Date("2024-06-20T15:45:30Z");
    const billing_data_reflected_at = new Date("2024-06-20T16:22:15Z");
    const sla_time_limit_hours = 24;
    const contract_id = "CONT-2024-006";
    const customer_user_id = "USR-CUST-007";
    const change_content = {
      service_name: "Enterprise Service",
      billing_amount: 500000,
      effective_date: "2024-08-01",
    };

    const result = defineContractChangeSLAManagement({
      contract_id,
      customer_user_id,
      application_sent_at,
      approval_completed_at,
      billing_data_reflected_at,
      sla_time_limit_hours,
      change_content,
    });

    // 申請送信から請求反映完了までの経過時間
    // 14:30:45 から 16:22:15 = 1時間51分30秒 = 1.858333... 時間
    const expected_elapsed_minutes = 111.5; // 1時間51分30秒
    const expected_elapsed_hours = expected_elapsed_minutes / 60; // 約1.858時間
    expect(result.elapsed_hours_decimal).toBeCloseTo(expected_elapsed_hours, 2);

    // SLA内に完了
    expect(result.is_within_sla).toBe(true);
    expect(result.sla_violation_alert_issued).toBe(false);

    // 各フェーズの時刻が正確に記録
    expect(result.application_sent_at).toEqual(application_sent_at);
    expect(result.approval_completed_at).toEqual(approval_completed_at);
    expect(result.billing_data_reflected_at).toEqual(billing_data_reflected_at);

    // 契約・請求データが反映
    expect(result.contract_master_updated).toBe(true);
    expect(result.billing_database_reflected).toBe(true);
    expect(result.process_status).toBe("completed");
  });
});