import { describe, test, expect, beforeEach } from "@jest/globals";
import {
  validateSalesData,
} from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データ品質検証", () => {
  // SCEN-1311: [normal] 月次営業データ品質検証機能 - 営業データに不足データ・誤りが検出された場合、不具合内容が正確に通知される
  test("不完全な営業データを検証すると、不足データと形式誤り・不正値がすべて検出される", () => {
    // Arrange: テスト用の不完全な営業データ（必須項目の欠落、形式誤り、不正な値を含む）
    const incompleteData = [
      {
        recordNumber: 1,
        customerName: "顧客A",
        contactDate: "2024-01-15",
        appointmentStatus: "確定",
        appointmentCount: 5,
        closingCount: 2,
        revenue: 100000,
      },
      {
        recordNumber: 2,
        customerName: "", // 必須項目の欠落
        contactDate: "2024-01-16",
        appointmentStatus: "未確定",
        appointmentCount: 3,
        closingCount: 1,
        revenue: 50000,
      },
      {
        recordNumber: 3,
        customerName: "顧客C",
        contactDate: "invalid-date", // 形式誤り
        appointmentStatus: "確定",
        appointmentCount: 2,
        closingCount: 0,
        revenue: 75000,
      },
      {
        recordNumber: 4,
        customerName: "顧客D",
        contactDate: "2024-01-17",
        appointmentStatus: "確定",
        appointmentCount: -1, // 不正な値（負数）
        closingCount: 2,
        revenue: 120000,
      },
      {
        recordNumber: 5,
        customerName: "顧客E",
        contactDate: "2024-01-18",
        appointmentStatus: "確定",
        appointmentCount: 4,
        closingCount: 6, // 不正な値（成約数 > アポ数）
        revenue: 200000,
      },
    ];

    const validationRules = {
      customerName: {
        required: true,
        type: "string",
        minLength: 1,
      },
      contactDate: {
        required: true,
        type: "date",
        format: "YYYY-MM-DD",
      },
      appointmentStatus: {
        required: true,
        type: "string",
        allowedValues: ["確定", "未確定"],
      },
      appointmentCount: {
        required: true,
        type: "number",
        minValue: 0,
      },
      closingCount: {
        required: true,
        type: "number",
        minValue: 0,
        dependsOn: "appointmentCount",
        mustNotExceed: "appointmentCount",
      },
      revenue: {
        required: true,
        type: "number",
        minValue: 0,
      },
    };

    // Act: 営業データ検証処理を実行
    const validationResult = validateSalesData(incompleteData, validationRules);

    // Assert: 検証結果の構造を確認
    expect(validationResult).toHaveProperty("isValid");
    expect(validationResult).toHaveProperty("errors");
    expect(validationResult).toHaveProperty("summary");

    // 検証結果は失敗であることを確認
    expect(validationResult.isValid).toBe(false);

    // エラー数が正確に4件であることを確認（記録番号2, 3, 4, 5）
    expect(validationResult.errors.length).toBe(4);

    // 記録番号2：必須項目の欠落（customerName）
    const error_record_2 = validationResult.errors.find(
      (err) => err.recordNumber === 2
    );
    expect(error_record_2).toBeDefined();
    expect(error_record_2?.errorType).toBe("missing_required_field");
    expect(error_record_2?.fieldName).toBe("customerName");
    expect(error_record_2?.expectedValue).toBeUndefined();
    expect(error_record_2?.actualValue).toBe("");
    expect(error_record_2?.message).toContain("customerName");
    expect(error_record_2?.message).toContain("必須");

    // 記録番号3：形式誤り（contactDate）
    const error_record_3 = validationResult.errors.find(
      (err) => err.recordNumber === 3
    );
    expect(error_record_3).toBeDefined();
    expect(error_record_3?.errorType).toBe("invalid_format");
    expect(error_record_3?.fieldName).toBe("contactDate");
    expect(error_record_3?.expectedValue).toBe("YYYY-MM-DD");
    expect(error_record_3?.actualValue).toBe("invalid-date");
    expect(error_record_3?.message).toContain("contactDate");
    expect(error_record_3?.message).toContain("形式");

    // 記録番号4：不正な値（appointmentCount）
    const error_record_4 = validationResult.errors.find(
      (err) => err.recordNumber === 4
    );
    expect(error_record_4).toBeDefined();
    expect(error_record_4?.errorType).toBe("out_of_range");
    expect(error_record_4?.fieldName).toBe("appointmentCount");
    expect(error_record_4?.expectedValue).toBe(0);
    expect(error_record_4?.actualValue).toBe(-1);
    expect(error_record_4?.message).toContain("appointmentCount");
    expect(error_record_4?.message).toContain("0以上");

    // 記録番号5：不正な値（closingCount > appointmentCount）
    const error_record_5 = validationResult.errors.find(
      (err) => err.recordNumber === 5
    );
    expect(error_record_5).toBeDefined();
    expect(error_record_5?.errorType).toBe("dependent_field_violation");
    expect(error_record_5?.fieldName).toBe("closingCount");
    expect(error_record_5?.expectedValue).toBe(4);
    expect(error_record_5?.actualValue).toBe(6);
    expect(error_record_5?.message).toContain("closingCount");
    expect(error_record_5?.message).toContain("appointmentCount");
    expect(error_record_5?.message).toContain("以下");

    // summary の内容確認
    expect(validationResult.summary).toHaveProperty("totalRecords");
    expect(validationResult.summary).toHaveProperty("validRecords");
    expect(validationResult.summary).toHaveProperty("invalidRecords");
    expect(validationResult.summary).toHaveProperty("errorCategorization");

    expect(validationResult.summary.totalRecords).toBe(5);
    expect(validationResult.summary.validRecords).toBe(1); // 記録番号1のみ正常
    expect(validationResult.summary.invalidRecords).toBe(4);

    // エラーの分類集計
    expect(validationResult.summary.errorCategorization).toHaveProperty(
      "missing_required_field"
    );
    expect(validationResult.summary.errorCategorization).toHaveProperty(
      "invalid_format"
    );
    expect(validationResult.summary.errorCategorization).toHaveProperty(
      "out_of_range"
    );
    expect(validationResult.summary.errorCategorization).toHaveProperty(
      "dependent_field_violation"
    );

    expect(
      validationResult.summary.errorCategorization.missing_required_field
    ).toBe(1);
    expect(validationResult.summary.errorCategorization.invalid_format).toBe(1);
    expect(validationResult.summary.errorCategorization.out_of_range).toBe(1);
    expect(
      validationResult.summary.errorCategorization.dependent_field_violation
    ).toBe(1);

    // 通知内容のフォーマットが整っていることを確認
    expect(validationResult.notification).toBeDefined();
    expect(validationResult.notification).toHaveProperty("title");
    expect(validationResult.notification).toHaveProperty("description");
    expect(validationResult.notification).toHaveProperty("detailedErrors");
    expect(validationResult.notification).toHaveProperty("exportable");

    expect(validationResult.notification.title).toContain("営業データ");
    expect(validationResult.notification.title).toContain("検証");
    expect(validationResult.notification.description).toContain("4件");

    // 詳細なエラーリストが CSV/JSON でエクスポート可能であることを確認
    expect(validationResult.notification.exportable).toBe(true);
    expect(validationResult.notification.detailedErrors).toHaveLength(4);
    expect(validationResult.notification.detailedErrors[0]).toHaveProperty(
      "recordNumber"
    );
    expect(validationResult.notification.detailedErrors[0]).toHaveProperty(
      "fieldName"
    );
    expect(validationResult.notification.detailedErrors[0]).toHaveProperty(
      "errorType"
    );
    expect(validationResult.notification.detailedErrors[0]).toHaveProperty(
      "message"
    );
  });
});