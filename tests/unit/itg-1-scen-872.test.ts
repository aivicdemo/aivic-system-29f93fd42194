import { validateContractChangeProposal } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能", () => {
  test("SCEN-872: [error] 契約変更妥当性判定機能 - 過去の契約条件との矛盾や不正な請求額計算が検出された場合に却下判定が出力される", () => {
    // 前提: 過去の契約条件と新しい契約条件が存在し、請求額計算ロジックが定義されている状態
    const pastContractCondition = {
      contract_id: "C20240101",
      customer_id: "CUST001",
      start_date: "2024-01-01",
      end_date: "2024-06-30",
      monthly_fee: 100000,
      unit_price: 5000,
    };

    // 矛盾する新しい契約条件: 契約期間が重複し、料金が大幅に逆転
    const newContractCondition = {
      contract_id: "C20240101",
      customer_id: "CUST001",
      start_date: "2024-04-01", // 過去の契約と重複
      end_date: "2024-12-31",
      monthly_fee: 30000, // 大幅な逆転（100000 → 30000）
      unit_price: 2000, // 単価も逆転（5000 → 2000）
    };

    // 不正な請求額計算ロジック: 結果が意図的に矛盾
    const invalidBillingLogic = {
      calculation_method: "monthly_fee * quantity",
      expected_amount: 300000, // 正常: 100000 * 3 ヶ月
      actual_amount_with_new_contract: 90000, // 不正: 30000 * 3 ヶ月では矛盾あり
      discount_rate: 1.5, // 割引率が 100% を超えている不正値
    };

    // 契約変更妥当性判定を実行
    const result = validateContractChangeProposal({
      past_contract: pastContractCondition,
      new_contract: newContractCondition,
      billing_logic: invalidBillingLogic,
    });

    // 期待結果: 契約変更申請が却下判定として処理される
    expect(result.status).toBe("rejected");
    expect(result.rejection_reason).toContain("契約期間");
    expect(result.rejection_reason).toContain("矛盾");

    // 期待結果: 不正な請求額計算が検出される
    expect(result.billing_errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          error_type: "invalid_calculation",
        }),
      ])
    );

    // 期待結果: エラーメッセージが表示される
    expect(result.error_message).toBeDefined();
    expect(result.error_message).toMatch(/契約期間/);

    // 期待結果: 却下理由の詳細が記録される
    expect(result.details).toBeDefined();
    expect(result.details.contradiction_detected).toBe(true);
    expect(result.details.invalid_billing_detected).toBe(true);

    // 期待結果: 処理ステータスが『却下』に更新される
    expect(result.processing_status).toBe("rejected");

    // 期待結果: タイムスタンプが記録される
    expect(result.timestamp).toBeDefined();
    expect(typeof result.timestamp).toBe("string");
  });
});