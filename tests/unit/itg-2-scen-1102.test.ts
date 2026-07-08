import { generateMonthlyAnalysisReport } from "../../src/logic/it-6-3-1";

describe("査定判定ロジックの適用履歴と根拠の記録・検索機能", () => {
  // SCEN-1102
  test("月次分析レポート生成機能 - 査定業務が完了していない査定員がいる場合、レポート生成が中止されエラーが返される", async () => {
    // 前提: 査定員Aと査定員Bを登録する
    const assessor_a = {
      assessor_id: "ASS001",
      assessor_name: "査定員A",
      department_id: "DEPT001",
      status: "active",
    };
    const assessor_b = {
      assessor_id: "ASS002",
      assessor_name: "査定員B",
      department_id: "DEPT001",
      status: "active",
    };

    // 査定員Aの当月査定業務を完了状態に設定する
    const assessor_a_work = {
      assessor_id: "ASS001",
      assessment_month: "2024-01",
      work_status: "completed",
      completed_count: 15,
      completed_at: new Date("2024-01-31T18:00:00Z"),
    };

    // 査定員Bの当月査定業務を未完了状態のままにする
    const assessor_b_work = {
      assessor_id: "ASS002",
      assessment_month: "2024-01",
      work_status: "incomplete",
      completed_count: 8,
      completed_at: null,
    };

    // 月次分析レポート生成機能を実行する
    const request_payload = {
      report_month: "2024-01",
      department_id: "DEPT001",
      assessors: [assessor_a, assessor_b],
      work_status_list: [assessor_a_work, assessor_b_work],
    };

    // レスポンスを確認する
    let error_response: any = null;
    let error_thrown = false;

    try {
      await generateMonthlyAnalysisReport(request_payload);
    } catch (err: any) {
      error_thrown = true;
      error_response = err;
    }

    // (1) エラーが返されること
    expect(error_thrown).toBe(true);

    // (2) HTTPステータスコードが400または422であること
    expect(
      error_response.status === 400 || error_response.status === 422
    ).toBe(true);

    // (3) エラーメッセージに『査定業務が完了していない査定員が存在します』が含まれること
    expect(error_response.message).toMatch(/査定業務が完了していない査定員/);

    // (4) レポートファイルが生成されていないこと
    expect(error_response.report_file_generated).toBe(false);

    // (5) エラーレスポンスに未完了の査定員情報（査定員B）が含まれていること
    expect(error_response.incomplete_assessors).toBeDefined();
    expect(error_response.incomplete_assessors).toHaveLength(1);
    expect(error_response.incomplete_assessors[0].assessor_id).toBe("ASS002");
    expect(error_response.incomplete_assessors[0].assessor_name).toBe("査定員B");
    expect(error_response.incomplete_assessors[0].work_status).toBe("incomplete");
  });
});