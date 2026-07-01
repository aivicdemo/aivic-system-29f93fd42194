import { judgeBillingCorrectionNeeded } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能", () => {
  // SCEN-987: [normal] 請求内容の再計算・修正判定 - 顧客の異議が契約解釈の相違である場合、修正不要と判定される
  test("契約解釈の相違による異議の場合、修正フラグがfalseで理由が明記される", () => {
    const billing_record = {
      billing_id: "BIL-20240115-001",
      customer_id: "CUST-0001",
      service_id: "SRV-BASIC",
      billing_amount: 50000,
      billing_period_start: new Date("2024-01-01"),
      billing_period_end: new Date("2024-01-31"),
      contract_id: "CTR-0001",
      billing_status: "disputed" as const,
      created_at: new Date("2024-02-01T09:00:00Z"),
      updated_at: new Date("2024-02-05T14:30:00Z"),
    };

    const objection_record = {
      objection_id: "OBJ-20240205-001",
      billing_id: "BIL-20240115-001",
      objection_category: "contract_interpretation_mismatch" as const,
      objection_content:
        "契約書第3条の単価計算において、当社は月額基本料金に成果報酬を加算する解釈であるが、貴社は成果報酬を別途請求すべき項目と解釈している。この相違に基づく請求額の差分が発生している。",
      objection_details: {
        contract_clause: "第3条 料金体系",
        customer_interpretation: "成果報酬は月額基本料金に含まない",
        our_interpretation: "成果報酬は月額基本料金に含まれる",
        disputed_amount: 15000,
      },
      filed_at: new Date("2024-02-05T10:00:00Z"),
      status: "pending_review" as const,
    };

    const contract_definition = {
      contract_id: "CTR-0001",
      service_id: "SRV-BASIC",
      base_monthly_fee: 35000,
      performance_reward_rate: 0.05,
      pricing_clause: "第3条 料金体系",
      pricing_interpretation_note:
        "成果報酬（売上の5%）は月額基本料金とは別立てで請求する項目である。",
    };

    const result = judgeBillingCorrectionNeeded(
      billing_record,
      objection_record,
      contract_definition
    );

    expect(result.correction_needed).toBe(false);
    expect(result.reason).toMatch(/契約解釈の相違/);
    expect(result.reason).toMatch(/修正は対象外/);
    expect(result.objection_category).toBe("contract_interpretation_mismatch");
    expect(result.action_required).toBe("explanation_not_correction");
  });
});