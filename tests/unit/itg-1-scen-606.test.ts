import { detectBillingAnomalies } from "../../src/logic/it-1-2-1";

describe("営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能", () => {
  test("SCEN-606: 請求額計算・異常値検出機能 - 計算結果が前月実績から大幅に乖離する場合に異常値として検出される", () => {
    const previous_billing_amount = 100000;
    const current_billing_amount = 150000;
    const threshold_percentage = 30;

    const result = detectBillingAnomalies({
      previous_billing_amount,
      current_billing_amount,
      threshold_percentage,
    });

    const expected_deviation_rate = 50;
    const is_anomaly_expected = true;

    expect(result.is_anomaly).toBe(is_anomaly_expected);
    expect(result.deviation_rate).toBe(expected_deviation_rate);
    expect(result.previous_amount).toBe(previous_billing_amount);
    expect(result.current_amount).toBe(current_billing_amount);
    expect(result.alert_message).toMatch(/乖離率/);
    expect(result.alert_message).toMatch(/50/);
  });
});