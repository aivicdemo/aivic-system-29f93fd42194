import { validateHearingRecord } from "../../src/logic/it-1781935279444-1-1-1";

describe("営業データヒアリング記録の構造化機能", () => {
  // SCEN-1349
  test("必須項目が不足している場合に検証エラーが返される", () => {
    const hearing_record_missing_customer_name = {
      customer_name: "",
      contact_datetime: "2024-01-15T10:00:00Z",
      product_service: "営業代行サービス",
      issue_need: "営業効率化"
    };

    expect(() =>
      validateHearingRecord(hearing_record_missing_customer_name)
    ).toThrow(/顧客名/);
  });

  test("必須項目が不足している場合に検証エラーが返される - 対応日時が空白", () => {
    const hearing_record_missing_contact_datetime = {
      customer_name: "株式会社A",
      contact_datetime: "",
      product_service: "営業代行サービス",
      issue_need: "営業効率化"
    };

    expect(() =>
      validateHearingRecord(hearing_record_missing_contact_datetime)
    ).toThrow(/対応日時/);
  });

  test("必須項目が不足している場合に検証エラーが返される - 商品サービスが空白", () => {
    const hearing_record_missing_product_service = {
      customer_name: "株式会社A",
      contact_datetime: "2024-01-15T10:00:00Z",
      product_service: "",
      issue_need: "営業効率化"
    };

    expect(() =>
      validateHearingRecord(hearing_record_missing_product_service)
    ).toThrow(/商品/);
  });

  test("必須項目が不足している場合に検証エラーが返される - 課題ニーズが空白", () => {
    const hearing_record_missing_issue_need = {
      customer_name: "株式会社A",
      contact_datetime: "2024-01-15T10:00:00Z",
      product_service: "営業代行サービス",
      issue_need: ""
    };

    expect(() =>
      validateHearingRecord(hearing_record_missing_issue_need)
    ).toThrow(/課題|ニーズ/);
  });

  test("すべての必須項目が入力されている場合は検証に成功する", () => {
    const hearing_record_complete = {
      customer_name: "株式会社A",
      contact_datetime: "2024-01-15T10:00:00Z",
      product_service: "営業代行サービス",
      issue_need: "営業効率化"
    };

    const result = validateHearingRecord(hearing_record_complete);
    expect(result.is_valid).toBe(true);
    expect(result.error_messages).toEqual([]);
  });

  test("複数の必須項目が不足している場合は複数のエラーが返される", () => {
    const hearing_record_multiple_missing = {
      customer_name: "",
      contact_datetime: "",
      product_service: "営業代行サービス",
      issue_need: "営業効率化"
    };

    expect(() =>
      validateHearingRecord(hearing_record_multiple_missing)
    ).toThrow(/顧客名/);
  });
});