import { describe, test, expect } from "@jest/globals";
import { validateSalesDataQuality } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データ品質検証 - 複数異常値・漏れデータ同時検出", () => {
  // SCEN-652
  test("複数の異常値・漏れデータが同時に検出された場合、すべて通知される", () => {
    // テストデータ：複数の異常値と漏れデータを含むレコード
    const testSalesData = [
      {
        recordId: "REC-001",
        customerId: "", // 異常値：顧客名が空白
        appointmentCount: -5, // 異常値：金額が負数
        contractDate: "2024-13-45", // 異常値：日付フォーマットが不正
        serviceType: "ServiceA", // 正常
        agreementStatus: "", // 漏れ：必須フィールド欠落
      },
      {
        recordId: "REC-002",
        customerId: "CUST-002",
        appointmentCount: 10,
        contractDate: "", // 漏れ：必須フィールド欠落
        serviceType: "", // 漏れ：必須フィールド欠落
        agreementStatus: "confirmed",
      },
      {
        recordId: "REC-003",
        customerId: "CUST-003",
        appointmentCount: 999999, // 異常値：範囲外
        contractDate: "2024-01-15",
        serviceType: "ServiceB",
        agreementStatus: "pending",
      },
    ];

    // データ異常値・漏れデータ自動検出機能を実行
    const validationResult = validateSalesDataQuality(testSalesData);

    // 検証結果の基本構造確認
    expect(validationResult).toHaveProperty("isValid");
    expect(validationResult).toHaveProperty("errors");
    expect(validationResult).toHaveProperty("summary");

    // 検証失敗を確認（複数の異常値・漏れデータがあるため）
    expect(validationResult.isValid).toBe(false);

    // エラー件数の確認：複数の異常値・漏れデータが検出されるべき
    expect(Array.isArray(validationResult.errors)).toBe(true);
    expect(validationResult.errors.length).toBeGreaterThanOrEqual(7);

    // REC-001 のエラー検証
    const rec001Errors = validationResult.errors.filter(
      (err: any) => err.recordId === "REC-001"
    );
    expect(rec001Errors.length).toBeGreaterThanOrEqual(4);

    // 顧客名が空白というエラーが含まれているか
    expect(rec001Errors.some((err: any) => err.fieldName === "customerId")).toBe(
      true
    );
    const customerIdError = rec001Errors.find(
      (err: any) => err.fieldName === "customerId"
    );
    expect(customerIdError.errorType).toMatch(/必須|欠落|空白/);

    // 金額が負数というエラーが含まれているか
    expect(
      rec001Errors.some((err: any) => err.fieldName === "appointmentCount")
    ).toBe(true);
    const appointmentError = rec001Errors.find(
      (err: any) => err.fieldName === "appointmentCount"
    );
    expect(appointmentError.errorType).toMatch(/負数|範囲/);

    // 日付フォーマットが不正というエラーが含まれているか
    expect(
      rec001Errors.some((err: any) => err.fieldName === "contractDate")
    ).toBe(true);
    const dateError = rec001Errors.find(
      (err: any) => err.fieldName === "contractDate"
    );
    expect(dateError.errorType).toMatch(/形式|フォーマット|日付/);

    // 合意ステータスが空白というエラーが含まれているか
    expect(
      rec001Errors.some((err: any) => err.fieldName === "agreementStatus")
    ).toBe(true);
    const statusError = rec001Errors.find(
      (err: any) => err.fieldName === "agreementStatus"
    );
    expect(statusError.errorType).toMatch(/必須|欠落|空白/);

    // REC-002 のエラー検証：複数の必須フィールド欠落
    const rec002Errors = validationResult.errors.filter(
      (err: any) => err.recordId === "REC-002"
    );
    expect(rec002Errors.length).toBeGreaterThanOrEqual(2);

    // 契約日が欠落
    expect(
      rec002Errors.some((err: any) => err.fieldName === "contractDate")
    ).toBe(true);

    // サービスタイプが欠落
    expect(rec002Errors.some((err: any) => err.fieldName === "serviceType")).toBe(
      true
    );

    // REC-003 のエラー検証：金額が範囲外
    const rec003Errors = validationResult.errors.filter(
      (err: any) => err.recordId === "REC-003"
    );
    expect(rec003Errors.length).toBeGreaterThanOrEqual(1);

    // アポイント数が範囲外というエラーが含まれているか
    expect(
      rec003Errors.some((err: any) => err.fieldName === "appointmentCount")
    ).toBe(true);
    const rangeError = rec003Errors.find(
      (err: any) => err.fieldName === "appointmentCount"
    );
    expect(rangeError.errorType).toMatch(/範囲|上限/);

    // サマリー情報の確認
    expect(validationResult.summary).toHaveProperty("totalRecords");
    expect(validationResult.summary).toHaveProperty("totalErrors");
    expect(validationResult.summary).toHaveProperty("failedRecords");

    expect(validationResult.summary.totalRecords).toBe(3);
    expect(validationResult.summary.totalErrors).toBeGreaterThanOrEqual(7);
    expect(validationResult.summary.failedRecords).toBe(3);

    // 各エラーが詳細情報を保有しているか確認
    validationResult.errors.forEach((error: any) => {
      expect(error).toHaveProperty("recordId");
      expect(error).toHaveProperty("fieldName");
      expect(error).toHaveProperty("errorType");
      expect(error).toHaveProperty("errorMessage");

      // 詳細情報が空でないか確認
      expect(typeof error.recordId).toBe("string");
      expect(error.recordId.length).toBeGreaterThan(0);
      expect(typeof error.fieldName).toBe("string");
      expect(error.fieldName.length).toBeGreaterThan(0);
      expect(typeof error.errorType).toBe("string");
      expect(error.errorType.length).toBeGreaterThan(0);
      expect(typeof error.errorMessage).toBe("string");
      expect(error.errorMessage.length).toBeGreaterThan(0);
    });

    // 通知内容が構造化されているか確認
    expect(validationResult).toHaveProperty("notification");
    expect(validationResult.notification).toHaveProperty("title");
    expect(validationResult.notification).toHaveProperty("timestamp");
    expect(validationResult.notification.title).toMatch(/品質|検証|異常|エラー/);

    // 全ての検出された異常値と漏れデータが通知に含まれていることを確認
    const notificationContent = JSON.stringify(validationResult.notification);
    expect(notificationContent).toMatch(/customerId|顧客/);
    expect(notificationContent).toMatch(/appointmentCount|金額|アポ/);
    expect(notificationContent).toMatch(/contractDate|日付|契約/);
    expect(notificationContent).toMatch(/agreementStatus|ステータス|合意/);
    expect(notificationContent).toMatch(/serviceType|サービス/);
  });
});