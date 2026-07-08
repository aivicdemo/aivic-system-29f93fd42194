import { determineStaffingRequestTiming } from "../../src/logic/it-6-2-2-1";

describe("it-6-2-2-1: 応援要請タイミング・規模の最終決定と計画確定", () => {
  test("SCEN-972: 必要人員数が配置可能人数を超過する場合エラーが返される", () => {
    // 前提: 月次の査定件数予測と査定員別の平均処理能力が算出されている状態
    // 発生条件: 複数の人員配置シナリオが立案され、翌月の繁忙度予測と必要人員数が算出されている状態
    // 期待結果: 必要人員数が配置可能人数を超過している旨のエラーメッセージが返され、計画が確定されない

    const input = {
      required_staff_count: 45,
      available_staff_count: 40,
      current_staff_count: 30,
      support_start_date: "2024-02-01",
      support_end_date: "2024-02-29",
      busy_level: "high",
      plan_status: "pending_confirmation"
    };

    expect(() => {
      determineStaffingRequestTiming(input);
    }).toThrow(/配置可能人数/);
  });
});