import { detectEstimateFormatInconsistency } from "../../src/logic/it-6-3-1";

describe("判定基準・学習データ版管理機能 - 見積フォーマット変更時の学習データ矛盾検出", () => {
  test("SCEN-933: 見積フォーマット変更で学習データ構造に矛盾が生じる場合、エラー通知が発生する", () => {
    // 前提: 既存の構造化済み学習データセット
    const existing_learning_data_fields = [
      "estimate_id",
      "work_type",
      "unit_price",
      "quantity",
      "subtotal",
      "region",
      "season",
    ];

    // 前提: 既存の見積フォーマット定義
    const original_estimate_format = {
      format_version: "1.0",
      fields: [
        { name: "estimate_id", type: "string", required: true },
        { name: "work_type", type: "string", required: true },
        { name: "unit_price", type: "number", required: true },
        { name: "quantity", type: "number", required: true },
        { name: "subtotal", type: "number", required: false },
        { name: "region", type: "string", required: true },
        { name: "season", type: "string", required: false },
      ],
    };

    // トリガー: 見積フォーマット変更（フィールド削除、データ型変更、必須項目追加）
    const modified_estimate_format = {
      format_version: "2.0",
      fields: [
        { name: "estimate_id", type: "string", required: true },
        { name: "work_type", type: "string", required: true },
        { name: "unit_price", type: "number", required: true },
        // "quantity" フィールドを削除
        { name: "subtotal", type: "number", required: true }, // 必須変更
        { name: "region", type: "string", required: true },
        { name: "season", type: "string", required: true }, // 必須変更
        { name: "discount_rate", type: "number", required: false }, // 新規追加
      ],
    };

    // 実行: 矛盾検出関数を呼び出し
    const result = detectEstimateFormatInconsistency({
      existing_learning_data_fields: existing_learning_data_fields,
      original_format_definition: original_estimate_format,
      modified_format_definition: modified_estimate_format,
      learning_data_id: "ld_001",
      timestamp: "2024-01-15T11:00:00Z",
    });

    // 期待値: エラー通知が発生し、矛盾内容が明記されている
    expect(result.is_inconsistency_detected).toBe(true);
    expect(result.inconsistency_type).toBe("field_structure_mismatch");
    expect(result.error_count).toBe(3);

    // 矛盾内容の詳細検証
    expect(result.inconsistencies).toEqual([
      {
        field_name: "quantity",
        inconsistency_reason: "フィールド削除",
        severity: "critical",
        message:
          'フィールド「quantity」がフォーマット変更により削除されましたが、学習データに存在します',
      },
      {
        field_name: "subtotal",
        inconsistency_reason: "必須フラグ変更",
        severity: "high",
        message:
          'フィールド「subtotal」が非必須から必須に変更されました。既存の学習データに null 値が含まれている可能性があります',
      },
      {
        field_name: "season",
        inconsistency_reason: "必須フラグ変更",
        severity: "high",
        message:
          'フィールド「season」が非必須から必須に変更されました。既存の学習データに null 値が含まれている可能性があります',
      },
    ]);

    // エラーメッセージの通知内容を確認
    expect(result.user_notification_message).toMatch(/フィールド「quantity」/);
    expect(result.user_notification_message).toMatch(/削除されました/);
    expect(result.user_notification_message).toMatch(/学習データに存在します/);

    // エラーがシステムログに記録されていることを確認
    expect(result.system_log_recorded).toBe(true);
    expect(result.log_entry).toEqual({
      log_id: expect.stringMatching(/^log_/),
      timestamp: "2024-01-15T11:00:00Z",
      event_type: "format_inconsistency_detected",
      severity_level: "ERROR",
      learning_data_id: "ld_001",
      original_format_version: "1.0",
      modified_format_version: "2.0",
      inconsistency_count: 3,
      details: expect.arrayContaining([
        expect.objectContaining({
          field_name: "quantity",
          inconsistency_reason: "フィールド削除",
        }),
      ]),
    });

    // ユーザーがフォーマット変更を完了する前に矛盾を解決するよう促されることを確認
    expect(result.action_required).toBe(true);
    expect(result.recommended_actions).toContain(
      "既存の学習データ構造を新フォーマットに対応させる"
    );
    expect(result.recommended_actions).toContain(
      "フォーマット変更前に学習データを再構造化する"
    );
    expect(result.can_proceed_with_format_change).toBe(false);
  });
});