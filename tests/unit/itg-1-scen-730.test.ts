import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import {
  validateFinalDataQualityBeforeReportGeneration,
} from "../../src/logic/it-1781935279444-2-2-1";

describe("月次レポート生成前の最終検証機能", () => {
  test("SCEN-730: 確定済みデータに欠落項目が存在する場合、生成中止と修正指示を発行する", async () => {
    // テストデータセットアップ：確定済みステータスのデータレコード
    const confirmed_record_complete = {
      id: "rec_001",
      customer_id: "cust_123",
      billing_amount: 100000,
      billing_date: "2024-01-31",
      status: "confirmed",
      service_type: "service_A",
      period: "2024-01",
    };

    const confirmed_record_missing_customer_id = {
      id: "rec_002",
      customer_id: null,
      billing_amount: 50000,
      billing_date: "2024-01-31",
      status: "confirmed",
      service_type: "service_B",
      period: "2024-01",
    };

    const confirmed_record_missing_billing_amount = {
      id: "rec_003",
      customer_id: "cust_456",
      billing_amount: null,
      billing_date: "2024-01-31",
      status: "confirmed",
      service_type: "service_A",
      period: "2024-01",
    };

    const confirmed_record_missing_billing_date = {
      id: "rec_004",
      customer_id: "cust_789",
      billing_amount: 75000,
      billing_date: null,
      status: "confirmed",
      service_type: "service_C",
      period: "2024-01",
    };

    const test_records = [
      confirmed_record_complete,
      confirmed_record_missing_customer_id,
      confirmed_record_missing_billing_amount,
      confirmed_record_missing_billing_date,
    ];

    // 最終検証機能を実行
    const validation_result = validateFinalDataQualityBeforeReportGeneration({
      confirmed_records: test_records,
      required_fields: ["customer_id", "billing_amount", "billing_date"],
    });

    // 検証処理がデータベースをスキャンし、確定済みデータの欠落項目をチェック
    expect(validation_result.validation_passed).toBe(false);
    expect(validation_result.generation_status).toBe("stopped");
    expect(validation_result.missing_records_count).toBe(3);

    // 欠落項目が検出された場合の処理フロー確認
    expect(validation_result.missing_records).toHaveLength(3);

    const missing_record_ids = validation_result.missing_records.map(
      (r: { record_id: string }) => r.record_id
    );
    expect(missing_record_ids).toContain("rec_002");
    expect(missing_record_ids).toContain("rec_003");
    expect(missing_record_ids).toContain("rec_004");

    // 欠落項目の詳細情報を検証
    const rec_002_details = validation_result.missing_records.find(
      (r: { record_id: string }) => r.record_id === "rec_002"
    );
    expect(rec_002_details.missing_fields).toContain("customer_id");

    const rec_003_details = validation_result.missing_records.find(
      (r: { record_id: string }) => r.record_id === "rec_003"
    );
    expect(rec_003_details.missing_fields).toContain("billing_amount");

    const rec_004_details = validation_result.missing_records.find(
      (r: { record_id: string }) => r.record_id === "rec_004"
    );
    expect(rec_004_details.missing_fields).toContain("billing_date");

    // システムのレスポンスを検証：修正指示メッセージ生成
    expect(validation_result.correction_instruction_message).toBeDefined();
    expect(validation_result.correction_instruction_message).toMatch(
      /欠落項目/
    );
    expect(validation_result.correction_instruction_message).toMatch(
      /rec_002/
    );
    expect(validation_result.correction_instruction_message).toMatch(
      /rec_003/
    );
    expect(validation_result.correction_instruction_message).toMatch(
      /rec_004/
    );

    // 修正指示がシステムログに記録されていることを確認
    expect(validation_result.system_log_entry).toBeDefined();
    expect(validation_result.system_log_entry.timestamp).toBeDefined();
    expect(validation_result.system_log_entry.event_type).toBe(
      "validation_failure"
    );
    expect(validation_result.system_log_entry.missing_record_count).toBe(3);

    // 担当者への通知が発行されることを確認
    expect(validation_result.notification_issued).toBe(true);
    expect(validation_result.notification_recipients).toContain(
      "operator_representative"
    );

    // レポートファイルが生成されないことを確認
    expect(validation_result.report_file_generated).toBe(false);
    expect(validation_result.report_file_path).toBeNull();

    // エラーステータスが返却されることを確認
    expect(validation_result.error_status).toBe("final_validation_failed");
  });
});