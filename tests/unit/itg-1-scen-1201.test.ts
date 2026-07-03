import { describe, test, expect, beforeEach } from "@jest/globals";
import { validateContractChangeRequiredFields } from "../../src/logic/it-1781935279444-2-2-1";

describe("契約変更内容の必須項目検証", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1201: [normal] 契約変更内容の必須項目検証 - すべての必須項目が揃っている場合、検証が成功し登録が許可される
  test("すべての必須項目が揃っている場合、検証が成功し登録が許可される", () => {
    const input = {
      contractId: "CTR-20240115-001",
      customerName: "株式会社サンプル",
      changeContent: "サービス追加：プレミアムプラン",
      scheduledChangeDate: "2024-02-01",
      changeReason: "顧客要望による機能拡張",
    };

    const result = validateContractChangeRequiredFields(input);

    expect(result.isValid).toBe(true);
    expect(result.errorMessages).toEqual([]);
    expect(result.canRegister).toBe(true);
    expect(result.missingFields).toEqual([]);
  });

  test("契約IDが空の場合、検証が失敗し登録が許可されない", () => {
    const input = {
      contractId: "",
      customerName: "株式会社サンプル",
      changeContent: "サービス追加：プレミアムプラン",
      scheduledChangeDate: "2024-02-01",
      changeReason: "顧客要望による機能拡張",
    };

    const result = validateContractChangeRequiredFields(input);

    expect(result.isValid).toBe(false);
    expect(result.canRegister).toBe(false);
    expect(result.missingFields).toContain("contractId");
    expect(result.errorMessages.length).toBeGreaterThan(0);
  });

  test("顧客名が空の場合、検証が失敗し登録が許可されない", () => {
    const input = {
      contractId: "CTR-20240115-001",
      customerName: "",
      changeContent: "サービス追加：プレミアムプラン",
      scheduledChangeDate: "2024-02-01",
      changeReason: "顧客要望による機能拡張",
    };

    const result = validateContractChangeRequiredFields(input);

    expect(result.isValid).toBe(false);
    expect(result.canRegister).toBe(false);
    expect(result.missingFields).toContain("customerName");
  });

  test("変更内容が空の場合、検証が失敗し登録が許可されない", () => {
    const input = {
      contractId: "CTR-20240115-001",
      customerName: "株式会社サンプル",
      changeContent: "",
      scheduledChangeDate: "2024-02-01",
      changeReason: "顧客要望による機能拡張",
    };

    const result = validateContractChangeRequiredFields(input);

    expect(result.isValid).toBe(false);
    expect(result.canRegister).toBe(false);
    expect(result.missingFields).toContain("changeContent");
  });

  test("変更予定日が空の場合、検証が失敗し登録が許可されない", () => {
    const input = {
      contractId: "CTR-20240115-001",
      customerName: "株式会社サンプル",
      changeContent: "サービス追加：プレミアムプラン",
      scheduledChangeDate: "",
      changeReason: "顧客要望による機能拡張",
    };

    const result = validateContractChangeRequiredFields(input);

    expect(result.isValid).toBe(false);
    expect(result.canRegister).toBe(false);
    expect(result.missingFields).toContain("scheduledChangeDate");
  });

  test("変更理由が空の場合、検証が失敗し登録が許可されない", () => {
    const input = {
      contractId: "CTR-20240115-001",
      customerName: "株式会社サンプル",
      changeContent: "サービス追加：プレミアムプラン",
      scheduledChangeDate: "2024-02-01",
      changeReason: "",
    };

    const result = validateContractChangeRequiredFields(input);

    expect(result.isValid).toBe(false);
    expect(result.canRegister).toBe(false);
    expect(result.missingFields).toContain("changeReason");
  });

  test("複数の必須項目が空の場合、すべての欠落項目を検出", () => {
    const input = {
      contractId: "",
      customerName: "",
      changeContent: "サービス追加：プレミアムプラン",
      scheduledChangeDate: "",
      changeReason: "顧客要望による機能拡張",
    };

    const result = validateContractChangeRequiredFields(input);

    expect(result.isValid).toBe(false);
    expect(result.canRegister).toBe(false);
    expect(result.missingFields).toContain("contractId");
    expect(result.missingFields).toContain("customerName");
    expect(result.missingFields).toContain("scheduledChangeDate");
    expect(result.missingFields.length).toBe(3);
  });

  test("変更予定日の形式が不正な場合、検証が失敗", () => {
    const input = {
      contractId: "CTR-20240115-001",
      customerName: "株式会社サンプル",
      changeContent: "サービス追加：プレミアムプラン",
      scheduledChangeDate: "2024/02/01",
      changeReason: "顧客要望による機能拡張",
    };

    const result = validateContractChangeRequiredFields(input);

    expect(result.isValid).toBe(false);
    expect(result.canRegister).toBe(false);
    expect(
      result.errorMessages.some((msg) => msg.includes("scheduledChangeDate"))
    ).toBe(true);
  });

  test("契約IDの形式が不正な場合、検証が失敗", () => {
    const input = {
      contractId: "invalid-format",
      customerName: "株式会社サンプル",
      changeContent: "サービス追加：プレミアムプラン",
      scheduledChangeDate: "2024-02-01",
      changeReason: "顧客要望による機能拡張",
    };

    const result = validateContractChangeRequiredFields(input);

    expect(result.isValid).toBe(false);
    expect(result.canRegister).toBe(false);
    expect(
      result.errorMessages.some((msg) => msg.includes("contractId"))
    ).toBe(true);
  });

  test("すべての必須項目が有効な場合、登録用のメタデータが返される", () => {
    const input = {
      contractId: "CTR-20240115-002",
      customerName: "株式会社テスト",
      changeContent: "料金プラン変更",
      scheduledChangeDate: "2024-03-15",
      changeReason: "コスト最適化のため",
    };

    const result = validateContractChangeRequiredFields(input);

    expect(result.isValid).toBe(true);
    expect(result.canRegister).toBe(true);
    expect(result.registrationTimestamp).toBeDefined();
    expect(result.validationTimestamp).toBeDefined();
    expect(typeof result.registrationTimestamp).toBe("string");
  });
});