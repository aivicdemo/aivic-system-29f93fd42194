import { validateSalesDataCompleteness } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データの完全性・正確性自動検証", () => {
  // SCEN-1373
  test("営業データの不足項目と誤り項目が個別に検出・通知される", () => {
    const testDataWithMissingField = {
      recordId: "REC001",
      customerId: "",
      customerName: "テスト顧客A",
      contactDate: "2024-01-15",
      transactionAmount: 50000,
      serviceType: "サービスA",
      appointmentStatus: "確定",
    };

    const testDataWithInvalidField = {
      recordId: "REC002",
      customerId: "CUST002",
      customerName: "テスト顧客B",
      contactDate: "2024-13-45",
      transactionAmount: -30000,
      serviceType: "サービスB",
      appointmentStatus: "確定",
      email: "invalid-email-format",
    };

    const testDataNormal = {
      recordId: "REC003",
      customerId: "CUST003",
      customerName: "テスト顧客C",
      contactDate: "2024-01-20",
      transactionAmount: 75000,
      serviceType: "サービスC",
      appointmentStatus: "確定",
      email: "valid@example.com",
    };

    const validationResult = validateSalesDataCompleteness([
      testDataWithMissingField,
      testDataWithInvalidField,
      testDataNormal,
    ]);

    expect(validationResult).toEqual({
      isValid: false,
      totalRecords: 3,
      validRecords: 1,
      invalidRecords: 2,
      errors: [
        {
          recordId: "REC001",
          errorType: "欠落",
          errorCategory: "不足項目",
          items: [
            {
              fieldName: "customerId",
              message: "顧客IDが入力されていません",
            },
          ],
        },
        {
          recordId: "REC002",
          errorType: "形式不正",
          errorCategory: "誤り項目",
          items: [
            {
              fieldName: "contactDate",
              message: "日付形式が不正です（YYYY-MM-DD形式で入力してください）",
            },
            {
              fieldName: "transactionAmount",
              message: "金額がマイナス値です（0以上の値を入力してください）",
            },
            {
              fieldName: "email",
              message: "メールアドレス形式が不正です",
            },
          ],
        },
      ],
      summary: {
        missingFieldCount: 1,
        invalidFieldCount: 3,
        affectedRecordsCount: 2,
      },
    });

    expect(validationResult.isValid).toBe(false);
    expect(validationResult.totalRecords).toBe(3);
    expect(validationResult.validRecords).toBe(1);
    expect(validationResult.invalidRecords).toBe(2);

    const missingFieldError = validationResult.errors.find(
      (e) => e.recordId === "REC001"
    );
    expect(missingFieldError).toBeDefined();
    expect(missingFieldError?.errorCategory).toBe("不足項目");
    expect(missingFieldError?.items).toHaveLength(1);
    expect(missingFieldError?.items[0].fieldName).toBe("customerId");

    const invalidFieldError = validationResult.errors.find(
      (e) => e.recordId === "REC002"
    );
    expect(invalidFieldError).toBeDefined();
    expect(invalidFieldError?.errorCategory).toBe("誤り項目");
    expect(invalidFieldError?.items).toHaveLength(3);
    expect(invalidFieldError?.items.map((i) => i.fieldName)).toEqual([
      "contactDate",
      "transactionAmount",
      "email",
    ]);

    expect(validationResult.summary.missingFieldCount).toBe(1);
    expect(validationResult.summary.invalidFieldCount).toBe(3);
    expect(validationResult.summary.affectedRecordsCount).toBe(2);
  });
});