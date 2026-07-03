import { describe, test, expect, beforeEach } from "@jest/globals";
import {
  analyzeDisputeAndDetectExceptionPattern,
  evaluateExistingRuleFeasibility,
} from "../../src/logic/it-1781935279444-1-1-1";

describe("営業データ項目のメタデータ管理機能 - 請求ルール例外ケース検出と手順書更新判定", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-975: [error] 請求ルール例外ケース検出と手順書更新判定 - 異議内容の分析結果、判断基準の曖昧さが原因と判定されるが、既存ルール内での対応可能と誤判定される
  test("異議内容から判断基準の曖昧さを検出し、手順書更新判定で誤判定が発生する", () => {
    // 【前提】
    // - 顧客企業から請求内容に関する質問・異議が寄せられている
    // - 異議内容として「判断基準が曖昧であるケース」が存在する
    // - 既存の請求ルールマッピングと手順書が登録されている

    // 【トリガー】
    // 代表兼営業オペレーターが異議内容を分析エンジンに入力し、原因判定を実行

    const dispute_input = {
      dispute_id: "DSP-2024-001",
      customer_id: "CUST-A001",
      dispute_type: "calculation_ambiguity",
      dispute_description:
        "請求額の計算基準が明確でなく、割引適用の判断が一貫していない",
      dispute_date: "2024-01-15T10:30:00Z",
      disputed_invoice_amount: 500000,
      expected_amount: 480000,
      difference_amount: 20000,
    };

    // 【期待結果 1】
    // 異議内容の分析で『判断基準の曖昧さ』が原因として正しく検出される
    const analysis_result = analyzeDisputeAndDetectExceptionPattern(
      dispute_input
    );

    // 分析結果の構造を確認
    expect(analysis_result).toHaveProperty("analysis_id");
    expect(analysis_result).toHaveProperty("dispute_id", "DSP-2024-001");
    expect(analysis_result).toHaveProperty("root_cause");
    expect(analysis_result).toHaveProperty("exception_pattern_detected");
    expect(analysis_result).toHaveProperty("existing_rule_mapping");
    expect(analysis_result).toHaveProperty("manual_review_required");

    // 分析エンジンが『判断基準の曖昧さ』を根本原因として検出
    expect(analysis_result.root_cause).toBe("ambiguous_criteria");

    // 例外パターンが検出されたことを確認
    expect(analysis_result.exception_pattern_detected).toBe(true);

    // 既存ルールマッピングが存在
    expect(Array.isArray(analysis_result.existing_rule_mapping)).toBe(true);
    expect(analysis_result.existing_rule_mapping.length).toBeGreaterThan(0);

    // 既存ルール内に『割引判定ロジック』がマッピングされている
    const discount_mapping = analysis_result.existing_rule_mapping.find(
      (m: { rule_name: string }) => m.rule_name === "discount_determination"
    );
    expect(discount_mapping).toBeDefined();

    // 【期待結果 2】
    // 手順書更新判定ロジックが実行され、既存ルール内での対応可能性を評価する
    const feasibility_evaluation = evaluateExistingRuleFeasibility({
      root_cause: analysis_result.root_cause,
      exception_pattern: analysis_result.exception_pattern_detected,
      existing_rules: analysis_result.existing_rule_mapping,
      dispute_context: {
        dispute_type: dispute_input.dispute_type,
        difference_amount: dispute_input.difference_amount,
        severity: "high",
      },
    });

    // 評価結果の構造を確認
    expect(feasibility_evaluation).toHaveProperty("evaluation_id");
    expect(feasibility_evaluation).toHaveProperty(
      "root_cause",
      "ambiguous_criteria"
    );
    expect(feasibility_evaluation).toHaveProperty("feasibility_verdict");
    expect(feasibility_evaluation).toHaveProperty(
      "explanation_of_verdict"
    );
    expect(feasibility_evaluation).toHaveProperty("coverage_gap_identified");
    expect(feasibility_evaluation).toHaveProperty("manual_review_required");

    // 【誤判定の確認】
    // 手順書更新判定ロジックが『既存ルール内での対応可能』と誤判定される
    // (本来は『新しいルール追加と手順書更新が必要』と判定されるべき)
    expect(feasibility_evaluation.feasibility_verdict).toBe(
      "addressable_by_existing_rules"
    );

    // 誤判定の理由：既存の『割引判定ロジック』が判断基準の曖昧さに対応可能と
    // 誤って評価される
    expect(feasibility_evaluation.explanation_of_verdict).toContain(
      "discount_determination"
    );

    // 実際には coverage_gap（カバレッジギャップ）が存在するはずだが、
    // 誤判定により false と判定される
    expect(feasibility_evaluation.coverage_gap_identified).toBe(false);

    // 手順書更新不要と誤判定される
    expect(feasibility_evaluation.manual_review_required).toBe(false);

    // 【システムログ記録の確認】
    // 判定結果ログが正しく記録されていることを確認
    expect(feasibility_evaluation).toHaveProperty("judgment_log");
    expect(feasibility_evaluation.judgment_log).toHaveProperty(
      "timestamp"
    );
    expect(feasibility_evaluation.judgment_log).toHaveProperty(
      "misclassification_risk"
    );

    // 誤判定リスクが高いことを示す
    expect(feasibility_evaluation.judgment_log.misclassification_risk).toBe(
      "high"
    );

    // 【期待値と実際の判定結果の比較】
    // 期待値：手順書更新が必要
    // 実際の判定結果：対応可能（誤判定）
    const expected_recommendation = "procedure_update_required";
    const actual_recommendation = feasibility_evaluation.feasibility_verdict;

    expect(actual_recommendation).not.toBe(expected_recommendation);
    expect(actual_recommendation).toBe("addressable_by_existing_rules");

    // 判定エラー詳細を確認
    expect(feasibility_evaluation.judgment_log).toHaveProperty(
      "error_details"
    );
    const error_details = feasibility_evaluation.judgment_log.error_details;

    // エラー詳細に『判断基準の曖昧さ』が含まれていること
    expect(error_details).toContain("ambiguous_criteria");

    // エラー詳細に『既存ルールで対応可能と誤判定』が含まれていること
    expect(error_details).toContain(
      "misidentified_as_addressable_by_existing_rules"
    );

    // 誤判定の根本原因：判断基準の曖昧さが既存ルール内に十分に定義されていない
    expect(feasibility_evaluation.judgment_log).toHaveProperty(
      "root_cause_of_misclassification"
    );
    expect(
      feasibility_evaluation.judgment_log.root_cause_of_misclassification
    ).toBe("insufficient_criteria_definition_in_existing_rules");

    // 【最終確認】
    // この誤判定が発生した状態がシステムログに記録されている
    expect(feasibility_evaluation.judgment_log.timestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
    );

    // 判定結果サマリー
    expect(feasibility_evaluation).toHaveProperty("summary");
    expect(feasibility_evaluation.summary).toContain(
      "addressable_by_existing_rules"
    );

    // システムが『対応可能』と表示する一方、実際には新しいルール追加が必要であることが
    // 誤認識される状態が再現される
    expect(feasibility_evaluation.feasibility_verdict).toBe(
      "addressable_by_existing_rules"
    );
    expect(feasibility_evaluation.coverage_gap_identified).toBe(false);

    // にも関わらず、ログには潜在的なギャップが記録されている
    expect(feasibility_evaluation.judgment_log).toHaveProperty(
      "potential_coverage_gap"
    );
    expect(feasibility_evaluation.judgment_log.potential_coverage_gap).toBe(
      true
    );
  });
});