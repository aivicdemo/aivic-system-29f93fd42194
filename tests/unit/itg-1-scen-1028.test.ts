import { validateSalesData } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能", () => {
  // SCEN-1028
  test("営業データ完全性・正確性自動検証機能 - 営業データから不足データ・誤りが検出され、検出内容が正確に通知される", () => {
    // Arrange: テストデータの準備 - 意図的に不足データと誤りを含む営業データセット
    const testSalesData = [
      {
        id: "sales_001",
        customerName: "", // 必須項目の欠落
        contactDate: "2024-01-15",
        contactMethod: "phone",
        serviceType: "appointment",
        appointmentCount: 1,
        closedCount: 0,
        amount: -50000, // マイナス値（範囲外エラー）
        phoneNumber: "090-1234", // 電話番号形式不正
        status: "completed",
      },
      {
        id: "sales_002",
        customerName: "株式会社テスト",
        contactDate: "", // 必須項目の欠落
        contactMethod: "email",
        serviceType: "proposal",
        appointmentCount: 2,
        closedCount: 1,
        amount: 100000,
        phoneNumber: "09012345678", // 正常な形式
        status: "pending",
      },
      {
        id: "sales_003",
        customerName: "顧客企業A",
        contactDate: "2024-01-16",
        contactMethod: "meeting",
        serviceType: "contract",
        appointmentCount: 1,
        closedCount: 1,
        amount: 250000,
        phoneNumber: "abc-defg-hijk", // 電話番号形式不正
        status: "invalid_status", // ステータス値が無効
      },
    ];

    // Act: 営業データ完全性・正確性自動検証機能を実行
    const validationResult = validateSalesData(testSalesData);

    // Assert: 検証処理が開始され、各データ項目に対するバリデーションが実行されたことを確認
    expect(validationResult).toBeDefined();
    expect(validationResult.validationStarted).toBe(true);

    // 不足データ（必須項目の欠落）が検出されることを確認
    const missingErrors = validationResult.errors.filter(
      (err) => err.errorType === "MISSING_REQUIRED_FIELD"
    );
    expect(missingErrors.length).toBe(2);

    // 第1エラー: sales_001のcustomerName欠落
    const missingCustomerError = missingErrors.find(
      (err) => err.dataId === "sales_001" && err.fieldName === "customerName"
    );
    expect(missingCustomerError).toBeDefined();
    expect(missingCustomerError?.errorId).toMatch(/^ERR_MIS/);
    expect(missingCustomerError?.errorContent).toMatch(/必須項目/);

    // 第2エラー: sales_002のcontactDate欠落
    const missingDateError = missingErrors.find(
      (err) => err.dataId === "sales_002" && err.fieldName === "contactDate"
    );
    expect(missingDateError).toBeDefined();
    expect(missingDateError?.errorId).toMatch(/^ERR_MIS/);

    // データ誤り（形式不正、範囲外の値など）が検出されることを確認
    const formatErrors = validationResult.errors.filter(
      (err) => err.errorType === "FORMAT_ERROR"
    );
    expect(formatErrors.length).toBeGreaterThanOrEqual(2);

    // 電話番号形式不正エラー
    const phoneFormatErrors = formatErrors.filter(
      (err) => err.fieldName === "phoneNumber"
    );
    expect(phoneFormatErrors.length).toBe(2); // sales_001と sales_003

    const invalidPhoneError1 = phoneFormatErrors.find(
      (err) => err.dataId === "sales_001"
    );
    expect(invalidPhoneError1).toBeDefined();
    expect(invalidPhoneError1?.errorId).toMatch(/^ERR_FMT/);
    expect(invalidPhoneError1?.errorContent).toMatch(/電話番号/);

    const invalidPhoneError2 = phoneFormatErrors.find(
      (err) => err.dataId === "sales_003"
    );
    expect(invalidPhoneError2).toBeDefined();
    expect(invalidPhoneError2?.errorId).toMatch(/^ERR_FMT/);

    // 範囲外エラー（マイナス金額）を確認
    const rangeErrors = validationResult.errors.filter(
      (err) => err.errorType === "OUT_OF_RANGE"
    );
    expect(rangeErrors.length).toBeGreaterThanOrEqual(1);

    const negativeAmountError = rangeErrors.find(
      (err) => err.dataId === "sales_001" && err.fieldName === "amount"
    );
    expect(negativeAmountError).toBeDefined();
    expect(negativeAmountError?.errorId).toMatch(/^ERR_RNG/);
    expect(negativeAmountError?.errorContent).toMatch(/範囲外|金額/);

    // ステータス値エラー
    const statusErrors = validationResult.errors.filter(
      (err) => err.dataId === "sales_003" && err.fieldName === "status"
    );
    expect(statusErrors.length).toBeGreaterThanOrEqual(1);
    expect(statusErrors[0]?.errorType).toMatch(/FORMAT_ERROR|INVALID_VALUE/);

    // 検出された各エラー情報が必須要素を含んでいることを確認
    validationResult.errors.forEach((error) => {
      expect(error.errorId).toBeDefined();
      expect(error.errorId).toMatch(/^ERR_/);
      expect(error.errorType).toBeDefined();
      expect(["MISSING_REQUIRED_FIELD", "FORMAT_ERROR", "OUT_OF_RANGE", "INVALID_VALUE"]).toContain(
        error.errorType
      );
      expect(error.fieldName).toBeDefined();
      expect(error.dataId).toBeDefined();
      expect(error.errorContent).toBeDefined();
    });

    // 通知機能が動作し、検出内容の詳細が正確に通知されることを確認
    expect(validationResult.notificationSent).toBe(true);
    expect(validationResult.notificationContent).toBeDefined();
    expect(validationResult.notificationContent.totalErrorCount).toBe(
      validationResult.errors.length
    );
    expect(validationResult.notificationContent.totalErrorCount).toBe(6);

    // 通知内容に誤検知や漏れがないことを確認
    // 検出されたエラーIDと通知内容のエラーIDが一致することを確認
    const notificationErrorIds = validationResult.notificationContent.errorDetails.map(
      (detail: any) => detail.errorId
    );
    validationResult.errors.forEach((error) => {
      expect(notificationErrorIds).toContain(error.errorId);
    });

    // 各エラーが正確に通知に含まれていることを確認
    expect(validationResult.notificationContent.errorDetails.length).toBe(6);

    // 通知内容に各エラーの種別と対象項目が含まれていることを確認
    validationResult.notificationContent.errorDetails.forEach((detail: any) => {
      expect(detail.fieldName).toBeDefined();
      expect(detail.errorType).toBeDefined();
      expect(detail.dataId).toBeDefined();
      expect(detail.message).toBeDefined();
    });

    // 検証結果レポートが生成され、すべての検出内容が記録されていることを確認
    expect(validationResult.reportGenerated).toBe(true);
    expect(validationResult.report).toBeDefined();
    expect(validationResult.report.validationTimestamp).toBeDefined();
    expect(validationResult.report.validationTimestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
    );

    // レポートに全エラーが記録されていることを確認
    expect(validationResult.report.recordedErrors.length).toBe(6);

    // レポートのエラー記録とバリデーション結果のエラーが一致することを確認
    const recordedErrorIds = validationResult.report.recordedErrors.map(
      (rec: any) => rec.errorId
    );
    validationResult.errors.forEach((error) => {
      expect(recordedErrorIds).toContain(error.errorId);
    });

    // レポートに検証処理の詳細が記録されていることを確認
    expect(validationResult.report.processDetails).toBeDefined();
    expect(validationResult.report.processDetails.totalRecordsProcessed).toBe(3);
    expect(validationResult.report.processDetails.recordsWithErrors).toBe(3);
    expect(validationResult.report.processDetails.validationRulesApplied).toBeGreaterThan(0);

    // 統計情報が正確に記録されていることを確認
    const errorTypeCounts = validationResult.report.errorStatistics;
    expect(errorTypeCounts.MISSING_REQUIRED_FIELD).toBe(2);
    expect(errorTypeCounts.FORMAT_ERROR).toBe(3);
    expect(errorTypeCounts.OUT_OF_RANGE).toBe(1);

    // 全体の検証結果が「不合格」と判定されていることを確認（1件以上のエラーがあるため）
    expect(validationResult.overallResult).toBe("FAILED");
    expect(validationResult.canProceedToNextStep).toBe(false);
  });
});