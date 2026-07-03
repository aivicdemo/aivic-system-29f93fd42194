import { recordReportFeedback } from "../../src/logic/it-1-1-1";

describe("営業成果データの自動検証ルール定義と異常検出機能", () => {
  // SCEN-1286: [error] レポートフィードバック記録・分類・反映 - フィードバック内容が不正な形式の場合、エラーを返しフィードバック登録が中止される
  test("should reject feedback with invalid format and not persist to database", () => {
    // テスト前提: レポートフィードバック記録画面にアクセス可能な状態
    // 不正な形式のフィードバック内容を複数パターン検証

    // パターン1: HTMLタグを含むフィードバック
    const feedback_with_html_tag = {
      report_id: "RPT-2024-01-001",
      feedback_content: "<script>alert('xss')</script>",
      feedback_type: "data_accuracy",
      submitted_by_user_id: "USR-123",
      submitted_at: new Date("2024-01-15T10:30:00Z"),
    };

    expect(() => recordReportFeedback(feedback_with_html_tag)).toThrow(
      /フォーマット/
    );

    // パターン2: 特殊文字のみで構成されたフィードバック
    const feedback_with_only_special_chars = {
      report_id: "RPT-2024-01-002",
      feedback_content: "!@#$%^&*()",
      feedback_type: "completeness",
      submitted_by_user_id: "USR-124",
      submitted_at: new Date("2024-01-15T10:35:00Z"),
    };

    expect(() => recordReportFeedback(feedback_with_only_special_chars)).toThrow(
      /フォーマット/
    );

    // パターン3: スクリプトを含むフィードバック
    const feedback_with_script = {
      report_id: "RPT-2024-01-003",
      feedback_content: "function malicious() { return; }",
      feedback_type: "calculation_accuracy",
      submitted_by_user_id: "USR-125",
      submitted_at: new Date("2024-01-15T10:40:00Z"),
    };

    expect(() => recordReportFeedback(feedback_with_script)).toThrow(
      /フォーマット/
    );

    // パターン4: 空文字列フィードバック
    const feedback_with_empty_content = {
      report_id: "RPT-2024-01-004",
      feedback_content: "",
      feedback_type: "other",
      submitted_by_user_id: "USR-126",
      submitted_at: new Date("2024-01-15T10:45:00Z"),
    };

    expect(() => recordReportFeedback(feedback_with_empty_content)).toThrow(
      /フォーマット/
    );

    // パターン5: 正当なフォーマット（制御文字を含まない通常テキスト）は登録成功
    const valid_feedback = {
      report_id: "RPT-2024-01-005",
      feedback_content:
        "レポートの集計値に誤差がある。前月比で異常値を検出したため修正を求める。",
      feedback_type: "data_accuracy",
      submitted_by_user_id: "USR-127",
      submitted_at: new Date("2024-01-15T10:50:00Z"),
    };

    const result = recordReportFeedback(valid_feedback);

    expect(result).toEqual({
      feedback_id: expect.any(String),
      report_id: "RPT-2024-01-005",
      feedback_content:
        "レポートの集計値に誤差がある。前月比で異常値を検出したため修正を求める。",
      feedback_type: "data_accuracy",
      feedback_status: "received",
      submitted_by_user_id: "USR-127",
      submitted_at: new Date("2024-01-15T10:50:00Z"),
      created_at: expect.any(Date),
    });

    expect(result.feedback_id).toMatch(/^FBK-\d{4}-\d{2}-\d{2}-[A-Z0-9]+$/);
    expect(result.feedback_status).toBe("received");
  });
});