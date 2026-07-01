import { describe, test, expect } from "@jest/globals";
import {
  validateSalesDataTypesAndQuality,
} from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データ品質検証 - データ型不整合検出", () => {
  // SCEN-941: [normal] 営業データ品質検証・異常検出機能 - データ型が不整合なデータが検出され、特定・通知される
  test("データ型が不整合なレコードが特定され、詳細情報を含む通知が送信される", () => {
    // 入力: データ型不整合を含むデータセット
    const sales_data_with_type_mismatch = [
      {
        row_number: 1,
        customer_id: "CUST001",
        amount: 50000,
        contact_date: "2024-01-15",
        appointment_confirmed: true,
      },
      {
        row_number: 2,
        customer_id: "CUST@#$002", // 特殊文字を含む（期待: 英数字のみ）
        amount: "75,000", // 文字列値（期待: 数値）
        contact_date: "2024-01-16",
        appointment_confirmed: true,
      },
      {
        row_number: 3,
        customer_id: "CUST003",
        amount: 120000,
        contact_date: 20240117, // 数値型（期待: YYYY-MM-DD 文字列）
        appointment_confirmed: false,
      },
      {
        row_number: 4,
        customer_id: "CUST004",
        amount: -5000, // 負の数値（期待: 正数のみ）
        contact_date: "2024-01-18",
        appointment_confirmed: "yes", // 文字列（期待: boolean）
      },
    ];

    // 期待される品質検証ルール定義
    const validation_rules = {
      customer_id: {
        type: "string",
        pattern: /^[A-Z0-9]+$/,
        description: "顧客ID: 英数大文字のみ",
      },
      amount: {
        type: "number",
        min: 0,
        max: 9999999,
        description: "金額: 0以上9999999以下の数値",
      },
      contact_date: {
        type: "string",
        pattern: /^\d{4}-\d{2}-\d{2}$/,
        description: "接触日付: YYYY-MM-DD形式",
      },
      appointment_confirmed: {
        type: "boolean",
        description: "アポ確定: true/false",
      },
    };

    // 関数実行
    const result = validateSalesDataTypesAndQuality(
      sales_data_with_type_mismatch,
      validation_rules
    );

    // 期待結果の検証

    // 1. 検出されたエラー件数は3件（行2, 3, 4が不整合）
    expect(result.validation_errors.length).toBe(3);

    // 2. 行2のエラー内容の確認：複数フィールドの不整合
    const row2_errors = result.validation_errors.filter(
      (err) => err.row_number === 2
    );
    expect(row2_errors.length).toBe(2); // customer_id と amount の2つのエラー
    expect(row2_errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          row_number: 2,
          column_name: "customer_id",
          expected_type: "string",
          expected_pattern: "^[A-Z0-9]+$",
          actual_value: "CUST@#$002",
          actual_type: "string",
          error_reason: expect.stringMatching(/特殊文字/),
        }),
        expect.objectContaining({
          row_number: 2,
          column_name: "amount",
          expected_type: "number",
          actual_value: "75,000",
          actual_type: "string",
          error_reason: expect.stringMatching(/データ型/),
        }),
      ])
    );

    // 3. 行3のエラー内容の確認：日付フィールドが数値型
    const row3_errors = result.validation_errors.filter(
      (err) => err.row_number === 3
    );
    expect(row3_errors.length).toBe(1);
    expect(row3_errors[0]).toEqual(
      expect.objectContaining({
        row_number: 3,
        column_name: "contact_date",
        expected_type: "string",
        expected_pattern: "^\\d{4}-\\d{2}-\\d{2}$",
        actual_value: 20240117,
        actual_type: "number",
        error_reason: expect.stringMatching(/日付形式/),
      })
    );

    // 4. 行4のエラー内容の確認：複数フィールドの不整合
    const row4_errors = result.validation_errors.filter(
      (err) => err.row_number === 4
    );
    expect(row4_errors.length).toBe(2); // amount と appointment_confirmed
    expect(row4_errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          row_number: 4,
          column_name: "amount",
          expected_type: "number",
          expected_range: { min: 0, max: 9999999 },
          actual_value: -5000,
          error_reason: expect.stringMatching(/範囲外/),
        }),
        expect.objectContaining({
          row_number: 4,
          column_name: "appointment_confirmed",
          expected_type: "boolean",
          actual_value: "yes",
          actual_type: "string",
          error_reason: expect.stringMatching(/データ型/),
        }),
      ])
    );

    // 5. 通知対象者の確認：管理者および関連ユーザー
    expect(result.notification.notification_enabled).toBe(true);
    expect(result.notification.recipients).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          recipient_type: "admin",
          user_role: "代表兼営業オペレーター",
        }),
        expect.objectContaining({
          recipient_type: "stakeholder",
          user_role: "品質管理担当者",
        }),
      ])
    );

    // 6. 通知メッセージに不整合の詳細情報が含まれていることを確認
    expect(result.notification.message).toMatch(/データ型/);
    expect(result.notification.message).toMatch(/不整合/);
    expect(result.notification.message).toMatch(/フィールド名/);
    expect(result.notification.message).toMatch(/期待される型/);
    expect(result.notification.message).toMatch(/実際の値/);

    // 7. 通知メッセージに改善措置の提案が含まれていることを確認
    expect(result.notification.message).toMatch(/修正/);
    expect(result.notification.message).toMatch(/手順/);

    // 8. 検証結果レポートが生成されていることを確認
    expect(result.report).toBeDefined();
    expect(result.report.validation_summary).toEqual({
      total_records: 4,
      valid_records: 1,
      invalid_records: 3,
      validation_status: "FAILED",
    });

    // 9. 各不整合レコードの詳細情報がレポートに記載されていることを確認
    expect(result.report.invalid_records_detail).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          row_number: 2,
          invalid_fields: expect.arrayContaining([
            "customer_id",
            "amount",
          ]),
        }),
        expect.objectContaining({
          row_number: 3,
          invalid_fields: expect.arrayContaining(["contact_date"]),
        }),
        expect.objectContaining({
          row_number: 4,
          invalid_fields: expect.arrayContaining([
            "amount",
            "appointment_confirmed",
          ]),
        }),
      ])
    );

    // 10. 通知送信のタイムスタンプが記録されていることを確認
    expect(result.notification.sent_at).toBeDefined();
    expect(new Date(result.notification.sent_at)).toBeInstanceOf(Date);
    expect(result.notification.sent_at).toBe("2024-01-20T10:30:00Z");

    // 11. システムステータスが検証完了で、ユーザーへの手動確認が必要な状態であることを確認
    expect(result.system_status).toBe("VALIDATION_COMPLETED_WITH_ERRORS");
    expect(result.next_action).toBe("MANUAL_REVIEW_REQUIRED");
  });
});