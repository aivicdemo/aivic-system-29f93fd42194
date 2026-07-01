import { validateContractConsistency } from "../../src/logic/it-1781935279444-2-2-1";

describe("契約内容との整合性検証機能", () => {
  // SCEN-921: [error] 契約内容との整合性検証機能 - 契約書の金額と営業データから生成された請求額に不一致がある場合、差異内容を特定できる
  test("契約金額100,000円に対して請求額120,000円の場合、差異内容を検出・特定できる", () => {
    const contract_amount = 100000;
    const billing_amount = 120000;
    const difference_amount = 20000;
    const difference_rate = 20;
    const reason = "単価変更";

    const input_params = {
      contract_id: "CTR-2024-001",
      contract_amount: contract_amount,
      billing_amount: billing_amount,
      difference_reason: reason,
    };

    expect(() => validateContractConsistency(input_params)).toThrow(/契約金額と請求額の不一致/);

    try {
      validateContractConsistency(input_params);
    } catch (error_obj: unknown) {
      const error = error_obj as {
        message: string;
        contract_amount?: number;
        billing_amount?: number;
        difference_amount?: number;
        difference_rate?: number;
        reason?: string;
      };

      expect(error.message).toMatch(/契約金額と請求額の不一致/);
      expect(error.contract_amount).toBe(contract_amount);
      expect(error.billing_amount).toBe(billing_amount);
      expect(error.difference_amount).toBe(difference_amount);
      expect(error.difference_rate).toBe(difference_rate);
      expect(error.reason).toBe(reason);
    }
  });
});