import { describe, test, expect, beforeEach } from "@jest/globals";
import {
  detectAnomalyInReportData,
} from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1156
  test("レポート内異常値・矛盾検出 - 売上金額が契約金額を超過している異常値が正しく検出される", () => {
    const contract_id = "CONTRACT_001";
    const contract_amount = 1000000;
    const report_sales_amount = 1500000;
    const detection_timestamp = new Date("2024-01-15T10:30:00Z");
    const excess_amount = 500000;

    const input_report = {
      contract_id: contract_id,
      contract_amount: contract_amount,
      report_sales_amount: report_sales_amount,
      detection_timestamp: detection_timestamp,
    };

    const result = detectAnomalyInReportData(input_report);

    expect(result).toEqual({
      is_anomaly_detected: true,
      alert_level: "ERROR",
      contract_id: contract_id,
      contract_amount: contract_amount,
      report_sales_amount: report_sales_amount,
      excess_amount: excess_amount,
      detection_timestamp: detection_timestamp,
      error_message: "売上金額が契約金額を超過しています",
      anomaly_records: [
        {
          contract_id: contract_id,
          contract_amount: contract_amount,
          report_sales_amount: report_sales_amount,
          excess_amount: excess_amount,
          detected_at: detection_timestamp,
        },
      ],
    });

    expect(result.is_anomaly_detected).toBe(true);
    expect(result.alert_level).toBe("ERROR");
    expect(result.excess_amount).toBe(500000);
    expect(result.anomaly_records).toHaveLength(1);
    expect(result.anomaly_records[0].contract_id).toBe(contract_id);
  });

  // SCEN-1156: エラーケース検証 - 売上金額が負数の場合
  test("レポート内異常値・矛盾検出 - 売上金額が負数の場合はエラーを発生させる", () => {
    const input_report_negative = {
      contract_id: "CONTRACT_002",
      contract_amount: 1000000,
      report_sales_amount: -500000,
      detection_timestamp: new Date("2024-01-15T11:00:00Z"),
    };

    expect(() => detectAnomalyInReportData(input_report_negative)).toThrow(
      /売上金額/
    );
  });

  // SCEN-1156: 正常系検証 - 売上金額が契約金額以下の場合
  test("レポート内異常値・矛盾検出 - 売上金額が契約金額以下の場合は異常値が検出されない", () => {
    const input_report_normal = {
      contract_id: "CONTRACT_003",
      contract_amount: 1000000,
      report_sales_amount: 800000,
      detection_timestamp: new Date("2024-01-15T12:00:00Z"),
    };

    const result = detectAnomalyInReportData(input_report_normal);

    expect(result).toEqual({
      is_anomaly_detected: false,
      alert_level: "NONE",
      contract_id: "CONTRACT_003",
      contract_amount: 1000000,
      report_sales_amount: 800000,
      excess_amount: 0,
      detection_timestamp: new Date("2024-01-15T12:00:00Z"),
      error_message: "",
      anomaly_records: [],
    });

    expect(result.is_anomaly_detected).toBe(false);
    expect(result.alert_level).toBe("NONE");
    expect(result.excess_amount).toBe(0);
    expect(result.anomaly_records).toHaveLength(0);
  });

  // SCEN-1156: 契約金額が0の場合エラー
  test("レポート内異常値・矛盾検出 - 契約金額が0または負数の場合はエラーを発生させる", () => {
    const input_report_zero_contract = {
      contract_id: "CONTRACT_004",
      contract_amount: 0,
      report_sales_amount: 500000,
      detection_timestamp: new Date("2024-01-15T13:00:00Z"),
    };

    expect(() =>
      detectAnomalyInReportData(input_report_zero_contract)
    ).toThrow(/契約金額/);
  });

  // SCEN-1156: 必須項目欠落検証
  test("レポート内異常値・矛盾検出 - 必須項目が欠落している場合はエラーを発生させる", () => {
    const input_report_missing_field = {
      contract_id: "CONTRACT_005",
      contract_amount: 1000000,
      // report_sales_amount が欠落
      detection_timestamp: new Date("2024-01-15T14:00:00Z"),
    } as any;

    expect(() =>
      detectAnomalyInReportData(input_report_missing_field)
    ).toThrow(/必須項目/);
  });

  // SCEN-1156: 複数レコード検証 - 複数の異常値が混在する場合
  test("レポート内異常値・矛盾検出 - 複数の異常値が混在する場合すべてが検出される", () => {
    const input_report_multiple = {
      contract_id: "CONTRACT_006",
      contract_amount: 1000000,
      report_sales_amount: 2000000,
      detection_timestamp: new Date("2024-01-15T15:00:00Z"),
    };

    const result = detectAnomalyInReportData(input_report_multiple);

    expect(result.is_anomaly_detected).toBe(true);
    expect(result.alert_level).toBe("ERROR");
    expect(result.excess_amount).toBe(1000000);
    expect(result.anomaly_records).toHaveLength(1);
    expect(result.anomaly_records[0].excess_amount).toBe(1000000);
  });

  // SCEN-1156: 売上金額が契約金額と同額の場合
  test("レポート内異常値・矛盾検出 - 売上金額が契約金額と同額の場合は異常値が検出されない", () => {
    const input_report_equal = {
      contract_id: "CONTRACT_007",
      contract_amount: 1000000,
      report_sales_amount: 1000000,
      detection_timestamp: new Date("2024-01-15T16:00:00Z"),
    };

    const result = detectAnomalyInReportData(input_report_equal);

    expect(result.is_anomaly_detected).toBe(false);
    expect(result.alert_level).toBe("NONE");
    expect(result.excess_amount).toBe(0);
  });

  // SCEN-1156: タイムスタンプの正確性検証
  test("レポート内異常値・矛盾検出 - 検出時刻が正確に記録される", () => {
    const test_timestamp = new Date("2024-01-20T09:45:30Z");
    const input_report_timestamp = {
      contract_id: "CONTRACT_008",
      contract_amount: 500000,
      report_sales_amount: 750000,
      detection_timestamp: test_timestamp,
    };

    const result = detectAnomalyInReportData(input_report_timestamp);

    expect(result.detection_timestamp).toEqual(test_timestamp);
    expect(result.anomaly_records[0].detected_at).toEqual(test_timestamp);
  });

  // SCEN-1156: 小数点を含む金額の検証
  test("レポート内異常値・矛盾検出 - 小数点を含む金額でも正しく計算される", () => {
    const input_report_decimal = {
      contract_id: "CONTRACT_009",
      contract_amount: 1000000.5,
      report_sales_amount: 1500000.75,
      detection_timestamp: new Date("2024-01-15T17:00:00Z"),
    };

    const result = detectAnomalyInReportData(input_report_decimal);

    expect(result.is_anomaly_detected).toBe(true);
    expect(result.excess_amount).toBeCloseTo(500000.25, 2);
  });
});