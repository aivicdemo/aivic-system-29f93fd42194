import { describe, test, expect } from "@jest/globals";
import {
  detectAnomaliesInSalesData,
} from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能", () => {
  test("SCEN-639: 正常な営業データセットから異常値が検出されない", () => {
    // 正常な営業データセット
    // - 顧客名: 有効
    // - 金額: 正のInteger、範囲内
    // - 日付: 有効なISO8601日付
    // - 商品コード: 正しい形式
    // - ステータス: 定義済み値
    const normalSalesData = {
      customer_id: "CUST-2024-001",
      customer_name: "テスト企業A",
      amount: 150000,
      transaction_date: "2024-01-15T09:30:00Z",
      product_code: "PROD-2024-001",
      status: "completed",
      appointment_count: 5,
      contract_count: 2,
      contact_date: "2024-01-15T08:00:00Z",
      contact_type: "phone",
      response_status: "positive",
    };

    // 異常値・漏れ検出機能を実行
    const detectionResult = detectAnomaliesInSalesData(normalSalesData);

    // 期待結果: 異常なし
    expect(detectionResult).toEqual({
      has_anomalies: false,
      anomaly_count: 0,
      anomalies: [],
      status: "valid",
    });
  });
});