import { aggregateNegotiationResults } from "../../src/logic/it-1-br-6-2-1";

describe("査定員別の判定ばらつき率と相場乖離傾向の自動集計・分析機能", () => {
  test("SCEN-1035: 修正前後の金額が同一の場合（乖離率0%）、交渉結果は統計データとして正常に蓄積される", () => {
    // Arrange: 修正前後の金額が同一の交渉結果データを準備
    const negotiation_result = {
      negotiation_id: "NEG-20240115-001",
      initial_quote_amount: 100000,
      modified_quote_amount: 100000,
      negotiation_date: "2024-01-15T14:30:00Z",
      assessor_id: "A001",
      negotiation_reason: "金額確認済み",
      status: "completed",
    };

    // Act: 交渉結果統計集計機能を実行
    const result = aggregateNegotiationResults(negotiation_result);

    // Assert: 乖離率が0%であることを確認
    expect(result.divergence_rate_percent).toBe(0);

    // Assert: 修正前後の金額が正しく記録されていることを確認
    expect(result.initial_amount).toBe(100000);
    expect(result.modified_amount).toBe(100000);

    // Assert: 乖離額が0円であることを確認
    expect(result.divergence_amount).toBe(0);

    // Assert: 統計レコードの必須フィールドが全て揃っていることを確認
    expect(result.negotiation_id).toBe("NEG-20240115-001");
    expect(result.assessor_id).toBe("A001");
    expect(result.negotiation_date).toBe("2024-01-15T14:30:00Z");

    // Assert: 統計データベースへの登録ステータスが成功であることを確認
    expect(result.database_registration_status).toBe("success");

    // Assert: タイムスタンプが記録されていることを確認（ISO形式の日時文字列）
    expect(typeof result.recorded_timestamp).toBe("string");
    expect(result.recorded_timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);

    // Assert: 統計集計レポートへの反映フラグが有効であることを確認
    expect(result.included_in_report).toBe(true);

    // Assert: データ整合性チェック結果が正常（no_issues）であることを確認
    expect(result.data_integrity_status).toBe("no_issues");

    // Assert: 他の統計情報への影響フラグが「影響なし」であることを確認
    expect(result.impact_on_other_statistics).toBe("none");

    // Assert: 全体の集計結果オブジェクトが正しい構造を持つことを確認
    expect(result).toHaveProperty("negotiation_id");
    expect(result).toHaveProperty("divergence_rate_percent");
    expect(result).toHaveProperty("initial_amount");
    expect(result).toHaveProperty("modified_amount");
    expect(result).toHaveProperty("divergence_amount");
    expect(result).toHaveProperty("database_registration_status");
    expect(result).toHaveProperty("recorded_timestamp");
    expect(result).toHaveProperty("included_in_report");
    expect(result).toHaveProperty("data_integrity_status");
    expect(result).toHaveProperty("impact_on_other_statistics");
  });
});