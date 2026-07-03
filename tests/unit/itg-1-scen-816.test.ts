import { calculateRoutingDeadline } from "../../src/logic/it-1-1-1";

describe("相談内容の優先度ベース自動ルーティング機能", () => {
  test("SCEN-816: 優先度が最高値で指定された相談の対応期限が他の優先度より短く設定される", () => {
    // 優先度5（最高値）の相談に対するルーティング実行
    const highest_priority_consultation = {
      consultation_id: "CONS-001",
      priority_level: 5,
      created_at: new Date("2024-01-15T09:00:00Z"),
    };
    const highest_deadline = calculateRoutingDeadline(
      highest_priority_consultation
    );

    // 優先度3（中程度）の相談に対するルーティング実行
    const medium_priority_consultation = {
      consultation_id: "CONS-002",
      priority_level: 3,
      created_at: new Date("2024-01-15T09:00:00Z"),
    };
    const medium_deadline = calculateRoutingDeadline(
      medium_priority_consultation
    );

    // 優先度1（最低）の相談に対するルーティング実行
    const lowest_priority_consultation = {
      consultation_id: "CONS-003",
      priority_level: 1,
      created_at: new Date("2024-01-15T09:00:00Z"),
    };
    const lowest_deadline = calculateRoutingDeadline(lowest_priority_consultation);

    // 期待値の計算（優先度に基づく対応期限の短縮度）
    // 優先度5: 4営業日以内（96時間）
    const expected_highest = new Date("2024-01-19T09:00:00Z");
    // 優先度3: 7営業日以内（168時間）
    const expected_medium = new Date("2024-01-22T09:00:00Z");
    // 優先度1: 14営業日以内（336時間）
    const expected_lowest = new Date("2024-01-29T09:00:00Z");

    // 最高優先度の対応期限が中程度より短いことを検証
    expect(highest_deadline).toEqual(expected_highest);
    expect(highest_deadline.getTime()).toBeLessThan(medium_deadline.getTime());

    // 中程度優先度の対応期限が最低より短いことを検証
    expect(medium_deadline).toEqual(expected_medium);
    expect(medium_deadline.getTime()).toBeLessThan(lowest_deadline.getTime());

    // 最低優先度の対応期限が最も長いことを検証
    expect(lowest_deadline).toEqual(expected_lowest);

    // 段階的短縮の関係性を確認
    const highest_to_medium_reduction =
      medium_deadline.getTime() - highest_deadline.getTime();
    const medium_to_lowest_reduction =
      lowest_deadline.getTime() - medium_deadline.getTime();

    // 優先度が高いほど段階的に短くなることを検証（各段階で72時間差）
    expect(highest_to_medium_reduction).toBe(72 * 60 * 60 * 1000);
    expect(medium_to_lowest_reduction).toBe(168 * 60 * 60 * 1000);

    // 優先度5の期限が60営業時間（5営業日×12時間）以内であることを検証
    const hours_to_deadline_highest =
      (highest_deadline.getTime() - highest_priority_consultation.created_at.getTime()) /
      (60 * 60 * 1000);
    expect(hours_to_deadline_highest).toBe(96);

    // 優先度3の期限が168営業時間（7営業日）以内であることを検証
    const hours_to_deadline_medium =
      (medium_deadline.getTime() - medium_priority_consultation.created_at.getTime()) /
      (60 * 60 * 1000);
    expect(hours_to_deadline_medium).toBe(168);

    // 優先度1の期限が336営業時間（14営業日）以内であることを検証
    const hours_to_deadline_lowest =
      (lowest_deadline.getTime() - lowest_priority_consultation.created_at.getTime()) /
      (60 * 60 * 1000);
    expect(hours_to_deadline_lowest).toBe(336);
  });
});