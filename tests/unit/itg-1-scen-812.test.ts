import { recordResponsePlan } from "../../src/logic/it-1781935279444-2-2-1";

describe("対応方針の決定・記録機能", () => {
  // SCEN-812
  test("対応方針の記録時に必須項目が欠落している場合にエラーが発生する", () => {
    // 必須項目が完全に揃ったベースケース
    const validInput = {
      response_plan_name: "緊急対応",
      response_content: "顧客へ電話で即座に説明する",
      scheduled_execution_date: "2024-02-15T14:00:00Z",
      priority: "high",
      assignee: "代表者",
    };

    // ケース1: 対応方針名が空白
    expect(() =>
      recordResponsePlan({
        response_plan_name: "",
        response_content: "顧客へ電話で即座に説明する",
        scheduled_execution_date: "2024-02-15T14:00:00Z",
        priority: "high",
        assignee: "代表者",
      })
    ).toThrow(/対応方針名/);

    // ケース2: 対応内容が空白
    expect(() =>
      recordResponsePlan({
        response_plan_name: "緊急対応",
        response_content: "",
        scheduled_execution_date: "2024-02-15T14:00:00Z",
        priority: "high",
        assignee: "代表者",
      })
    ).toThrow(/対応内容/);

    // ケース3: 実施予定日が空白
    expect(() =>
      recordResponsePlan({
        response_plan_name: "緊急対応",
        response_content: "顧客へ電話で即座に説明する",
        scheduled_execution_date: "",
        priority: "high",
        assignee: "代表者",
      })
    ).toThrow(/実施予定日/);

    // ケース4: 優先度が空白
    expect(() =>
      recordResponsePlan({
        response_plan_name: "緊急対応",
        response_content: "顧客へ電話で即座に説明する",
        scheduled_execution_date: "2024-02-15T14:00:00Z",
        priority: "",
        assignee: "代表者",
      })
    ).toThrow(/優先度/);

    // ケース5: 担当者が空白
    expect(() =>
      recordResponsePlan({
        response_plan_name: "緊急対応",
        response_content: "顧客へ電話で即座に説明する",
        scheduled_execution_date: "2024-02-15T14:00:00Z",
        priority: "high",
        assignee: "",
      })
    ).toThrow(/担当者/);

    // ケース6: 複数項目が欠落している場合
    expect(() =>
      recordResponsePlan({
        response_plan_name: "",
        response_content: "",
        scheduled_execution_date: "2024-02-15T14:00:00Z",
        priority: "high",
        assignee: "代表者",
      })
    ).toThrow(/必須項目/);

    // ケース7: 正常な入力で成功する
    const result = recordResponsePlan(validInput);
    expect(result).toEqual({
      success: true,
      response_plan_id: expect.any(String),
      response_plan_name: "緊急対応",
      response_content: "顧客へ電話で即座に説明する",
      scheduled_execution_date: "2024-02-15T14:00:00Z",
      priority: "high",
      assignee: "代表者",
      recorded_at: expect.any(String),
      status: "pending",
    });
    expect(result.response_plan_id).toBeTruthy();
    expect(result.status).toBe("pending");
  });
});