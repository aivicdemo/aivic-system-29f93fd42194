import { generateNotificationForAbnormalValidation } from "../../src/logic/it-1-br-1781935279444-1-2-1";

describe("月次サマリーテンプレートの定義・管理機能", () => {
  // SCEN-883: [error] 検証結果異常時の上位管理者自動通知 - 検証判定結果が不正な値である場合、通知生成処理がエラーを返す
  test("should throw error when validation result is null", () => {
    expect(() =>
      generateNotificationForAbnormalValidation({
        validationResult: null,
        validatedDataId: "data_001",
        validationRuleId: "rule_001",
        managerId: "mgr_001",
        timestamp: new Date("2024-01-15T11:00:00Z"),
      })
    ).toThrow(/検証結果/);
  });

  test("should throw error when validation result is undefined", () => {
    expect(() =>
      generateNotificationForAbnormalValidation({
        validationResult: undefined,
        validatedDataId: "data_001",
        validationRuleId: "rule_001",
        managerId: "mgr_001",
        timestamp: new Date("2024-01-15T11:00:00Z"),
      })
    ).toThrow(/検証結果/);
  });

  test("should throw error when validation result is empty string", () => {
    expect(() =>
      generateNotificationForAbnormalValidation({
        validationResult: "",
        validatedDataId: "data_001",
        validationRuleId: "rule_001",
        managerId: "mgr_001",
        timestamp: new Date("2024-01-15T11:00:00Z"),
      })
    ).toThrow(/検証結果/);
  });

  test("should throw error when validation result is unexpected data type (number)", () => {
    expect(() =>
      generateNotificationForAbnormalValidation({
        validationResult: 12345 as any,
        validatedDataId: "data_001",
        validationRuleId: "rule_001",
        managerId: "mgr_001",
        timestamp: new Date("2024-01-15T11:00:00Z"),
      })
    ).toThrow(/検証結果/);
  });

  test("should throw error when validation result is unexpected data type (boolean)", () => {
    expect(() =>
      generateNotificationForAbnormalValidation({
        validationResult: true as any,
        validatedDataId: "data_001",
        validationRuleId: "rule_001",
        managerId: "mgr_001",
        timestamp: new Date("2024-01-15T11:00:00Z"),
      })
    ).toThrow(/検証結果/);
  });

  test("should throw error when validatedDataId is null", () => {
    expect(() =>
      generateNotificationForAbnormalValidation({
        validationResult: "合格",
        validatedDataId: null as any,
        validationRuleId: "rule_001",
        managerId: "mgr_001",
        timestamp: new Date("2024-01-15T11:00:00Z"),
      })
    ).toThrow(/データID/);
  });

  test("should throw error when validatedDataId is empty string", () => {
    expect(() =>
      generateNotificationForAbnormalValidation({
        validationResult: "合格",
        validatedDataId: "",
        validationRuleId: "rule_001",
        managerId: "mgr_001",
        timestamp: new Date("2024-01-15T11:00:00Z"),
      })
    ).toThrow(/データID/);
  });

  test("should throw error when validationRuleId is null", () => {
    expect(() =>
      generateNotificationForAbnormalValidation({
        validationResult: "合格",
        validatedDataId: "data_001",
        validationRuleId: null as any,
        managerId: "mgr_001",
        timestamp: new Date("2024-01-15T11:00:00Z"),
      })
    ).toThrow(/ルールID/);
  });

  test("should throw error when managerId is null", () => {
    expect(() =>
      generateNotificationForAbnormalValidation({
        validationResult: "合格",
        validatedDataId: "data_001",
        validationRuleId: "rule_001",
        managerId: null as any,
        timestamp: new Date("2024-01-15T11:00:00Z"),
      })
    ).toThrow(/管理者ID/);
  });

  test("should throw error when timestamp is null", () => {
    expect(() =>
      generateNotificationForAbnormalValidation({
        validationResult: "合格",
        validatedDataId: "data_001",
        validationRuleId: "rule_001",
        managerId: "mgr_001",
        timestamp: null as any,
      })
    ).toThrow(/タイムスタンプ/);
  });

  test("should throw error when validation result is object", () => {
    expect(() =>
      generateNotificationForAbnormalValidation({
        validationResult: { result: "合格" } as any,
        validatedDataId: "data_001",
        validationRuleId: "rule_001",
        managerId: "mgr_001",
        timestamp: new Date("2024-01-15T11:00:00Z"),
      })
    ).toThrow(/検証結果/);
  });

  test("should throw error when validation result is array", () => {
    expect(() =>
      generateNotificationForAbnormalValidation({
        validationResult: ["合格"] as any,
        validatedDataId: "data_001",
        validationRuleId: "rule_001",
        managerId: "mgr_001",
        timestamp: new Date("2024-01-15T11:00:00Z"),
      })
    ).toThrow(/検証結果/);
  });

  test("should successfully generate notification with valid validation result (pass)", () => {
    const result = generateNotificationForAbnormalValidation({
      validationResult: "合格",
      validatedDataId: "data_001",
      validationRuleId: "rule_001",
      managerId: "mgr_001",
      timestamp: new Date("2024-01-15T11:00:00Z"),
    });

    expect(result).toEqual({
      notificationId: expect.any(String),
      managerId: "mgr_001",
      validatedDataId: "data_001",
      validationRuleId: "rule_001",
      validationResult: "合格",
      status: "sent",
      timestamp: new Date("2024-01-15T11:00:00Z"),
    });
    expect(result.notificationId).toMatch(/^notif_/);
  });

  test("should successfully generate notification with valid validation result (fail)", () => {
    const result = generateNotificationForAbnormalValidation({
      validationResult: "不合格",
      validatedDataId: "data_002",
      validationRuleId: "rule_002",
      managerId: "mgr_002",
      timestamp: new Date("2024-01-20T15:30:00Z"),
    });

    expect(result).toEqual({
      notificationId: expect.any(String),
      managerId: "mgr_002",
      validatedDataId: "data_002",
      validationRuleId: "rule_002",
      validationResult: "不合格",
      status: "sent",
      timestamp: new Date("2024-01-20T15:30:00Z"),
    });
  });
});