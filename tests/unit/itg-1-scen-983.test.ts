import { describe, test, expect } from "@jest/globals";
import {
  classifyCustomerObjection,
} from "../../src/logic/it-1-1-1";

describe("顧客質問・異議の内容分類と対応ルート判定", () => {
  // SCEN-983
  test("契約書との照合が必要な複雑な異議が契約確認後回答ルートに分類される", () => {
    const input = {
      objection_id: "OBJ-2024-001",
      customer_id: "CUST-123",
      contract_id: "CONTRACT-2024-456",
      objection_content:
        "請求額の計算に矛盾があります。契約書の第3条では基本料金が50万円と明記されていますが、今月の請求書では55万円になっています。また、割引条件についても契約書の附則2と現在の適用内容が異なっているようです。",
      objection_detail:
        "契約書第3条と請求内容の不一致、複数の条項にまたがる矛盾の確認が必要",
      objection_type: "billing_discrepancy",
      received_at: new Date("2024-11-15T10:30:00Z"),
      customer_name: "株式会社テスト",
      contact_person: "営業部長 田中太郎",
    };

    const result = classifyCustomerObjection(input);

    expect(result).toEqual({
      objection_id: "OBJ-2024-001",
      classification_category: "contract_verification_required",
      routing_path: "contract_confirmation_then_respond",
      priority_level: "high",
      requires_contract_review: true,
      required_steps: [
        "extract_contract_terms",
        "review_contract_section_3",
        "verify_discount_conditions",
        "calculate_correct_amount",
        "prepare_response",
        "notify_customer",
      ],
      estimated_resolution_days: 3,
      assigned_to_role: "operations_manager",
      response_deadline: new Date("2024-11-18T17:00:00Z"),
      internal_notes:
        "複数の契約条項にまたがる矛盾の検出。契約書第3条と割引条件の附則2の確認が必須。",
      complexity_score: 8,
      auto_response_eligible: false,
    });

    expect(result.routing_path).toBe("contract_confirmation_then_respond");
    expect(result.requires_contract_review).toBe(true);
    expect(result.classification_category).toBe("contract_verification_required");
    expect(result.priority_level).toBe("high");
    expect(result.auto_response_eligible).toBe(false);
    expect(result.required_steps.length).toBe(6);
    expect(result.required_steps).toContain("review_contract_section_3");
    expect(result.required_steps).toContain("verify_discount_conditions");
    expect(result.complexity_score).toBeGreaterThanOrEqual(8);
    expect(result.estimated_resolution_days).toBeGreaterThanOrEqual(3);
    expect(result.assigned_to_role).toBe("operations_manager");
  });
});