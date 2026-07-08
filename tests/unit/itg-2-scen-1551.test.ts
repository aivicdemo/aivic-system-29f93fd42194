import { calculateManualReviewApprovalStatus } from "../../src/logic/it-6-2-1-1";

describe("査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化", () => {
  // SCEN-1551: [edge] 運用マニュアルの査定部署長レビュー評価 - 全セクション合格と判定された場合、承認フラグが正しく設定される
  test("全セクションが合格と判定された場合、承認フラグが正しく設定され、マニュアルステータスが更新される", () => {
    const reviewData = {
      manual_id: "MAN-20240115-001",
      reviewer_id: "USR-dept-head-001",
      reviewer_name: "査定部署長_太郎",
      review_timestamp: new Date("2024-01-15T14:30:00Z"),
      sections: [
        {
          section_id: "SEC-001",
          section_name: "OCR精度基準",
          evaluation_result: "合格",
          evaluation_comment: "実務要件と完全に適合している",
          evaluation_timestamp: new Date("2024-01-15T14:25:00Z"),
        },
        {
          section_id: "SEC-002",
          section_name: "判定ロジック",
          evaluation_result: "合格",
          evaluation_comment: "システム実装との矛盾なし",
          evaluation_timestamp: new Date("2024-01-15T14:26:00Z"),
        },
        {
          section_id: "SEC-003",
          section_name: "データ更新手順",
          evaluation_result: "合格",
          evaluation_comment: "運用現場で実行可能な手順である",
          evaluation_timestamp: new Date("2024-01-15T14:27:00Z"),
        },
        {
          section_id: "SEC-004",
          section_name: "異常対応フロー",
          evaluation_result: "合格",
          evaluation_comment: "判定基準が明確で応用可能",
          evaluation_timestamp: new Date("2024-01-15T14:28:00Z"),
        },
      ],
      overall_comment: "全セクション合格。本マニュアルは本番運用に適切である。",
    };

    const result = calculateManualReviewApprovalStatus(reviewData);

    // 承認フラグが true で設定されること
    expect(result.approval_flag).toBe(true);

    // マニュアルステータスが「承認済み」に更新されること
    expect(result.manual_status).toBe("承認済み");

    // レビュー完了日時が記録されること（正確に一致）
    expect(result.review_completed_timestamp).toEqual(
      new Date("2024-01-15T14:30:00Z")
    );

    // レビュアー情報が記録されること
    expect(result.reviewer_id).toBe("USR-dept-head-001");
    expect(result.reviewer_name).toBe("査定部署長_太郎");

    // セクション合格数が 4 に一致すること
    expect(result.passed_section_count).toBe(4);

    // 全セクション数が 4 に一致すること
    expect(result.total_section_count).toBe(4);

    // 合格率が 100% に一致すること
    expect(result.pass_rate_percent).toBe(100);

    // 各セクションの評価結果が正しく記録されること
    expect(result.sections_evaluation_summary).toHaveLength(4);
    expect(result.sections_evaluation_summary[0]).toEqual({
      section_id: "SEC-001",
      section_name: "OCR精度基準",
      evaluation_result: "合格",
      evaluation_comment: "実務要件と完全に適合している",
    });
    expect(result.sections_evaluation_summary[1]).toEqual({
      section_id: "SEC-002",
      section_name: "判定ロジック",
      evaluation_result: "合格",
      evaluation_comment: "システム実装との矛盾なし",
    });
    expect(result.sections_evaluation_summary[2]).toEqual({
      section_id: "SEC-003",
      section_name: "データ更新手順",
      evaluation_result: "合格",
      evaluation_comment: "運用現場で実行可能な手順である",
    });
    expect(result.sections_evaluation_summary[3]).toEqual({
      section_id: "SEC-004",
      section_name: "異常対応フロー",
      evaluation_result: "合格",
      evaluation_comment: "判定基準が明確で応用可能",
    });

    // 総合評価コメントが記録されること
    expect(result.overall_evaluation_comment).toBe(
      "全セクション合格。本マニュアルは本番運用に適切である。"
    );

    // マニュアル ID が保持されること
    expect(result.manual_id).toBe("MAN-20240115-001");
  });
});