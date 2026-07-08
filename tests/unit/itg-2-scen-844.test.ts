import { recordJudgmentResult } from "../../src/logic/it-6-2-2-1";

describe("判定結果の構造化記録 - タイムスタンプ精度検証", () => {
  test("SCEN-844: 過去・現在・未来のタイムスタンプを含む複数回の記録操作で、過去と未来は拒否され現在時刻のみ受け入れられること", () => {
    // ===== 【Setup】 =====
    // 基準時刻: 2024-01-15T14:30:00.000Z
    const now = new Date("2024-01-15T14:30:00.000Z");
    const pastTimestamp = new Date("2024-01-15T13:30:00.000Z"); // 1時間前
    const futureTimestamp = new Date("2024-01-15T15:30:00.000Z"); // 1時間後

    const baseJudgmentPayload = {
      caseId: "CASE-2024-001",
      assessorId: "ASSESSOR-42",
      assessorName: "山田太郎",
      judgmentContent: "承認",
      deviationRatePercent: 8.5,
      deviationAmountYen: 125000,
      referenceDataCount: 12,
      appliedCorrectionFactor: 0.95,
      judgmentReason: "過去案件との比較から妥当と判定"
    };

    // ===== 【Test 1】 過去のタイムスタンプを拒否 =====
    expect(() =>
      recordJudgmentResult({
        ...baseJudgmentPayload,
        recordedAt: pastTimestamp
      })
    ).toThrow(/過去/);

    // ===== 【Test 2】 未来のタイムスタンプを拒否 =====
    expect(() =>
      recordJudgmentResult({
        ...baseJudgmentPayload,
        recordedAt: futureTimestamp
      })
    ).toThrow(/未来/);

    // ===== 【Test 3】 現在時刻のタイムスタンプで正常記録 =====
    const result1 = recordJudgmentResult({
      ...baseJudgmentPayload,
      recordedAt: now
    });

    expect(result1).toEqual({
      recordId: expect.any(String),
      caseId: "CASE-2024-001",
      assessorId: "ASSESSOR-42",
      assessorName: "山田太郎",
      judgmentContent: "承認",
      deviationRatePercent: 8.5,
      deviationAmountYen: 125000,
      referenceDataCount: 12,
      appliedCorrectionFactor: 0.95,
      judgmentReason: "過去案件との比較から妥当と判定",
      recordedAt: now,
      recordedAtUtcString: "2024-01-15T14:30:00.000Z",
      recordStatus: "recorded"
    });

    // ===== 【Test 4】 記録後のタイムスタンプが正確に保持されていることを検証 =====
    expect(result1.recordedAt.getTime()).toBe(now.getTime());
    expect(result1.recordedAtUtcString).toBe("2024-01-15T14:30:00.000Z");

    // ===== 【Test 5】 2回目の記録：別ケース、別タイムスタンプ（秒精度） =====
    const now2 = new Date("2024-01-15T14:30:05.123Z"); // 5秒後、ミリ秒あり
    const result2 = recordJudgmentResult({
      caseId: "CASE-2024-002",
      assessorId: "ASSESSOR-43",
      assessorName: "山田花子",
      judgmentContent: "修正指示",
      deviationRatePercent: -15.2,
      deviationAmountYen: -225000,
      referenceDataCount: 8,
      appliedCorrectionFactor: 1.05,
      judgmentReason: "物価本更新を反映し修正指示",
      recordedAt: now2
    });

    expect(result2.recordedAt.getTime()).toBe(now2.getTime());
    expect(result2.recordedAtUtcString).toBe("2024-01-15T14:30:05.123Z");

    // ===== 【Test 6】 2回目の記録でも過去時刻を拒否 =====
    const pastTimestamp2 = new Date("2024-01-15T14:25:00.000Z"); // 5分前
    expect(() =>
      recordJudgmentResult({
        caseId: "CASE-2024-003",
        assessorId: "ASSESSOR-43",
        assessorName: "山田花子",
        judgmentContent: "承認",
        deviationRatePercent: 3.1,
        deviationAmountYen: 45000,
        referenceDataCount: 15,
        appliedCorrectionFactor: 1.0,
        judgmentReason: "相場内",
        recordedAt: pastTimestamp2
      })
    ).toThrow(/過去/);

    // ===== 【Test 7】 3回目：現在時刻（ミリ秒精度なし） =====
    const now3 = new Date("2024-01-15T14:31:00.000Z");
    const result3 = recordJudgmentResult({
      caseId: "CASE-2024-004",
      assessorId: "ASSESSOR-44",
      assessorName: "鈴木太郎",
      judgmentContent: "承認",
      deviationRatePercent: 0.0,
      deviationAmountYen: 0,
      referenceDataCount: 20,
      appliedCorrectionFactor: 1.0,
      judgmentReason: "標準相場と完全一致",
      recordedAt: now3
    });

    expect(result3.recordedAt.getTime()).toBe(now3.getTime());
    expect(result3.recordedAtUtcString).toBe("2024-01-15T14:31:00.000Z");
    expect(result3.recordStatus).toBe("recorded");

    // ===== 【Test 8】 複数回記録のタイムスタンプが厳密に異なることを検証 =====
    // result1, result2, result3 のタイムスタンプが時系列で昇順であることを確認
    expect(result1.recordedAt.getTime()).toBeLessThan(result2.recordedAt.getTime());
    expect(result2.recordedAt.getTime()).toBeLessThan(result3.recordedAt.getTime());

    // ===== 【Test 9】 未来のタイムスタンプで再度拒否テスト =====
    const futureTimestamp2 = new Date("2024-01-15T15:00:00.000Z"); // 30分後
    expect(() =>
      recordJudgmentResult({
        caseId: "CASE-2024-005",
        assessorId: "ASSESSOR-45",
        assessorName: "田中太郎",
        judgmentContent: "承認",
        deviationRatePercent: 2.5,
        deviationAmountYen: 35000,
        referenceDataCount: 10,
        appliedCorrectionFactor: 0.98,
        judgmentReason: "妥当",
        recordedAt: futureTimestamp2
      })
    ).toThrow(/未来/);

    // ===== 【Test 10】 タイムスタンプのバリデーション境界値 =====
    // 現在時刻と 1 ミリ秒以内の時刻は受け入れられるか
    const almostNow = new Date("2024-01-15T14:31:00.001Z"); // now3 から 1ms 後
    const result4 = recordJudgmentResult({
      caseId: "CASE-2024-006",
      assessorId: "ASSESSOR-46",
      assessorName: "佐藤太郎",
      judgmentContent: "修正指示",
      deviationRatePercent: 12.0,
      deviationAmountYen: 180000,
      referenceDataCount: 6,
      appliedCorrectionFactor: 0.92,
      judgmentReason: "季節補正を加味し修正指示",
      recordedAt: almostNow
    });

    expect(result4.recordedAt.getTime()).toBe(almostNow.getTime());
    expect(result4.recordStatus).toBe("recorded");
  });
});