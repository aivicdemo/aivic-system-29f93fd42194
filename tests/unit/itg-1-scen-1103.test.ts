import { describe, test, expect, beforeEach } from "@jest/globals";
import { validateContractChecklistItems } from "../../src/logic/it-1-1-1";

describe("契約書管理チェックリスト検証 - 契約書の登録内容・バージョン管理・顧客情報の品質検証", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1103
  test("すべての必須項目が正確に入力され、バージョン管理と顧客情報が完全な場合、合格判定となること", () => {
    const contractData = {
      contractNumber: "CTR-20240115-001",
      contractName: "営業代行サービス基本契約書",
      contractDate: "2024-01-15",
      customerName: "株式会社テストカンパニー",
      customerAddress: "東京都渋谷区1-2-3",
      customerPhoneNumber: "03-1234-5678",
      customerEmail: "contact@testcompany.jp",
      contractAmount: 500000,
      contractStartDate: "2024-01-15",
      contractEndDate: "2025-01-14",
      contractTerms: "月次請求、30日支払い条件",
      versionNumber: "v1.0",
      registeredAt: "2024-01-15T09:30:00Z",
      registeredBy: "admin_user"
    };

    const checklistItems = [
      { itemId: "check_001", itemName: "契約番号の正確性", isRequired: true },
      { itemId: "check_002", itemName: "契約名の妥当性", isRequired: true },
      { itemId: "check_003", itemName: "契約日の正確性", isRequired: true },
      { itemId: "check_004", itemName: "顧客名の正確性", isRequired: true },
      { itemId: "check_005", itemName: "顧客住所の完全性", isRequired: true },
      { itemId: "check_006", itemName: "顧客連絡先（電話・メール）の完全性", isRequired: true },
      { itemId: "check_007", itemName: "契約金額の妥当性", isRequired: true },
      { itemId: "check_008", itemName: "契約期間の妥当性", isRequired: true },
      { itemId: "check_009", itemName: "契約条件の妥当性", isRequired: true },
      { itemId: "check_010", itemName: "バージョン番号の初期値設定", isRequired: true }
    ];

    const result = validateContractChecklistItems(contractData, checklistItems);

    // 期待される合格判定結果
    expect(result.status).toBe("合格");
    expect(result.totalCheckedItems).toBe(10);
    expect(result.passedItems).toBe(10);
    expect(result.failedItems).toBe(0);
    expect(result.isRegistrationAllowed).toBe(true);
    expect(result.validationDetails).toEqual(
      expect.objectContaining({
        contractNumberValid: true,
        contractNameValid: true,
        contractDateValid: true,
        customerNameValid: true,
        customerAddressValid: true,
        customerContactValid: true,
        contractAmountValid: true,
        contractPeriodValid: true,
        contractTermsValid: true,
        versionNumberValid: true
      })
    );
    expect(result.checklistCompletionRate).toBe(100);
    expect(result.registrationTimestamp).toEqual("2024-01-15T09:30:00Z");
  });
});