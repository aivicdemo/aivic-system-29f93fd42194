import { determineImprovementPriority } from "../../src/logic/it-1-br-6-2-1";

describe("改善優先度判定機能", () => {
  // SCEN-1160
  test("[normal] 複数の改善フィードバックから優先度を正しく判定し、優先順位リストを生成する", () => {
    const feedbacks = [
      {
        feedbackId: "FB001",
        improvementTitle: "OCR精度向上",
        priorityScore: 85,
        impactScore: 90,
        implementationDifficulty: 45,
        frequency: 12,
      },
      {
        feedbackId: "FB002",
        improvementTitle: "判定ロジック修正",
        priorityScore: 85,
        impactScore: 75,
        implementationDifficulty: 30,
        frequency: 8,
      },
      {
        feedbackId: "FB003",
        improvementTitle: "学習データ追加",
        priorityScore: 65,
        impactScore: 80,
        implementationDifficulty: 55,
        frequency: 5,
      },
      {
        feedbackId: "FB004",
        improvementTitle: "パラメータ調整",
        priorityScore: 50,
        impactScore: 40,
        implementationDifficulty: 20,
        frequency: 3,
      },
    ];

    const result = determineImprovementPriority(feedbacks);

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(4);

    expect(result[0].feedbackId).toBe("FB001");
    expect(result[0].priorityScore).toBe(85);
    expect(result[0].impactScore).toBe(90);

    expect(result[1].feedbackId).toBe("FB002");
    expect(result[1].priorityScore).toBe(85);
    expect(result[1].impactScore).toBe(75);

    expect(result[2].feedbackId).toBe("FB003");
    expect(result[2].priorityScore).toBe(65);

    expect(result[3].feedbackId).toBe("FB004");
    expect(result[3].priorityScore).toBe(50);

    for (let i = 0; i < result.length - 1; i++) {
      if (result[i].priorityScore === result[i + 1].priorityScore) {
        expect(result[i].impactScore).toBeGreaterThanOrEqual(
          result[i + 1].impactScore
        );
      } else {
        expect(result[i].priorityScore).toBeGreaterThan(
          result[i + 1].priorityScore
        );
      }
    }

    const feedbackIds = result.map((r) => r.feedbackId);
    expect(feedbackIds).toContain("FB001");
    expect(feedbackIds).toContain("FB002");
    expect(feedbackIds).toContain("FB003");
    expect(feedbackIds).toContain("FB004");
  });
});