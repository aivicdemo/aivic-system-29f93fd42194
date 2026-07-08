import { updateImprovementPlanData } from "../../src/logic/it-6-2-2-2";

const fetchMock = require("jest-fetch-mock");
fetchMock.enableMocks();

describe("改善計画データ登録・記録機能", () => {
  test("SCEN-1489: 改善計画が承認されていない状態でデータ追加・更新を実行した場合、操作が拒否されエラーが返される", async () => {
    fetchMock.resetMocks();

    const improvement_plan_id = "IP-20240115-001";
    const improvement_plan_status = "draft";
    const data_item_id = "DI-20240115-001";
    const new_data_value = "新規学習データセット";

    const errorResponse = {
      error_code: "IMPROVEMENT_PLAN_NOT_APPROVED",
      error_message:
        "この改善計画はまだ承認されていません。承認後にデータを追加・更新してください",
      improvement_plan_id: improvement_plan_id,
      improvement_plan_status: improvement_plan_status,
    };

    fetchMock.mockResponseOnce(JSON.stringify(errorResponse), {
      status: 400,
    });

    const result = await updateImprovementPlanData({
      improvement_plan_id: improvement_plan_id,
      improvement_plan_status: improvement_plan_status,
      data_item_id: data_item_id,
      operation_type: "add",
      data_value: new_data_value,
    });

    expect(result.success).toBe(false);
    expect(result.error_code).toBe("IMPROVEMENT_PLAN_NOT_APPROVED");
    expect(result.error_message).toMatch(
      /この改善計画はまだ承認されていません/
    );
    expect(result.http_status).toBe(400);
    expect(result.improvement_plan_id).toBe(improvement_plan_id);

    const last_call = fetchMock.mock.calls[0];
    expect(last_call).toBeDefined();
    expect(last_call[1].method).toBe("POST");
  });
});