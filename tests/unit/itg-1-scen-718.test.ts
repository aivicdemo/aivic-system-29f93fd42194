import {
  validateAndRevalidateCorrectedData,
} from "../../src/logic/it-1781935279444-2-2-1";

describe("修正データ自動再検証機能", () => {
  // SCEN-718
  test("修正データが品質基準を満たさない場合、不合格判定と追加修正指示が生成される", () => {
    // Arrange: 品質基準の定義
    const qualityStandards = {
      required_fields: ["customer_name", "contact_date", "sales_outcome"],
      field_formats: {
        customer_name: /^.{1,100}$/,
        contact_date: /^\d{4}-\d{2}-\d{2}$/,
        sales_outcome: /^(appointment|contract|follow_up)$/,
      },
      value_ranges: {
        appointment_count: { min: 0, max: 999 },
        contract_value: { min: 0, max: 99999999 },
      },
    };

    // 初回検証で不合格となった修正データ
    const corrected_data_record = {
      id: "record_001",
      customer_name: "顧客A",
      contact_date: "2024/01/15", // 不正形式 (yyyy/mm/dd instead of yyyy-mm-dd)
      sales_outcome: "appointment",
      appointment_count: 5,
      contract_value: 150000,
      correction_attempt: 1,
      status: "pending_revalidation",
      created_at: "2024-01-10T09:00:00Z",
      corrected_at: "2024-01-14T10:30:00Z",
    };

    // Act: 修正データの自動再検証実行
    const revalidation_result = validateAndRevalidateCorrectedData(
      corrected_data_record,
      qualityStandards
    );

    // Assert: 再検証結果が『不合格』であることを確認
    expect(revalidation_result.validation_status).toBe("failed");

    // 不合格理由が『contact_date形式不正』であることを確認
    expect(revalidation_result.failed_validations).toContain(
      expect.objectContaining({
        field_name: "contact_date",
        error_reason: "format_mismatch",
      })
    );

    // 追加修正指示が生成されていることを確認
    expect(revalidation_result.correction_instruction).toBeDefined();
    expect(revalidation_result.correction_instruction).toEqual(
      expect.objectContaining({
        instruction_id: expect.any(String),
        record_id: "record_001",
        correction_items: expect.arrayContaining([
          expect.objectContaining({
            field_name: "contact_date",
            current_value: "2024/01/15",
            expected_format: "YYYY-MM-DD",
            reason: "Date format must be ISO 8601 format (YYYY-MM-DD)",
          }),
        ]),
        correction_deadline: expect.any(String), // ISO形式の期限日時
        priority_level: "high",
      })
    );

    // 修正指示の具体的内容を確認
    expect(revalidation_result.correction_instruction.correction_items).toHaveLength(
      1
    );
    expect(
      revalidation_result.correction_instruction.correction_items[0]
    ).toEqual(
      expect.objectContaining({
        field_name: "contact_date",
        current_value: "2024/01/15",
        expected_format: "YYYY-MM-DD",
        reason: "Date format must be ISO 8601 format (YYYY-MM-DD)",
      })
    );

    // 修正期限が設定されていることを確認 (現在から24時間以内)
    const correction_deadline = new Date(
      revalidation_result.correction_instruction.correction_deadline
    );
    const now = new Date("2024-01-14T10:30:00Z");
    const deadline_hours = (
      (correction_deadline.getTime() - now.getTime()) /
      (1000 * 60 * 60)
    ).toFixed(1);
    expect(parseFloat(deadline_hours)).toBeLessThanOrEqual(24);
    expect(parseFloat(deadline_hours)).toBeGreaterThan(0);

    // システム管理者への通知が記録されていることを確認
    expect(revalidation_result.notifications).toBeDefined();
    expect(revalidation_result.notifications).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          notification_id: expect.any(String),
          recipient_type: "system_administrator",
          message_type: "revalidation_failed",
          record_id: "record_001",
          correction_attempt: 1,
          notified_at: expect.any(String),
        }),
      ])
    );

    // 再検証失敗がログに記録されていることを確認
    expect(revalidation_result.audit_log).toBeDefined();
    expect(revalidation_result.audit_log).toEqual(
      expect.objectContaining({
        event_type: "revalidation_failed",
        record_id: "record_001",
        validation_status: "failed",
        failed_field_count: 1,
        correction_attempt_count: 1,
        timestamp: expect.any(String),
      })
    );

    // 記録の最終ステータスが『再検証不合格』に更新されていることを確認
    expect(revalidation_result.updated_record_status).toBe(
      "revalidation_failed"
    );

    // 次回修正指示の優先度が『高』であることを確認
    expect(revalidation_result.correction_instruction.priority_level).toBe(
      "high"
    );
  });
});