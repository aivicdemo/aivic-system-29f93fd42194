import { describe, test, expect, beforeEach } from "@jest/globals";
import { validateSalesDataQuality } from "../../src/logic/it-1781935279444-2-1-1";

describe("営業データ入力時の品質検証ルール定義・実行機能", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-693: [edge] 接触日時が現在日時と同日の場合に検証が合格する
  test("接触日時が本日の日付である場合、品質検証が合格する", () => {
    const today = new Date("2024-01-15");
    const currentYear = today.getFullYear();
    const currentMonth = String(today.getMonth() + 1).padStart(2, "0");
    const currentDay = String(today.getDate()).padStart(2, "0");
    const contactDateTime = `${currentYear}-${currentMonth}-${currentDay}T09:30:00Z`;

    const salesData = {
      customerId: "CUST001",
      customerName: "テスト顧客",
      contactDateTime: contactDateTime,
      contactContent: "初回商談",
      appointmentStatus: "確定",
      serviceType: "営業支援",
    };

    const validationRule = {
      fieldName: "contactDateTime",
      ruleType: "sameDateAsToday",
      isRequired: true,
      allowedDataType: "ISO8601DateTime",
    };

    const result = validateSalesDataQuality(salesData, validationRule, today);

    expect(result.isValid).toBe(true);
    expect(result.errorMessage).toBeNull();
    expect(result.passedValidation).toBe(true);
  });
});