import { describe, test, expect, beforeEach } from "@jest/globals";
import { validateSalesAchievementData } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業成果データの自動検証 - 成約数の負数チェック", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-955: [error] 営業成果データの自動検証 - 成約数が負数の場合、異常値として検証エラーを返す
  test("成約数が負数の場合、検証エラーを返す", () => {
    const input = {
      customerId: "CUST-001",
      serviceId: "SVC-A",
      appointmentCount: 10,
      contractCount: -5,
      customerFeedback: "positive",
      datePeriod: {
        startDate: "2024-01-01",
        endDate: "2024-01-31",
      },
    };

    expect(() => validateSalesAchievementData(input)).toThrow(/成約数/);
  });

  // 境界値テスト: 成約数が0の場合は正常系（合格）
  test("成約数が0の場合は検証に合格する", () => {
    const input = {
      customerId: "CUST-001",
      serviceId: "SVC-A",
      appointmentCount: 10,
      contractCount: 0,
      customerFeedback: "positive",
      datePeriod: {
        startDate: "2024-01-01",
        endDate: "2024-01-31",
      },
    };

    const result = validateSalesAchievementData(input);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  // 正常系: 成約数が正数の場合は検証に合格
  test("成約数が正数の場合は検証に合格する", () => {
    const input = {
      customerId: "CUST-001",
      serviceId: "SVC-A",
      appointmentCount: 10,
      contractCount: 5,
      customerFeedback: "positive",
      datePeriod: {
        startDate: "2024-01-01",
        endDate: "2024-01-31",
      },
    };

    const result = validateSalesAchievementData(input);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  // 複合エラーテスト: 複数のフィールドが不正な場合
  test("成約数が負数かつアポイント数が負数の場合、複数の検証エラーを返す", () => {
    const input = {
      customerId: "CUST-001",
      serviceId: "SVC-A",
      appointmentCount: -3,
      contractCount: -5,
      customerFeedback: "positive",
      datePeriod: {
        startDate: "2024-01-01",
        endDate: "2024-01-31",
      },
    };

    expect(() => validateSalesAchievementData(input)).toThrow(/(成約数|アポ数)/);
  });

  // 境界値テスト: 非常に大きな正数（範囲内）
  test("成約数が大きな正数の場合は検証に合格する", () => {
    const input = {
      customerId: "CUST-001",
      serviceId: "SVC-A",
      appointmentCount: 1000,
      contractCount: 999,
      customerFeedback: "positive",
      datePeriod: {
        startDate: "2024-01-01",
        endDate: "2024-01-31",
      },
    };

    const result = validateSalesAchievementData(input);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  // エラー詳細テスト: エラーオブジェクトが正確に返される
  test("成約数の負数エラーが詳細情報付きで返される", () => {
    const input = {
      customerId: "CUST-001",
      serviceId: "SVC-A",
      appointmentCount: 10,
      contractCount: -5,
      customerFeedback: "positive",
      datePeriod: {
        startDate: "2024-01-01",
        endDate: "2024-01-31",
      },
    };

    try {
      validateSalesAchievementData(input);
      fail("エラーが発生していません");
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toMatch(/成約数/);
    }
  });
});