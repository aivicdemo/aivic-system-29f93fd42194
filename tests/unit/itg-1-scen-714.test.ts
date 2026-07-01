import { describe, test, expect, beforeEach } from "@jest/globals";
import {
  validateSalesActivityContactDateTime,
} from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-714: [error] 営業データ完全性・正確性検証 - 接触日時の形式が不正でNG判定となる
  test("接触日時の形式が不正な場合、バリデーションエラーを検出してNG判定とし、エラーログに記録される", () => {
    const invalid_contact_datetime = "2024/13/45 25:70:90";
    const record_id = "REC001";
    const customer_id = "CUST001";

    const result = validateSalesActivityContactDateTime({
      recordId: record_id,
      customerId: customer_id,
      contactDateTime: invalid_contact_datetime,
    });

    expect(result.isValid).toBe(false);
    expect(result.status).toBe("NG判定");
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "contactDateTime",
          message: expect.stringMatching(/接触日時|形式/),
        }),
      ])
    );
    expect(result.errorLog).toEqual(
      expect.objectContaining({
        recordId: record_id,
        customerId: customer_id,
        field: "contactDateTime",
        invalidValue: invalid_contact_datetime,
        errorType: "FORMAT_ERROR",
        timestamp: expect.any(String),
      })
    );
  });

  // 正常系テスト: 正しい形式の接触日時はOK判定となる
  test("接触日時の形式が正当な場合、バリデーション成功してOK判定となる", () => {
    const valid_contact_datetime = "2024-01-15T10:30:00Z";
    const record_id = "REC002";
    const customer_id = "CUST002";

    const result = validateSalesActivityContactDateTime({
      recordId: record_id,
      customerId: customer_id,
      contactDateTime: valid_contact_datetime,
    });

    expect(result.isValid).toBe(true);
    expect(result.status).toBe("OK判定");
    expect(result.errors).toEqual([]);
    expect(result.errorLog).toBeNull();
  });

  // 境界値テスト: 月の上限超過
  test("月が13を超える場合、バリデーションエラーで月超過を検出される", () => {
    const month_exceeded_datetime = "2024-13-01T10:30:00Z";
    const record_id = "REC003";
    const customer_id = "CUST003";

    const result = validateSalesActivityContactDateTime({
      recordId: record_id,
      customerId: customer_id,
      contactDateTime: month_exceeded_datetime,
    });

    expect(result.isValid).toBe(false);
    expect(result.status).toBe("NG判定");
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "contactDateTime",
          message: expect.stringMatching(/月|範囲/),
        }),
      ])
    );
  });

  // 境界値テスト: 時間の上限超過
  test("時間が24以上の場合、バリデーションエラーで時間超過を検出される", () => {
    const hour_exceeded_datetime = "2024-01-15T25:30:00Z";
    const record_id = "REC004";
    const customer_id = "CUST004";

    const result = validateSalesActivityContactDateTime({
      recordId: record_id,
      customerId: customer_id,
      contactDateTime: hour_exceeded_datetime,
    });

    expect(result.isValid).toBe(false);
    expect(result.status).toBe("NG判定");
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "contactDateTime",
          message: expect.stringMatching(/時間|範囲/),
        }),
      ])
    );
  });

  // 境界値テスト: 分の上限超過
  test("分が60以上の場合、バリデーションエラーで分超過を検出される", () => {
    const minute_exceeded_datetime = "2024-01-15T10:70:00Z";
    const record_id = "REC005";
    const customer_id = "CUST005";

    const result = validateSalesActivityContactDateTime({
      recordId: record_id,
      customerId: customer_id,
      contactDateTime: minute_exceeded_datetime,
    });

    expect(result.isValid).toBe(false);
    expect(result.status).toBe("NG判定");
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "contactDateTime",
          message: expect.stringMatching(/分|範囲/),
        }),
      ])
    );
  });

  // 空文字列テスト
  test("接触日時が空文字列の場合、バリデーションエラーで必須項目エラーを検出される", () => {
    const empty_datetime = "";
    const record_id = "REC006";
    const customer_id = "CUST006";

    const result = validateSalesActivityContactDateTime({
      recordId: record_id,
      customerId: customer_id,
      contactDateTime: empty_datetime,
    });

    expect(result.isValid).toBe(false);
    expect(result.status).toBe("NG判定");
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "contactDateTime",
          message: expect.stringMatching(/必須|空/),
        }),
      ])
    );
  });

  // 完全に無効な形式テスト
  test("接触日時が完全に無効な形式の場合、バリデーションエラーで形式エラーを検出される", () => {
    const completely_invalid_datetime = "not-a-date";
    const record_id = "REC007";
    const customer_id = "CUST007";

    const result = validateSalesActivityContactDateTime({
      recordId: record_id,
      customerId: customer_id,
      contactDateTime: completely_invalid_datetime,
    });

    expect(result.isValid).toBe(false);
    expect(result.status).toBe("NG判定");
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errorLog).toEqual(
      expect.objectContaining({
        errorType: "FORMAT_ERROR",
      })
    );
  });
});