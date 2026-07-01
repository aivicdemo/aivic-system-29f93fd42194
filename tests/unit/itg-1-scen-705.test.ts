import { describe, test, expect } from "@jest/globals";
import {
  generateAnomalyCorrections,
  AnomalyRecord,
  CorrectionProposal,
} from "../../src/logic/it-1-1-1";

describe("営業成果データの自動検証ルール定義と異常検出機能", () => {
  // SCEN-705: [normal] 営業データ補正指示生成機能 - 検出された異常値に対して自動補正可能な修正内容を提案する
  test("should generate correction proposals for detected anomalies with before/after values and reasoning", () => {
    const anomalies: AnomalyRecord[] = [
      {
        recordId: "REC-001",
        customerId: "CUST-A001",
        serviceId: "SVC-S001",
        fieldName: "appointmentCount",
        detectedValue: -5,
        dataType: "number",
        anomalyType: "negative_value",
        qualityStandard: {
          minValue: 0,
          maxValue: 1000,
          requiredFormat: "integer",
        },
      },
      {
        recordId: "REC-002",
        customerId: "CUST-B002",
        serviceId: "SVC-S002",
        fieldName: "contractAmount",
        detectedValue: 9999999,
        dataType: "number",
        anomalyType: "excessive_value",
        qualityStandard: {
          minValue: 0,
          maxValue: 5000000,
          requiredFormat: "integer",
        },
      },
      {
        recordId: "REC-003",
        customerId: "CUST-C003",
        serviceId: "SVC-S003",
        fieldName: "closureDate",
        detectedValue: "2025-13-45",
        dataType: "string",
        anomalyType: "invalid_format",
        qualityStandard: {
          minValue: undefined,
          maxValue: undefined,
          requiredFormat: "YYYY-MM-DD",
        },
      },
      {
        recordId: "REC-004",
        customerId: "CUST-D004",
        serviceId: "SVC-S004",
        fieldName: "performanceRatio",
        detectedValue: null,
        dataType: "number",
        anomalyType: "missing_value",
        qualityStandard: {
          minValue: 0,
          maxValue: 100,
          requiredFormat: "decimal",
        },
      },
      {
        recordId: "REC-005",
        customerId: "CUST-E005",
        serviceId: "SVC-S005",
        fieldName: "accountName",
        detectedValue: "",
        dataType: "string",
        anomalyType: "empty_value",
        qualityStandard: {
          minValue: undefined,
          maxValue: undefined,
          requiredFormat: "text",
        },
      },
    ];

    const result: CorrectionProposal[] = generateAnomalyCorrections(anomalies);

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(5);

    // Verify first anomaly: negative appointment count
    const proposal1 = result[0];
    expect(proposal1.recordId).toBe("REC-001");
    expect(proposal1.fieldName).toBe("appointmentCount");
    expect(proposal1.beforeValue).toBe(-5);
    expect(proposal1.afterValue).toBe(0);
    expect(proposal1.correctionReason).toMatch(/負の値|下限値/);
    expect(proposal1.isAutoCorrectible).toBe(true);
    expect(proposal1.confidence).toBeGreaterThan(0.9);

    // Verify second anomaly: excessive contract amount
    const proposal2 = result[1];
    expect(proposal2.recordId).toBe("REC-002");
    expect(proposal2.fieldName).toBe("contractAmount");
    expect(proposal2.beforeValue).toBe(9999999);
    expect(proposal2.afterValue).toBe(5000000);
    expect(proposal2.correctionReason).toMatch(/上限値|超過/);
    expect(proposal2.isAutoCorrectible).toBe(true);
    expect(proposal2.confidence).toBeGreaterThan(0.85);

    // Verify third anomaly: invalid date format
    const proposal3 = result[2];
    expect(proposal3.recordId).toBe("REC-003");
    expect(proposal3.fieldName).toBe("closureDate");
    expect(proposal3.beforeValue).toBe("2025-13-45");
    expect(proposal3.correctionReason).toMatch(/日付形式|YYYY-MM-DD/);
    expect(proposal3.isAutoCorrectible).toBe(false);
    expect(proposal3.suggestedAction).toMatch(/入力|確認/);

    // Verify fourth anomaly: missing value
    const proposal4 = result[3];
    expect(proposal4.recordId).toBe("REC-004");
    expect(proposal4.fieldName).toBe("performanceRatio");
    expect(proposal4.beforeValue).toBeNull();
    expect(proposal4.isAutoCorrectible).toBe(false);
    expect(proposal4.correctionReason).toMatch(/欠落|必須/);

    // Verify fifth anomaly: empty string
    const proposal5 = result[4];
    expect(proposal5.recordId).toBe("REC-005");
    expect(proposal5.fieldName).toBe("accountName");
    expect(proposal5.beforeValue).toBe("");
    expect(proposal5.isAutoCorrectible).toBe(false);
    expect(proposal5.correctionReason).toMatch(/空文字|入力/);

    // Verify common properties across all proposals
    result.forEach((proposal) => {
      expect(proposal.recordId).toBeDefined();
      expect(proposal.customerId).toBeDefined();
      expect(proposal.serviceId).toBeDefined();
      expect(proposal.fieldName).toBeDefined();
      expect(proposal.beforeValue).toBeDefined();
      expect(proposal.correctionReason).toBeDefined();
      expect(proposal.isAutoCorrectible).toEqual(
        expect.any(Boolean)
      );
      expect(proposal.confidence).toBeGreaterThanOrEqual(0);
      expect(proposal.confidence).toBeLessThanOrEqual(1);
      expect(proposal.timestamp).toBeDefined();
      expect(new Date(proposal.timestamp)).toBeInstanceOf(Date);
    });

    // Verify that auto-correctable proposals have afterValue
    result.forEach((proposal) => {
      if (proposal.isAutoCorrectible) {
        expect(proposal.afterValue).toBeDefined();
      }
    });

    // Verify that non-auto-correctable proposals have suggestedAction
    result.forEach((proposal) => {
      if (!proposal.isAutoCorrectible) {
        expect(proposal.suggestedAction).toBeDefined();
      }
    });

    // Count auto-correctable vs. non-auto-correctable
    const autoCorrectibleCount = result.filter(
      (p) => p.isAutoCorrectible
    ).length;
    const nonAutoCorrectibleCount = result.filter(
      (p) => !p.isAutoCorrectible
    ).length;

    expect(autoCorrectibleCount).toBe(2);
    expect(nonAutoCorrectibleCount).toBe(3);

    // Verify confidence levels reflect correctable status
    const avgConfidenceAuto = result
      .filter((p) => p.isAutoCorrectible)
      .reduce((sum, p) => sum + p.confidence, 0) / autoCorrectibleCount;

    const avgConfidenceNonAuto = result
      .filter((p) => !p.isAutoCorrectible)
      .reduce((sum, p) => sum + p.confidence, 0) / nonAutoCorrectibleCount;

    expect(avgConfidenceAuto).toBeGreaterThan(avgConfidenceNonAuto);
  });
});