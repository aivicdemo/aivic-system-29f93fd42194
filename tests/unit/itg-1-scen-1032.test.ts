import { validateSalesData } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データの完全性・正確性の自動検証", () => {
  // SCEN-1032: 複数のエラーが検出されたときに差戻しが正確に判定される
  test("should auto-reject with detailed error reasons when multiple validation errors are detected", () => {
    // 複数のエラーを含むテストデータ
    const testData = {
      validationId: "validation_20240115_001",
      uploadedAt: "2024-01-15T11:00:00Z",
      salesRecords: [
        {
          recordId: "record_001",
          customerId: "cust_A001",
          customerName: "顧客A",
          amount: "12,34a", // ❌ 金額形式エラー（英字混在）
          contactDate: "2024-01-10",
          serviceType: "service_standard",
          appointmentConfirmed: true,
        },
        {
          recordId: "record_002",
          customerId: "cust_B002",
          customerName: "", // ❌ 顧客情報欠落
          amount: "25000",
          contactDate: "2024-01-12",
          serviceType: "service_premium",
          appointmentConfirmed: false,
        },
        {
          recordId: "record_003",
          customerId: "cust_C003",
          customerName: "顧客C",
          amount: "18000",
          contactDate: "2024-13-45", // ❌ 日付の不正値
          serviceType: "service_basic",
          appointmentConfirmed: true,
        },
      ],
    };

    const result = validateSalesData(testData);

    // 検証結果レポートが生成されていることを確認
    expect(result).toEqual(
      expect.objectContaining({
        validationId: "validation_20240115_001",
        status: "差戻し",
        rejectionReason: "複数エラー",
      })
    );

    // エラーが3件以上検出されていることを確認
    expect(result.detectedErrors).toHaveLength(3);

    // エラー1: 金額形式エラー
    expect(result.detectedErrors[0]).toEqual(
      expect.objectContaining({
        recordId: "record_001",
        errorType: "金額形式",
        fieldName: "amount",
        detectedValue: "12,34a",
        errorMessage: expect.stringContaining("金額"),
      })
    );

    // エラー2: 顧客情報欠落
    expect(result.detectedErrors[1]).toEqual(
      expect.objectContaining({
        recordId: "record_002",
        errorType: "必須項目欠落",
        fieldName: "customerName",
        detectedValue: "",
        errorMessage: expect.stringContaining("顧客"),
      })
    );

    // エラー3: 日付不正値
    expect(result.detectedErrors[2]).toEqual(
      expect.objectContaining({
        recordId: "record_003",
        errorType: "日付形式",
        fieldName: "contactDate",
        detectedValue: "2024-13-45",
        errorMessage: expect.stringContaining("日付"),
      })
    );

    // 差戻し判定詳細情報
    expect(result.rejectionDetails).toEqual(
      expect.objectContaining({
        rejectedAt: "2024-01-15T11:00:00Z",
        rejectionReason: "複数エラー",
        errorCount: 3,
        criticalErrorCount: 3,
        autoRejected: true,
      })
    );

    // ステータスが「差戻し」に更新されていることを確認
    expect(result.status).toBe("差戻し");

    // 差戻し理由が記録されていることを確認
    expect(result.rejectionReason).toBe("複数エラー");

    // 差戻し日時が記録されていることを確認
    expect(result.rejectionDetails.rejectedAt).toBe("2024-01-15T11:00:00Z");

    // エラー詳細情報がレポートに記載されていることを確認
    expect(result.detectedErrors.length).toBeGreaterThanOrEqual(3);
    expect(result.detectedErrors.every((err) => err.recordId)).toBe(true);
    expect(
      result.detectedErrors.every((err) => err.errorType && err.fieldName)
    ).toBe(true);
  });
});