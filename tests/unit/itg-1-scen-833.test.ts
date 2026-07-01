import { describe, test, expect } from "@jest/globals";
import { recordSalesInteractionHistory } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能", () => {
  // SCEN-833: [error] 対応履歴の自動記録機能 - 対応内容が空の場合、エラーが返却される
  test("対応内容が空の場合、エラーメッセージが返却されて対応履歴が保存されない", () => {
    const input = {
      customerId: "CUST001",
      interactionDate: new Date("2024-03-15T09:30:00Z"),
      interactionType: "phone_call",
      interactionContent: "",
      recordedBy: "user_123",
      recordedAt: new Date("2024-03-15T09:35:00Z"),
    };

    expect(() => recordSalesInteractionHistory(input)).toThrow(
      /対応内容/
    );
  });
});