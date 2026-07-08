import { recordLearningDataUpdateMetadata } from "../../src/logic/it-6-2-2-1";

describe("学習データ更新メタデータ構造化記録機能", () => {
  // SCEN-1128
  test("各メタデータ項目が最大値のときエラーなく正常に記録できる", () => {
    // 入力: 各メタデータ項目を最大値に設定
    const testData = {
      priceBookVersionNumber: 999,
      addedCaseDataCount: 10000,
      evaluatorCount: 999,
      learningDataRecordCount: 10000,
      updateTriggerType: "price_book_update",
      updateExecutionDate: new Date("2024-12-15T09:00:00Z"),
      dataQualityScore: 95.5,
      regionCoverageRate: 98.3,
      seasonalDataCoverageRate: 97.2,
      additionalNotesLength: 5000,
      metadataValidationStatus: "passed"
    };

    // 実行: メタデータ構造化記録処理を実行
    const result = recordLearningDataUpdateMetadata(testData);

    // 検証1: 記録が正常に完了したこと
    expect(result).toBeDefined();
    expect(result.recordingStatus).toBe("success");

    // 検証2: 保存されたメタデータ各項目の値が入力値と一致
    expect(result.recordedMetadata.priceBookVersionNumber).toBe(999);
    expect(result.recordedMetadata.addedCaseDataCount).toBe(10000);
    expect(result.recordedMetadata.evaluatorCount).toBe(999);
    expect(result.recordedMetadata.learningDataRecordCount).toBe(10000);
    expect(result.recordedMetadata.updateTriggerType).toBe("price_book_update");
    expect(result.recordedMetadata.dataQualityScore).toBe(95.5);
    expect(result.recordedMetadata.regionCoverageRate).toBe(98.3);
    expect(result.recordedMetadata.seasonalDataCoverageRate).toBe(97.2);

    // 検証3: メタデータのスキーマ定義に従った構造で正常に記録されている
    expect(result.recordedMetadata).toHaveProperty("recordId");
    expect(result.recordedMetadata).toHaveProperty("createdAt");
    expect(result.recordedMetadata).toHaveProperty("schemaVersion");
    expect(result.recordedMetadata.schemaVersion).toBe("1.0");

    // 検証4: データベース保存の整合性確認
    expect(result.databaseSyncStatus).toBe("synchronized");
    expect(result.recordedRecordCount).toBe(1);
    expect(result.recordCountValidation).toBe(true);

    // 検証5: システムログにエラーや警告が記録されていない
    expect(result.systemLogStatus).toBe("clean");
    expect(result.errorMessageCount).toBe(0);
    expect(result.warningMessageCount).toBe(0);
    expect(result.criticalIssueDetected).toBe(false);

    // 検証6: タイムスタンプの妥当性
    expect(new Date(result.recordedMetadata.createdAt)).toBeInstanceOf(Date);
    expect(result.recordedMetadata.createdAt).toBe(
      new Date("2024-12-15T09:00:00Z").toISOString()
    );

    // 検証7: 全体的なシステム稼働状態
    expect(result.systemStabilityStatus).toBe("stable");
    expect(result.dataIntegrityCheckResult).toBe("pass");
  });
});