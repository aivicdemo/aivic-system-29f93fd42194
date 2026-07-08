import { formulate_improvement_plan } from "../../src/logic/it-6-2-2-2";

describe("査定員別の判定精度・乖離パターン分析ダッシュボード", () => {
  // SCEN-1207: [error] 改善対策立案機能 - 原因仮説が不明確な場合にエラーまたは詳細分析要求が返される
  test("should return 400 and error message when root_cause_hypothesis is empty string", () => {
    const request_payload = {
      divergence_concentration_area: "hokkaido_residential_2024_Q1",
      analysis_completion_timestamp: "2024-01-31T17:00:00Z",
      priority_score: 85,
      root_cause_hypothesis: "",
    };

    expect(() => {
      formulate_improvement_plan(request_payload);
    }).toThrow(/原因仮説/);
  });

  test("should return 400 and error message when root_cause_hypothesis is undefined", () => {
    const request_payload = {
      divergence_concentration_area: "hokkaido_residential_2024_Q1",
      analysis_completion_timestamp: "2024-01-31T17:00:00Z",
      priority_score: 85,
      root_cause_hypothesis: undefined,
    };

    expect(() => {
      formulate_improvement_plan(request_payload);
    }).toThrow(/原因仮説/);
  });

  test("should return 400 and error message when root_cause_hypothesis is null", () => {
    const request_payload = {
      divergence_concentration_area: "hokkaido_residential_2024_Q1",
      analysis_completion_timestamp: "2024-01-31T17:00:00Z",
      priority_score: 85,
      root_cause_hypothesis: null,
    };

    expect(() => {
      formulate_improvement_plan(request_payload);
    }).toThrow(/原因仮説/);
  });

  test("should return 400 and error message when root_cause_hypothesis is whitespace only", () => {
    const request_payload = {
      divergence_concentration_area: "hokkaido_residential_2024_Q1",
      analysis_completion_timestamp: "2024-01-31T17:00:00Z",
      priority_score: 85,
      root_cause_hypothesis: "   ",
    };

    expect(() => {
      formulate_improvement_plan(request_payload);
    }).toThrow(/原因仮説/);
  });

  test("should return 422 and error message when root_cause_hypothesis is invalid format (missing required context)", () => {
    const request_payload = {
      divergence_concentration_area: "hokkaido_residential_2024_Q1",
      analysis_completion_timestamp: "2024-01-31T17:00:00Z",
      priority_score: 85,
      root_cause_hypothesis: "invalid_hypothesis_without_detail",
    };

    expect(() => {
      formulate_improvement_plan(request_payload);
    }).toThrow(/詳細/);
  });

  test("should successfully formulate improvement plan when root_cause_hypothesis is valid and clear", () => {
    const request_payload = {
      divergence_concentration_area: "hokkaido_residential_2024_Q1",
      analysis_completion_timestamp: "2024-01-31T17:00:00Z",
      priority_score: 85,
      root_cause_hypothesis: "学習データが北海道地域の冬季住宅修繕工事について不足しており、物価本の2024年版反映が遅延している",
    };

    const response = formulate_improvement_plan(request_payload);

    expect(response).toBeDefined();
    expect(response).toHaveProperty("improvement_plan_id");
    expect(response).toHaveProperty("status");
    expect(response.status).toBe("success");
    expect(response).toHaveProperty("corrective_actions");
    expect(Array.isArray(response.corrective_actions)).toBe(true);
    expect(response.corrective_actions.length).toBeGreaterThan(0);
    expect(response).toHaveProperty("implementation_priority_rank");
    expect(["high", "medium", "low"]).toContain(response.implementation_priority_rank);
    expect(response).toHaveProperty("estimated_implementation_days");
    expect(typeof response.estimated_implementation_days).toBe("number");
    expect(response.estimated_implementation_days).toBeGreaterThan(0);
  });

  test("should include clear detailed analysis feedback in response when improvement plan is formulated", () => {
    const request_payload = {
      divergence_concentration_area: "tokyo_commercial_2024_Q1",
      analysis_completion_timestamp: "2024-01-31T17:00:00Z",
      priority_score: 92,
      root_cause_hypothesis: "東京都内の商業ビル工事における過去案件データが時系列で不連続であり、季節変動への対応が不十分",
    };

    const response = formulate_improvement_plan(request_payload);

    expect(response).toHaveProperty("analysis_feedback");
    expect(response.analysis_feedback).toBeDefined();
    expect(typeof response.analysis_feedback).toBe("string");
    expect(response.analysis_feedback.length).toBeGreaterThan(0);
  });
});