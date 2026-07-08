import { evaluateSystemUptimeStatus } from "../../src/logic/it-6-3-1";

describe("査定判定ロジックの適用履歴と根拠の記録・検索機能", () => {
  test("SCEN-1297: 月次システム稼働率が99.5%ちょうどのとき、許容範囲内（OK）と判定される", () => {
    const monthly_uptime_percent = 99.5;
    const threshold_lower_bound = 99.5;

    const result = evaluateSystemUptimeStatus({
      monthly_uptime_percent,
      threshold_lower_bound,
    });

    expect(result.judgment_status).toBe("OK");
    expect(result.is_within_acceptable_range).toBe(true);
    expect(result.http_status_code).toBe(200);
    expect(result.monthly_uptime_percent).toBe(99.5);
  });
});