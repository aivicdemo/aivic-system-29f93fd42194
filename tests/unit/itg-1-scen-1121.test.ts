import { describe, test, expect, beforeEach, afterEach, jest } from "@jest/globals";
import {
  validateSalesDataCompleteness,
} from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能", () => {
  let mockCurrentDate: Date;

  beforeEach(() => {
    // 月次業務完了日を固定: 2024-01-31 23:59:59 UTC
    mockCurrentDate = new Date("2024-01-31T23:59:59Z");
    jest.useFakeTimers();
    jest.setSystemTime(mockCurrentDate);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // SCEN-1121: ドキュメント改善管理機能 - 月次業務完了後に発見された課題が定期レビュー日時に自動的に反映対象に追加される
  test("月次業務完了後に検出された課題が定期レビュー日時に反映対象リストへ自動追加され、ステータスが『レビュー対象』に更新される", () => {
    // ========== Arrange ==========
    // 月次業務完了日: 2024-01-31 23:59:59 UTC
    const monthly_completion_date = new Date("2024-01-31T23:59:59Z");

    // 月次業務完了後に検出された課題
    // 検出日時: 2024-02-01 10:30:00 UTC (月次業務完了日の翌日)
    const discovered_issue = {
      issue_id: "ISS-0001",
      title: "営業データ品質チェックで異常値を検出",
      description: "アポ数が前月比200%超で異常値として検出",
      detected_date: new Date("2024-02-01T10:30:00Z"),
      severity_level: "high",
      status: "detected",
      suggested_fix: "営業担当者に確認し、データ入力誤りの有無を確認する手順を追加",
    };

    // 定期レビュー日時: 2024-02-05 09:00:00 UTC (次回スケジュール日)
    const scheduled_review_date = new Date("2024-02-05T09:00:00Z");

    // 月次業務完了後に検出されたすべての課題リスト
    const discovered_issues_after_completion = [discovered_issue];

    // レビュー対象リスト (定期レビュー日時前は空)
    let review_target_list: Array<{
      issue_id: string;
      title: string;
      detected_date: Date;
      status: string;
      added_to_review_date: Date;
    }> = [];

    // ========== Act ==========
    // システムが定期レビュー日時に達した状態をシミュレート
    jest.setSystemTime(scheduled_review_date);

    // 定期レビュー処理: 月次完了後に検出された課題をレビュー対象リストに追加
    const review_target_result = validateSalesDataCompleteness({
      discovered_issues: discovered_issues_after_completion,
      monthly_completion_date: monthly_completion_date,
      scheduled_review_date: scheduled_review_date,
      current_timestamp: scheduled_review_date,
    });

    // レビュー対象リストに課題を追加 (定期レビュー日時での自動追加)
    if (review_target_result.should_add_to_review) {
      review_target_list = review_target_result.items_to_add.map((item) => ({
        issue_id: item.issue_id,
        title: item.title,
        detected_date: item.detected_date,
        status: "review_target",
        added_to_review_date: scheduled_review_date,
      }));
    }

    // ========== Assert ==========
    // 1. 月次業務完了後に検出された課題がレビュー対象リストに追加されているか
    expect(review_target_list).toHaveLength(1);

    // 2. 追加された課題が期待する課題か
    expect(review_target_list[0].issue_id).toBe("ISS-0001");
    expect(review_target_list[0].title).toBe("営業データ品質チェックで異常値を検出");

    // 3. 課題のステータスが『レビュー対象』に更新されているか
    expect(review_target_list[0].status).toBe("review_target");

    // 4. 課題の追加日時が定期レビュー日時と一致しているか
    expect(review_target_list[0].added_to_review_date.toISOString()).toBe(
      "2024-02-05T09:00:00.000Z"
    );

    // 5. 課題の検出日時が月次業務完了日以降であることを確認
    expect(review_target_list[0].detected_date.getTime()).toBeGreaterThan(
      monthly_completion_date.getTime()
    );

    // 6. validateSalesDataCompleteness の戻り値が正確か
    expect(review_target_result.should_add_to_review).toBe(true);
    expect(review_target_result.items_to_add).toHaveLength(1);
    expect(review_target_result.items_to_add[0].issue_id).toBe("ISS-0001");
    expect(review_target_result.review_execution_timestamp.toISOString()).toBe(
      "2024-02-05T09:00:00.000Z"
    );
  });
});