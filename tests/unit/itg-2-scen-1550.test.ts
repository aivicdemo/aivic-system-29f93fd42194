import { recordManualReviewCorrection } from "../../src/logic/it-6-2-2-1";

describe("運用マニュアルレビュー修正指示記録", () => {
  test("SCEN-1550: 判定ロジックセクション不適合時、修正指示が正確に記録される", () => {
    // Arrange: テスト入力データ
    const reviewInput = {
      manual_id: "MAN20240601001",
      section_name: "判定ロジック",
      department_head_name: "田中太郎",
      department_head_id: "USR20240001",
      review_date: "2024-06-15T10:30:00Z",
      evaluation_result: "不適合",
      non_conformance_reason:
        "ロジック条件が曖昧であり、実装要件と矛盾している",
      correction_instruction:
        "相場乖離率の判定閾値を明確に定義し、地域別・工種別の補正係数を具体値で記載すること。相場判定の優先順位ルールをフローチャートで明示すること。",
      affected_departments: ["査定部門A", "査定部門B"],
    };

    // Act: 修正指示を記録
    const result = recordManualReviewCorrection(reviewInput);

    // Assert: 修正指示IDが自動採番されている
    expect(result.correction_id).toMatch(/^COR\d{10}$/);

    // Assert: 記録日時が ISO 形式で返される
    expect(result.recorded_datetime).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
    );

    // Assert: 査定部署長名が正確に記録されている
    expect(result.department_head_name).toBe("田中太郎");

    // Assert: 部門ID が正確に記録されている
    expect(result.department_head_id).toBe("USR20240001");

    // Assert: 不適合理由が正確に記録されている
    expect(result.non_conformance_reason).toBe(
      "ロジック条件が曖昧であり、実装要件と矛盾している"
    );

    // Assert: 修正指示内容が正確に記録されている
    expect(result.correction_instruction).toBe(
      "相場乖離率の判定閾値を明確に定義し、地域別・工種別の補正係数を具体値で記載すること。相場判定の優先順位ルールをフローチャートで明示すること。"
    );

    // Assert: ステータスが未対応（初期状態）で記録されている
    expect(result.status).toBe("未対応");

    // Assert: マニュアルセクション情報が記録されている
    expect(result.manual_id).toBe("MAN20240601001");
    expect(result.section_name).toBe("判定ロジック");

    // Assert: 対象部門リストが正確に記録されている
    expect(result.affected_departments).toEqual([
      "査定部門A",
      "査定部門B",
    ]);

    // Assert: 影響を受ける査定員数が正確に計算されている
    expect(result.affected_assessor_count).toBe(30);

    // Assert: 修正指示の完了期限が自動計算されている（記録日時から5営業日）
    expect(result.due_date).toBe("2024-06-24T23:59:59Z");

    // Assert: 返り値に永続化フラグが含まれている
    expect(result.persisted).toBe(true);

    // Assert: 通知送信フラグが含まれている
    expect(result.notification_sent).toBe(true);

    // Assert: 通知送信対象が含まれている
    expect(result.notification_recipients).toEqual([
      "査定部門A",
      "査定部門B",
    ]);

    // Assert: 修正指示レコードが構造化された形で保持されている
    expect(result).toHaveProperty("correction_id");
    expect(result).toHaveProperty("recorded_datetime");
    expect(result).toHaveProperty("department_head_name");
    expect(result).toHaveProperty("non_conformance_reason");
    expect(result).toHaveProperty("correction_instruction");
    expect(result).toHaveProperty("status");
    expect(result).toHaveProperty("persisted");
    expect(result).toHaveProperty("notification_sent");

    // Assert: すべての必須フィールドが存在し、値が空でない
    expect(result.correction_id).toBeTruthy();
    expect(result.recorded_datetime).toBeTruthy();
    expect(result.department_head_name).toBeTruthy();
    expect(result.non_conformance_reason).toBeTruthy();
    expect(result.correction_instruction).toBeTruthy();
    expect(result.status).toBeTruthy();
  });
});