import { recordAuditLogForModelUpdate } from "../../src/logic/it-6-2-2-1";

describe("査定員別・案件別の判定ロジック・乖離パターン履歴の記録・抽出機能", () => {
  test("SCEN-1441: [normal] 修正内容監査ログ記録機能 - 本番適用時に修正内容・学習データ更新・適用日時・実施者・修正前後精度指標が永続記録される", () => {
    const operatorId = "op_12345";
    const operatorName = "システム運用者_太郎";
    const logicId = "logic_ocr_001";
    const logicName = "OCR読取精度向上ロジック";

    const correctionContent = {
      targetField: "reading_confidence",
      previousValue: 0.72,
      newValue: 0.85,
      reason: "学習データ更新による精度改善",
    };

    const learningDataUpdate = {
      pastCaseDataAdded: 150,
      priceBookVersion: "2024_Q2_v2",
      updateRegions: ["Tokyo", "Osaka", "Fukuoka"],
      updateDate: "2024-06-15T10:30:00Z",
    };

    const precisionBeforeCorrection = {
      ocrAccuracy: 0.78,
      judgmentAccuracy: 0.82,
      measurementDate: "2024-06-14T18:00:00Z",
    };

    const precisionAfterCorrection = {
      ocrAccuracy: 0.89,
      judgmentAccuracy: 0.91,
      measurementDate: "2024-06-15T18:00:00Z",
    };

    const applicationDate = "2024-06-16T09:00:00Z";

    const auditLog = recordAuditLogForModelUpdate({
      operatorId,
      operatorName,
      logicId,
      logicName,
      correctionContent,
      learningDataUpdate,
      precisionBeforeCorrection,
      precisionAfterCorrection,
      applicationDate,
    });

    expect(auditLog).toBeDefined();
    expect(auditLog.auditLogId).toBeTruthy();
    expect(auditLog.operatorId).toBe(operatorId);
    expect(auditLog.operatorName).toBe(operatorName);
    expect(auditLog.logicId).toBe(logicId);
    expect(auditLog.logicName).toBe(logicName);

    expect(auditLog.correctionContent.targetField).toBe("reading_confidence");
    expect(auditLog.correctionContent.previousValue).toBe(0.72);
    expect(auditLog.correctionContent.newValue).toBe(0.85);
    expect(auditLog.correctionContent.reason).toBe(
      "学習データ更新による精度改善"
    );

    expect(auditLog.learningDataUpdate.pastCaseDataAdded).toBe(150);
    expect(auditLog.learningDataUpdate.priceBookVersion).toBe("2024_Q2_v2");
    expect(auditLog.learningDataUpdate.updateRegions).toContain("Tokyo");
    expect(auditLog.learningDataUpdate.updateRegions).toContain("Osaka");
    expect(auditLog.learningDataUpdate.updateRegions).toContain("Fukuoka");
    expect(auditLog.learningDataUpdate.updateRegions.length).toBe(3);
    expect(auditLog.learningDataUpdate.updateDate).toBe("2024-06-15T10:30:00Z");

    expect(auditLog.precisionBeforeCorrection.ocrAccuracy).toBe(0.78);
    expect(auditLog.precisionBeforeCorrection.judgmentAccuracy).toBe(0.82);
    expect(auditLog.precisionBeforeCorrection.measurementDate).toBe(
      "2024-06-14T18:00:00Z"
    );

    expect(auditLog.precisionAfterCorrection.ocrAccuracy).toBe(0.89);
    expect(auditLog.precisionAfterCorrection.judgmentAccuracy).toBe(0.91);
    expect(auditLog.precisionAfterCorrection.measurementDate).toBe(
      "2024-06-15T18:00:00Z"
    );

    expect(auditLog.applicationDate).toBe(applicationDate);

    const ocrAccuracyImprovement =
      auditLog.precisionAfterCorrection.ocrAccuracy -
      auditLog.precisionBeforeCorrection.ocrAccuracy;
    expect(ocrAccuracyImprovement).toBe(0.11);

    const judgmentAccuracyImprovement =
      auditLog.precisionAfterCorrection.judgmentAccuracy -
      auditLog.precisionBeforeCorrection.judgmentAccuracy;
    expect(judgmentAccuracyImprovement).toBe(0.09);

    expect(auditLog.isPersistent).toBe(true);
    expect(auditLog.recordedToDatabase).toBe(true);
    expect(auditLog.createdAt).toBeTruthy();

    const retrievedLog = recordAuditLogForModelUpdate({
      operatorId,
      operatorName,
      logicId,
      logicName,
      correctionContent,
      learningDataUpdate,
      precisionBeforeCorrection,
      precisionAfterCorrection,
      applicationDate,
    });

    expect(retrievedLog.auditLogId).toBe(auditLog.auditLogId);
    expect(retrievedLog.operatorId).toBe(auditLog.operatorId);
    expect(retrievedLog.operatorName).toBe(auditLog.operatorName);
    expect(retrievedLog.precisionBeforeCorrection.ocrAccuracy).toBe(0.78);
    expect(retrievedLog.precisionAfterCorrection.ocrAccuracy).toBe(0.89);
    expect(retrievedLog.isPersistent).toBe(true);
  });
});