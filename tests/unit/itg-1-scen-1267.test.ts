import { validateContractChangeAgreement } from "../../src/logic/it-1-1-1";

describe("営業成果データの自動検証ルール定義と異常検出機能", () => {
  test("SCEN-1267: 契約変更内容と顧客合意状況の照合・例外検出 - 一致する場合に確定ルートへ進む", () => {
    // 前提: 契約変更内容がシステムに登録され、顧客企業の営業責任者がポータルで変更内容を確認・検証し、合意・承認を実施した状態
    const contract_id = "CTR-2024-001";
    const change_item = "monthly_fee";
    const change_before_value = "100000";
    const change_after_value = "120000";
    const change_applied_date = "2024-02-01";
    const customer_agreement_status = "agreed";
    const customer_agreement_content = {
      item: "monthly_fee",
      before: "100000",
      after: "120000",
      effective_date: "2024-02-01"
    };
    const current_status = "awaiting_approval";

    // 実行: 契約変更内容と顧客合意状況の照合機能を実行
    const result = validateContractChangeAgreement({
      contract_id,
      change_item,
      change_before_value,
      change_after_value,
      change_applied_date,
      customer_agreement_status,
      customer_agreement_content,
      current_status
    });

    // 期待値: 照合ロジックで変更内容と顧客の合意返答を比較し、一致していることを確認
    expect(result.is_valid).toBe(true);
    expect(result.match_status).toBe("complete_match");
    expect(result.exception_detected).toBe(false);

    // 期待値: 一致した場合のルーティング処理が実行され、確定ルートへ進む
    expect(result.routing_target).toBe("confirmation_route");
    expect(result.next_status).toBe("confirmed");

    // 期待値: 契約ステータスが『承認待ち』から『確定』へ更新される
    expect(result.status_transition.from).toBe("awaiting_approval");
    expect(result.status_transition.to).toBe("confirmed");

    // 期待値: 処理履歴に遷移が記録される
    expect(result.audit_log).toBeDefined();
    expect(result.audit_log.transition_type).toBe("agreement_validation_passed");
    expect(result.audit_log.timestamp).toBeDefined();
    expect(result.audit_log.reason).toBe("Change content matches customer agreement exactly");

    // 期待値: エラーや警告なく正常に完了
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
  });
});