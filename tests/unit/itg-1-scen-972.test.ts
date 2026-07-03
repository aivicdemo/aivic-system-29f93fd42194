import { describe, test, expect } from "@jest/globals";
import {
  validateObjectionAndDetermineFix,
} from "../../src/logic/it-1781935279444-2-1-1";

describe("顧客異議に基づく再計算・修正判定", () => {
  test("SCEN-972: 既存ルール未対応の新規異議ケースでエラーが通知される", () => {
    // Arrange: 既存ルールに該当しない新しい異議ケースを準備
    const unsupportedObjection = {
      objection_id: "OBJ-20240515-001",
      customer_id: "CUST-2024-0123",
      invoice_id: "INV-2024-05-0456",
      objection_type: "novel_rule_case",
      objection_reason:
        "顧客からの新規異議: 既存ルールベースに該当しないケース",
      objection_date: "2024-05-15T14:30:00Z",
      invoice_amount_claimed: 150000,
      objection_requested_amount: 120000,
      rule_category: "unsupported_rule_type",
      supporting_documents: ["doc_001.pdf", "doc_002.pdf"],
    };

    // Act & Assert: 既存ルールマッチング失敗時にエラーがスロー される
    expect(() => validateObjectionAndDetermineFix(unsupportedObjection)).toThrow(
      /既存ルール/
    );
  });
});