import { describe, test, expect } from "@jest/globals";
import { prioritizeContractChanges } from "../../src/logic/it-1781935279444-1-1-1";

describe("営業データ項目のメタデータ管理機能 - 複数契約変更の優先順序判定", () => {
  test("SCEN-1262: 複数契約変更が請求額計算への影響度に基づいて優先順位付けされ、高影響度から順に処理される", () => {
    // テストデータ準備：異なる影響度を持つ複数の契約変更
    const contractChanges = [
      {
        contract_id: "C001",
        change_type: "address_change",
        description: "請求先住所変更",
        affected_fields: ["billing_address"],
        impact_on_invoice_amount: false,
        priority_score: 0,
      },
      {
        contract_id: "C002",
        change_type: "discount_rate_change",
        description: "割引率変更：10% → 15%",
        affected_fields: ["discount_rate"],
        impact_on_invoice_amount: true,
        discount_rate_old: 0.1,
        discount_rate_new: 0.15,
        priority_score: 0,
      },
      {
        contract_id: "C003",
        change_type: "contract_amount_change",
        description: "契約金額変更：100万円 → 150万円",
        affected_fields: ["contract_amount"],
        impact_on_invoice_amount: true,
        contract_amount_old: 1000000,
        contract_amount_new: 1500000,
        priority_score: 0,
      },
    ];

    // 優先順序判定機能を実行
    const prioritized_changes = prioritizeContractChanges(contractChanges);

    // 処理キューの順序を確認：影響度が高い順に並んでいることを検証
    expect(prioritized_changes.length).toBe(3);

    // 第1位：高影響度（契約金額変更）
    expect(prioritized_changes[0].contract_id).toBe("C003");
    expect(prioritized_changes[0].change_type).toBe("contract_amount_change");
    expect(prioritized_changes[0].priority_score).toBe(3);

    // 第2位：中影響度（割引率変更）
    expect(prioritized_changes[1].contract_id).toBe("C002");
    expect(prioritized_changes[1].change_type).toBe("discount_rate_change");
    expect(prioritized_changes[1].priority_score).toBe(2);

    // 第3位：低影響度（請求先住所変更）
    expect(prioritized_changes[2].contract_id).toBe("C001");
    expect(prioritized_changes[2].change_type).toBe("address_change");
    expect(prioritized_changes[2].priority_score).toBe(1);

    // 各契約変更について、影響度スコアが正しく計算されていることを確認
    expect(prioritized_changes[0].priority_score).toBeGreaterThan(
      prioritized_changes[1].priority_score
    );
    expect(prioritized_changes[1].priority_score).toBeGreaterThan(
      prioritized_changes[2].priority_score
    );

    // 高影響度の契約変更が最初に処理されることを確認
    expect(prioritized_changes[0].priority_score).toBe(3);

    // 請求額の再計算が優先順に実行されることを検証
    const recalculated_invoices = prioritized_changes.map((change) => {
      if (change.change_type === "contract_amount_change") {
        return {
          contract_id: change.contract_id,
          base_amount: change.contract_amount_new,
          expected_invoice_impact: "large",
        };
      } else if (change.change_type === "discount_rate_change") {
        const base_amount = 1000000;
        const discount_diff = (change.discount_rate_new - change.discount_rate_old) * base_amount;
        return {
          contract_id: change.contract_id,
          discount_impact: discount_diff,
          expected_invoice_impact: "medium",
        };
      } else {
        return {
          contract_id: change.contract_id,
          expected_invoice_impact: "none",
        };
      }
    });

    // 最初の再計算（契約金額変更）は請求額に大きな影響を持つ
    expect(recalculated_invoices[0].expected_invoice_impact).toBe("large");

    // 2番目の再計算（割引率変更）は請求額に中程度の影響を持つ
    expect(recalculated_invoices[1].expected_invoice_impact).toBe("medium");
    expect(recalculated_invoices[1].discount_impact).toBe(50000);

    // 3番目の再計算（住所変更）は請求額に影響を持たない
    expect(recalculated_invoices[2].expected_invoice_impact).toBe("none");

    // 処理順序が業務ルール通り実行されることを確認
    expect(prioritized_changes[0].priority_score).toBe(3);
    expect(prioritized_changes[1].priority_score).toBe(2);
    expect(prioritized_changes[2].priority_score).toBe(1);
  });
});