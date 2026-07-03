import { validateBillingAmountWithJustification } from "../../src/logic/it-1-2-1";

describe("営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能", () => {
  test("SCEN-894: 著しい変動があっても根拠があれば妥当と判定される", () => {
    // 前月の請求額
    const previous_month_amount = 100000;

    // 当月の請求額（前月比400%増）
    const current_month_amount = 500000;

    // 変動率を計算
    const variation_rate = (current_month_amount - previous_month_amount) / previous_month_amount;
    expect(variation_rate).toBe(4.0);

    // 著しい変動の閾値（300%以上を著しい変動と判定）
    const significant_change_threshold = 3.0;
    const has_significant_change = variation_rate >= significant_change_threshold;
    expect(has_significant_change).toBe(true);

    // 当月の請求額増加の根拠：新規契約5件追加
    const new_contract_count = 5;
    const estimated_revenue_per_contract = 80000; // 1件あたり8万円と仮定
    const expected_revenue_increase = new_contract_count * estimated_revenue_per_contract;
    expect(expected_revenue_increase).toBe(400000);

    // 実際の請求額増加
    const actual_amount_increase = current_month_amount - previous_month_amount;
    expect(actual_amount_increase).toBe(400000);

    // 根拠ドキュメントの妥当性検証：実際の増加が根拠と一致するか
    const justification_doc = {
      type: "new_contract_documentation",
      new_contract_count: 5,
      estimated_revenue_per_contract: 80000,
      total_expected_increase: 400000,
      supporting_documents: ["contract_001.pdf", "contract_002.pdf", "contract_003.pdf", "contract_004.pdf", "contract_005.pdf"]
    };

    // 検証ロジックを実行
    const validation_result = validateBillingAmountWithJustification({
      previous_amount: previous_month_amount,
      current_amount: current_month_amount,
      significant_change_threshold: significant_change_threshold,
      justification: justification_doc
    });

    // 著しい変動フラグが立つことを確認
    expect(validation_result.has_significant_change).toBe(true);

    // 根拠ドキュメントが妥当と判定されることを確認
    expect(validation_result.justification_is_valid).toBe(true);

    // 最終的な判定ステータスが『妥当』であることを確認
    expect(validation_result.final_status).toBe("appropriate");

    // 判定理由が適切に記録されていることを確認
    expect(validation_result.reason).toContain("new_contract");
  });
});