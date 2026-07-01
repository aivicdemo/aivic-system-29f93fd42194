import { validateSalesDataBatch } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能", () => {
  test("SCEN-635: 月次営業データ品質自動検証機能 - 営業データ件数が10000件を超える場合でも検証処理が完全に実行される", () => {
    // ===== テストデータ準備: 15000件の営業データ =====
    const largeDataset = Array.from({ length: 15000 }, (_, index) => ({
      id: `sales_${index + 1}`,
      customerId: `cust_${((index % 500) + 1).toString().padStart(3, "0")}`,
      serviceId: `svc_${((index % 10) + 1).toString().padStart(2, "0")}`,
      appointmentCount: Math.floor(Math.random() * 100),
      contractCount: Math.floor(Math.random() * 50),
      contactDate: `2024-01-${((index % 28) + 1).toString().padStart(2, "0")}`,
      contactMethod: ["email", "phone", "meeting"][index % 3],
      amount: Math.floor(Math.random() * 1000000),
      status: ["pending", "completed", "cancelled"][index % 3],
    }));

    // 意図的に不正なデータをいくつか混ぜる（検証エラーを生成）
    largeDataset[100] = { ...largeDataset[100], customerId: "" }; // 必須項目欠落
    largeDataset[500] = { ...largeDataset[500], appointmentCount: -5 }; // 不正な負数
    largeDataset[1000] = { ...largeDataset[1000], amount: "invalid" as any }; // データ型エラー
    largeDataset[5000] = { ...largeDataset[5000], contactDate: "2024-13-45" }; // 日付フォーマット不正
    largeDataset[10000] = { ...largeDataset[10000], status: "unknown_status" }; // 無効なステータス

    // ===== 検証処理実行 =====
    const startTime = Date.now();
    const validationResult = validateSalesDataBatch({
      dataRecords: largeDataset,
      executionId: "exec_20240115_001",
      batchSize: 5000,
      maxExecutionTimeMs: 60000,
    });
    const executionTimeMs = Date.now() - startTime;

    // ===== 検証結果の構造確認 =====
    expect(validationResult).toHaveProperty("totalRecordsProcessed");
    expect(validationResult).toHaveProperty("successCount");
    expect(validationResult).toHaveProperty("errorCount");
    expect(validationResult).toHaveProperty("warningCount");
    expect(validationResult).toHaveProperty("validationDetails");
    expect(validationResult).toHaveProperty("executionDurationMs");
    expect(validationResult).toHaveProperty("completionStatus");

    // ===== 検証処理完了確認 =====
    expect(validationResult.completionStatus).toBe("completed");

    // ===== 全件数処理確認: 15000件がすべて処理されたことを確認 =====
    expect(validationResult.totalRecordsProcessed).toBe(15000);

    // ===== 成功・エラー・警告件数の検証 =====
    // 15000件中、5件が意図的エラー、残り14995件が成功予定（ただし一部は警告の可能性がある）
    expect(validationResult.successCount + validationResult.errorCount + validationResult.warningCount)
      .toBe(15000);
    expect(validationResult.errorCount).toBeGreaterThanOrEqual(5);

    // ===== 検証詳細内容の確認 =====
    expect(validationResult.validationDetails).toBeDefined();
    expect(Array.isArray(validationResult.validationDetails)).toBe(true);
    expect(validationResult.validationDetails.length).toBeGreaterThan(0);

    // 最初のエラーレコードの詳細を検証
    const errorDetails = validationResult.validationDetails.filter(
      (d: any) => d.status === "error"
    );
    expect(errorDetails.length).toBeGreaterThanOrEqual(5);

    const firstError = errorDetails[0];
    expect(firstError).toHaveProperty("recordIndex");
    expect(firstError).toHaveProperty("recordId");
    expect(firstError).toHaveProperty("status");
    expect(firstError).toHaveProperty("errors");
    expect(Array.isArray(firstError.errors)).toBe(true);

    // エラー内容にビジネス的なキーワードが含まれることを確認
    expect(firstError.errors[0]).toMatch(/顧客ID|金額|日付|ステータス|件数/);

    // ===== 処理時間の確認: 60秒以内に完了すること =====
    expect(validationResult.executionDurationMs).toBeLessThanOrEqual(60000);
    expect(executionTimeMs).toBeLessThanOrEqual(60000);

    // ===== 品質チェック項目の実行確認 =====
    // 各レコードについて、必須項目・データ型・値の妥当性チェックが実行されたことを確認
    const sampleRecordIndex = 50;
    const sampleValidation = validationResult.validationDetails.find(
      (d: any) => d.recordIndex === sampleRecordIndex
    );
    expect(sampleValidation).toBeDefined();
    expect(sampleValidation.status).toMatch(/success|warning|error/);

    // ===== バッチ処理の進捗情報確認 =====
    // 5000件ずつのバッチで3バッチ処理されていることを確認
    expect(validationResult).toHaveProperty("batchProcessingInfo");
    if (validationResult.batchProcessingInfo) {
      expect(validationResult.batchProcessingInfo.totalBatches).toBe(3);
      expect(validationResult.batchProcessingInfo.completedBatches).toBe(3);
    }

    // ===== メモリ・パフォーマンス: エラーが発生していないことの確認 =====
    expect(validationResult).not.toHaveProperty("fatalError");
    expect(validationResult.completionStatus).not.toBe("failed");
    expect(validationResult.completionStatus).not.toBe("timeout");

    // ===== 検証結果レポート生成の確認 =====
    expect(validationResult).toHaveProperty("reportGeneratedAt");
    const reportTimestamp = new Date(validationResult.reportGeneratedAt);
    expect(reportTimestamp.getTime()).toBeGreaterThan(0);

    // ===== エラーレコードと正常レコードの件数集計が正確であること =====
    const totalChecked =
      validationResult.successCount +
      validationResult.errorCount +
      validationResult.warningCount;
    expect(totalChecked).toBe(15000);

    // エラー件数が5件以上であること（意図的に混ぜたエラー）
    expect(validationResult.errorCount).toBeGreaterThanOrEqual(5);

    // 成功件数が14990件以上であること（15000 - 5 - その他の警告）
    expect(validationResult.successCount).toBeGreaterThanOrEqual(14990);

    // ===== 特定のエラーレコードの内容確認 =====
    const customerIdErrorRecord = validationResult.validationDetails.find(
      (d: any) => d.recordIndex === 100
    );
    expect(customerIdErrorRecord).toBeDefined();
    expect(customerIdErrorRecord.status).toBe("error");
    expect(customerIdErrorRecord.errors.some((e: string) => e.match(/顧客ID/))).toBe(true);

    const dateFormatErrorRecord = validationResult.validationDetails.find(
      (d: any) => d.recordIndex === 5000
    );
    expect(dateFormatErrorRecord).toBeDefined();
    expect(dateFormatErrorRecord.status).toBe("error");
    expect(dateFormatErrorRecord.errors.some((e: string) => e.match(/日付/))).toBe(true);

    // ===== パフォーマンス: 1000件あたりの処理時間が許容範囲内 =====
    const processingTimePerThousand = (validationResult.executionDurationMs / 15) * 1000;
    expect(processingTimePerThousand).toBeLessThan(10000); // 1000件あたり10秒以内

    // ===== 処理状態の終了確認 =====
    expect(validationResult.completionStatus).toBe("completed");
  });
});