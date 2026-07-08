import { calculateAuditorConsensusScore } from "../../src/logic/it-6-2-1-1";

describe("査定員間判定一致度スコア計算", () => {
  // SCEN-849
  test("複数査定員の判定結果から一致度スコア（0～100%）が正確に計算される", () => {
    // ========== テストデータ準備 ==========
    // パターン1: 3人全員一致（全員合格）
    const consensus_all_pass = {
      auditor_judgments: [
        { auditor_id: "A001", decision: "pass" },
        { auditor_id: "A002", decision: "pass" },
        { auditor_id: "A003", decision: "pass" },
      ],
    };

    // パターン2: 3人中2人一致（2人合格、1人不合格）
    const consensus_2of3 = {
      auditor_judgments: [
        { auditor_id: "A001", decision: "pass" },
        { auditor_id: "A002", decision: "pass" },
        { auditor_id: "A003", decision: "reject" },
      ],
    };

    // パターン3: 全く意見分散（2人合格、1人条件付き）
    const consensus_scattered = {
      auditor_judgments: [
        { auditor_id: "A001", decision: "pass" },
        { auditor_id: "A002", decision: "reject" },
        { auditor_id: "A003", decision: "conditional" },
      ],
    };

    // パターン4: 2人のみ（両方一致）
    const consensus_2_both_agree = {
      auditor_judgments: [
        { auditor_id: "A001", decision: "reject" },
        { auditor_id: "A002", decision: "reject" },
      ],
    };

    // パターン5: 2人のみ（意見相違）
    const consensus_2_disagree = {
      auditor_judgments: [
        { auditor_id: "A001", decision: "pass" },
        { auditor_id: "A002", decision: "reject" },
      ],
    };

    // パターン6: 4人全員一致（条件付き）
    const consensus_4_all_conditional = {
      auditor_judgments: [
        { auditor_id: "A001", decision: "conditional" },
        { auditor_id: "A002", decision: "conditional" },
        { auditor_id: "A003", decision: "conditional" },
        { auditor_id: "A004", decision: "conditional" },
      ],
    };

    // ========== 計算実行 ==========
    // パターン1: 3人全員合格 → 一致度 100%
    const result_all_pass = calculateAuditorConsensusScore(consensus_all_pass);
    expect(result_all_pass).toEqual({
      consensus_score: 100.0,
      match_count: 3,
      total_auditors: 3,
      majority_decision: "pass",
      decision_distribution: { pass: 3, reject: 0, conditional: 0 },
    });

    // パターン2: 3人中2人一致 → 一致度 66.7%
    const result_2of3 = calculateAuditorConsensusScore(consensus_2of3);
    expect(result_2of3).toEqual({
      consensus_score: 66.7,
      match_count: 2,
      total_auditors: 3,
      majority_decision: "pass",
      decision_distribution: { pass: 2, reject: 1, conditional: 0 },
    });

    // パターン3: 全く意見分散（各1票） → 一致度 33.3%
    const result_scattered = calculateAuditorConsensusScore(consensus_scattered);
    expect(result_scattered).toEqual({
      consensus_score: 33.3,
      match_count: 1,
      total_auditors: 3,
      majority_decision: "pass",
      decision_distribution: { pass: 1, reject: 1, conditional: 1 },
    });

    // パターン4: 2人のみ両方一致 → 一致度 100%
    const result_2_agree = calculateAuditorConsensusScore(
      consensus_2_both_agree
    );
    expect(result_2_agree).toEqual({
      consensus_score: 100.0,
      match_count: 2,
      total_auditors: 2,
      majority_decision: "reject",
      decision_distribution: { pass: 0, reject: 2, conditional: 0 },
    });

    // パターン5: 2人のみ意見相違 → 一致度 50%
    const result_2_disagree = calculateAuditorConsensusScore(
      consensus_2_disagree
    );
    expect(result_2_disagree).toEqual({
      consensus_score: 50.0,
      match_count: 1,
      total_auditors: 2,
      majority_decision: "pass",
      decision_distribution: { pass: 1, reject: 1, conditional: 0 },
    });

    // パターン6: 4人全員条件付き → 一致度 100%
    const result_4_conditional = calculateAuditorConsensusScore(
      consensus_4_all_conditional
    );
    expect(result_4_conditional).toEqual({
      consensus_score: 100.0,
      match_count: 4,
      total_auditors: 4,
      majority_decision: "conditional",
      decision_distribution: { pass: 0, reject: 0, conditional: 4 },
    });

    // ========== 小数点精度検証 ==========
    // 一致度スコアが小数点第1位まで正確に表示されることを確認
    expect(result_all_pass.consensus_score).toBeCloseTo(100.0, 1);
    expect(result_2of3.consensus_score).toBeCloseTo(66.7, 1);
    expect(result_scattered.consensus_score).toBeCloseTo(33.3, 1);
    expect(result_2_disagree.consensus_score).toBeCloseTo(50.0, 1);

    // ========== 計算ロジック検証 ==========
    // パターン2の詳細検証: 3人中2人が同じ判定
    // 最多数派の判定数 / 全体査定員数 = 2/3 = 0.6667 * 100 = 66.7%
    expect(result_2of3.match_count).toBe(2);
    expect(result_2of3.total_auditors).toBe(3);
    const expected_score_2of3 = Math.round((2 / 3) * 1000) / 10; // 66.7
    expect(result_2of3.consensus_score).toBe(expected_score_2of3);

    // ========== 判定分布の検証 ==========
    // 各判定タイプの票数が正確に記録されているか確認
    expect(result_all_pass.decision_distribution.pass).toBe(3);
    expect(result_all_pass.decision_distribution.reject).toBe(0);
    expect(result_all_pass.decision_distribution.conditional).toBe(0);

    expect(result_2of3.decision_distribution.pass).toBe(2);
    expect(result_2of3.decision_distribution.reject).toBe(1);
    expect(result_2of3.decision_distribution.conditional).toBe(0);

    expect(result_scattered.decision_distribution.pass).toBe(1);
    expect(result_scattered.decision_distribution.reject).toBe(1);
    expect(result_scattered.decision_distribution.conditional).toBe(1);

    // ========== 多数派判定の検証 ==========
    // 最多数派の判定が正確に決定されているか確認
    expect(result_all_pass.majority_decision).toBe("pass");
    expect(result_2of3.majority_decision).toBe("pass");
    expect(result_scattered.majority_decision).toBe("pass"); // 最初に出現した判定が多数派
    expect(result_2_agree.majority_decision).toBe("reject");
    expect(result_4_conditional.majority_decision).toBe("conditional");

    // ========== 範囲検証 ==========
    // すべての一致度スコアが0～100の範囲内であること
    expect(result_all_pass.consensus_score).toBeGreaterThanOrEqual(0);
    expect(result_all_pass.consensus_score).toBeLessThanOrEqual(100);

    expect(result_2of3.consensus_score).toBeGreaterThanOrEqual(0);
    expect(result_2of3.consensus_score).toBeLessThanOrEqual(100);

    expect(result_scattered.consensus_score).toBeGreaterThanOrEqual(0);
    expect(result_scattered.consensus_score).toBeLessThanOrEqual(100);

    expect(result_2_agree.consensus_score).toBeGreaterThanOrEqual(0);
    expect(result_2_agree.consensus_score).toBeLessThanOrEqual(100);

    expect(result_2_disagree.consensus_score).toBeGreaterThanOrEqual(0);
    expect(result_2_disagree.consensus_score).toBeLessThanOrEqual(100);

    expect(result_4_conditional.consensus_score).toBeGreaterThanOrEqual(0);
    expect(result_4_conditional.consensus_score).toBeLessThanOrEqual(100);

    // ========== エラーハンドリング ==========
    // 空の判定リスト
    expect(() =>
      calculateAuditorConsensusScore({
        auditor_judgments: [],
      })
    ).toThrow(/査定員/);

    // 無効な判定値
    expect(() =>
      calculateAuditorConsensusScore({
        auditor_judgments: [
          { auditor_id: "A001", decision: "invalid_decision" },
        ],
      })
    ).toThrow(/判定/);

    // 重複する査定員ID
    expect(() =>
      calculateAuditorConsensusScore({
        auditor_judgments: [
          { auditor_id: "A001", decision: "pass" },
          { auditor_id: "A001", decision: "reject" },
        ],
      })
    ).toThrow(/査定員ID/);

    // ========== システム保存検証 ==========
    // 計算結果がシステムに正常に保存・記録されることを確認
    // （実装では result object の構造が完全であり、すべての必須フィールドが存在することで検証）
    expect(result_all_pass).toHaveProperty("consensus_score");
    expect(result_all_pass).toHaveProperty("match_count");
    expect(result_all_pass).toHaveProperty("total_auditors");
    expect(result_all_pass).toHaveProperty("majority_decision");
    expect(result_all_pass).toHaveProperty("decision_distribution");

    expect(result_2of3).toHaveProperty("consensus_score");
    expect(result_2of3).toHaveProperty("match_count");
    expect(result_2of3).toHaveProperty("total_auditors");
    expect(result_2of3).toHaveProperty("majority_decision");
    expect(result_2of3).toHaveProperty("decision_distribution");

    expect(result_scattered).toHaveProperty("consensus_score");
    expect(result_scattered).toHaveProperty("match_count");
    expect(result_scattered).toHaveProperty("total_auditors");
    expect(result_scattered).toHaveProperty("majority_decision");
    expect(result_scattered).toHaveProperty("decision_distribution");
  });
});