import { generateAlternativeProposals } from "../../src/logic/it-6-2-1-1";

describe("改善提案却下時代替案自動生成機能", () => {
  // SCEN-1212
  test("却下理由が複数存在する場合に全ての理由に対応する代替案を提示する", () => {
    const rejectionReasons = [
      {
        reasonId: "reason_001",
        reasonCode: "INSUFFICIENT_DATA",
        reasonDescription: "学習データが不足している",
        affectedArea: "東京_土木工事_1000万円以上",
      },
      {
        reasonId: "reason_002",
        reasonCode: "MODEL_DRIFT",
        reasonDescription: "モデルドリフトが発生している",
        affectedArea: "大阪_建築工事_500万～1000万円",
      },
      {
        reasonId: "reason_003",
        reasonCode: "FORMAT_MISMATCH",
        reasonDescription: "見積書フォーマットが変更された",
        affectedArea: "名古屋_内装工事_100万～500万円",
      },
    ];

    const improvementProposal = {
      proposalId: "prop_20240115_001",
      proposalStatus: "REJECTED",
      rejectionReasons: rejectionReasons,
      originalProposalContent: {
        targetArea: "multiple_regions",
        proposedAction: "モデル再学習",
        estimatedEffectRate: 0.08,
      },
    };

    const result = generateAlternativeProposals(improvementProposal);

    expect(result).toBeDefined();
    expect(result.proposalId).toBe("prop_20240115_001");
    expect(result.alternativeProposals).toHaveLength(3);

    expect(result.alternativeProposals[0]).toEqual({
      alternativeId: expect.stringMatching(/^alt_reason_001_/),
      linkedReasonId: "reason_001",
      linkedReasonCode: "INSUFFICIENT_DATA",
      alternativeContent: {
        targetArea: "東京_土木工事_1000万円以上",
        proposedAction: "過去案件データ追加・学習データ拡充",
        estimatedEffectRate: 0.06,
        implementationDifficulty: 2,
      },
      generatedAt: expect.any(String),
    });

    expect(result.alternativeProposals[1]).toEqual({
      alternativeId: expect.stringMatching(/^alt_reason_002_/),
      linkedReasonId: "reason_002",
      linkedReasonCode: "MODEL_DRIFT",
      alternativeContent: {
        targetArea: "大阪_建築工事_500万～1000万円",
        proposedAction: "モデルパラメータ調整・再学習",
        estimatedEffectRate: 0.05,
        implementationDifficulty: 3,
      },
      generatedAt: expect.any(String),
    });

    expect(result.alternativeProposals[2]).toEqual({
      alternativeId: expect.stringMatching(/^alt_reason_003_/),
      linkedReasonId: "reason_003",
      linkedReasonCode: "FORMAT_MISMATCH",
      alternativeContent: {
        targetArea: "名古屋_内装工事_100万～500万円",
        proposedAction: "OCRモデルカスタマイズ・フォーマット対応",
        estimatedEffectRate: 0.07,
        implementationDifficulty: 4,
      },
      generatedAt: expect.any(String),
    });

    expect(result.alternativeProposals.length).toBe(
      result.rejectionReasons.length
    );

    result.alternativeProposals.forEach((alt, idx) => {
      expect(alt.linkedReasonId).toBe(rejectionReasons[idx].reasonId);
      expect(alt.linkedReasonCode).toBe(rejectionReasons[idx].reasonCode);
    });

    result.alternativeProposals.forEach((alt) => {
      expect(alt.alternativeContent.proposedAction).toBeTruthy();
      expect(alt.alternativeContent.estimatedEffectRate).toBeGreaterThan(0);
      expect(alt.alternativeContent.estimatedEffectRate).toBeLessThanOrEqual(1);
      expect(alt.alternativeContent.implementationDifficulty).toBeGreaterThan(0);
      expect(alt.alternativeContent.implementationDifficulty).toBeLessThanOrEqual(
        5
      );
    });

    expect(result.generatedCount).toBe(3);
    expect(result.generatedCount).toBe(result.alternativeProposals.length);
    expect(result.generatedCount).toBe(rejectionReasons.length);
  });
});