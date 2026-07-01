import { describe, test, expect } from "@jest/globals";
import {
  sendContractChangeNotification,
  type ContractChangeNotificationInput,
  type ContractChangeNotificationResult,
} from "../../src/logic/it-1-1-1";

describe("営業成果データの自動検証ルール定義と異常検出機能", () => {
  // SCEN-1072: [error] 契約・成果物変更通知機能 - 顧客企業の営業責任者の連絡先が未設定の場合、エラーを返して処理が中断される
  test("should return error when contact email is not set for sales manager", () => {
    const input: ContractChangeNotificationInput = {
      customerId: "CUST-001",
      contractId: "CONTRACT-2024-001",
      changeType: "contract_update",
      changeContent: "Updated service period from 6 months to 12 months",
      changedAt: new Date("2024-06-15T10:30:00Z"),
      salesManagerEmail: "", // 連絡先が未設定
      changeDescription: "Extended contract duration",
    };

    expect(() => sendContractChangeNotification(input)).toThrow(/連絡先/);
  });

  // ハッピーパス: 連絡先が正常に設定されている場合、通知が正常に送信される
  test("should successfully send notification when contact email is properly set", () => {
    const input: ContractChangeNotificationInput = {
      customerId: "CUST-002",
      contractId: "CONTRACT-2024-002",
      changeType: "delivery_schedule_update",
      changeContent: "Updated delivery date from 2024-07-31 to 2024-08-15",
      changedAt: new Date("2024-06-20T14:45:00Z"),
      salesManagerEmail: "sales-manager@customer.com",
      changeDescription: "Adjusted delivery timeline due to client request",
    };

    const result: ContractChangeNotificationResult =
      sendContractChangeNotification(input);

    expect(result.success).toBe(true);
    expect(result.notificationId).toMatch(/^NOTIF-/);
    expect(result.sentAt).toEqual(new Date("2024-06-20T14:45:00Z"));
    expect(result.recipientEmail).toBe("sales-manager@customer.com");
    expect(result.customerId).toBe("CUST-002");
    expect(result.contractId).toBe("CONTRACT-2024-002");
  });

  // 境界値テスト: 連絡先がnullの場合
  test("should throw error when contact email is null", () => {
    const input: ContractChangeNotificationInput = {
      customerId: "CUST-003",
      contractId: "CONTRACT-2024-003",
      changeType: "contract_update",
      changeContent: "Price adjustment",
      changedAt: new Date("2024-06-25T09:00:00Z"),
      salesManagerEmail: null as any,
      changeDescription: "Contract price update",
    };

    expect(() => sendContractChangeNotification(input)).toThrow(/連絡先/);
  });

  // 境界値テスト: 連絡先が空白文字のみの場合
  test("should throw error when contact email is whitespace only", () => {
    const input: ContractChangeNotificationInput = {
      customerId: "CUST-004",
      contractId: "CONTRACT-2024-004",
      changeType: "contract_update",
      changeContent: "Service scope change",
      changedAt: new Date("2024-06-28T13:20:00Z"),
      salesManagerEmail: "   ",
      changeDescription: "Modified service scope",
    };

    expect(() => sendContractChangeNotification(input)).toThrow(/連絡先/);
  });

  // 成功パス: 複数の変更タイプに対応
  test("should handle multiple change types with valid contact", () => {
    const changeTypes: Array<"contract_update" | "delivery_schedule_update"> =
      ["contract_update", "delivery_schedule_update"];

    changeTypes.forEach((changeType) => {
      const input: ContractChangeNotificationInput = {
        customerId: `CUST-${changeType}`,
        contractId: `CONTRACT-${changeType}`,
        changeType: changeType,
        changeContent: `Test change for ${changeType}`,
        changedAt: new Date("2024-07-01T10:00:00Z"),
        salesManagerEmail: "manager@example.com",
        changeDescription: `Description for ${changeType}`,
      };

      const result: ContractChangeNotificationResult =
        sendContractChangeNotification(input);

      expect(result.success).toBe(true);
      expect(result.recipientEmail).toBe("manager@example.com");
      expect(result.changeType).toBe(changeType);
    });
  });
});