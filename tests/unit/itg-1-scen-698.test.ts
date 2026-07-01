import { validateSalesDataAccuracy } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能", () => {
  // SCEN-698: [error] 営業データ正確性検証機能 - 商談金額と成約金額が大きく乖離している矛盾を検出する
  test("should detect discrepancy between negotiation amount and contract amount exceeding tolerance threshold", () => {
    const negotiation_amount = 1000000;
    const contract_amount = 500000;
    const tolerance_rate = 0.1;
    const case_id = "CASE-001";

    const discrepancy_rate = Math.abs(negotiation_amount - contract_amount) / negotiation_amount;
    const expected_discrepancy_rate = 0.5;

    const result = validateSalesDataAccuracy({
      case_id: case_id,
      negotiation_amount: negotiation_amount,
      contract_amount: contract_amount,
      tolerance_rate: tolerance_rate,
    });

    expect(result.is_valid).toBe(false);
    expect(result.discrepancy_rate).toBe(expected_discrepancy_rate);
    expect(result.error_message).toMatch(/乖離率/);
    expect(result.error_message).toMatch(/50%/);
    expect(result.error_code).toBe("DISCREPANCY_EXCEEDS_THRESHOLD");
    expect(result.case_id).toBe(case_id);
    expect(result.timestamp).toBeDefined();
    expect(typeof result.timestamp).toBe("string");
  });
});