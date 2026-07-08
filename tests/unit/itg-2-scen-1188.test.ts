import { detectAndPrioritizeAnomalies } from "../../src/logic/it-1-br-6-2-1";

describe("査定員別判定ばらつき率と相場乖離傾向の自動集計・分析", () => {
  test("SCEN-1188: 異常指標検出・優先度付け機能 - 4指標すべてが閾値超過時に優先度付き一覧が正しく生成される", () => {
    // テストデータ: 4つの指標がすべて閾値を超過した状態を設定
    const indicators = [
      {
        indicator_name: "指標A",
        current_value: 150,
        threshold_value: 100,
        exceeding_rate: 150,
      },
      {
        indicator_name: "指標B",
        current_value: 120,
        threshold_value: 100,
        exceeding_rate: 120,
      },
      {
        indicator_name: "指標C",
        current_value: 180,
        threshold_value: 100,
        exceeding_rate: 180,
      },
      {
        indicator_name: "指標D",
        current_value: 110,
        threshold_value: 100,
        exceeding_rate: 110,
      },
    ];

    // 異常検出と優先度付け実行
    const result = detectAndPrioritizeAnomalies(indicators);

    // 期待結果: 優先度付きの一覧が生成される
    expect(result).toBeDefined();
    expect(result.anomalies).toBeDefined();
    expect(Array.isArray(result.anomalies)).toBe(true);

    // 超過度合いが最も大きい順に優先度が付与されている（指標C → 指標A → 指標B → 指標D）
    expect(result.anomalies.length).toBe(4);

    // 1位: 指標C（超過率180%）
    expect(result.anomalies[0].priority_rank).toBe(1);
    expect(result.anomalies[0].indicator_name).toBe("指標C");
    expect(result.anomalies[0].exceeding_rate).toBe(180);
    expect(result.anomalies[0].current_value).toBe(180);
    expect(result.anomalies[0].threshold_value).toBe(100);

    // 2位: 指標A（超過率150%）
    expect(result.anomalies[1].priority_rank).toBe(2);
    expect(result.anomalies[1].indicator_name).toBe("指標A");
    expect(result.anomalies[1].exceeding_rate).toBe(150);
    expect(result.anomalies[1].current_value).toBe(150);
    expect(result.anomalies[1].threshold_value).toBe(100);

    // 3位: 指標B（超過率120%）
    expect(result.anomalies[2].priority_rank).toBe(3);
    expect(result.anomalies[2].indicator_name).toBe("指標B");
    expect(result.anomalies[2].exceeding_rate).toBe(120);
    expect(result.anomalies[2].current_value).toBe(120);
    expect(result.anomalies[2].threshold_value).toBe(100);

    // 4位: 指標D（超過率110%）
    expect(result.anomalies[3].priority_rank).toBe(4);
    expect(result.anomalies[3].indicator_name).toBe("指標D");
    expect(result.anomalies[3].exceeding_rate).toBe(110);
    expect(result.anomalies[3].current_value).toBe(110);
    expect(result.anomalies[3].threshold_value).toBe(100);

    // 各指標の超過率が正確に反映されている
    expect(result.anomalies[0].exceeding_rate).toBe(180);
    expect(result.anomalies[1].exceeding_rate).toBe(150);
    expect(result.anomalies[2].exceeding_rate).toBe(120);
    expect(result.anomalies[3].exceeding_rate).toBe(110);

    // 最高優先度が超過度合いが最も大きい指標に割り当てられている
    const max_exceeding_rate = Math.max(
      ...indicators.map((ind) => ind.exceeding_rate)
    );
    expect(result.anomalies[0].exceeding_rate).toBe(max_exceeding_rate);

    // 生成されたデータ構造が正しい形式である
    result.anomalies.forEach((anomaly: any) => {
      expect(anomaly).toHaveProperty("indicator_name");
      expect(anomaly).toHaveProperty("current_value");
      expect(anomaly).toHaveProperty("threshold_value");
      expect(anomaly).toHaveProperty("exceeding_rate");
      expect(anomaly).toHaveProperty("priority_rank");
      expect(typeof anomaly.priority_rank).toBe("number");
      expect(typeof anomaly.exceeding_rate).toBe("number");
    });
  });
});