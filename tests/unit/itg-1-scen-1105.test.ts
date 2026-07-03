import { validateSalesDataQuality } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データ品質検証 - 複数異常値の同時検出", () => {
  // SCEN-1105
  test("複数の異常値が同時に存在する場合に全て検出され修正対象項目が通知される", () => {
    // 準備: 複数の異常値を含む営業データレコード
    const testSalesData = {
      record_id: "SR20240115001",
      customer_name: "",           // 異常1: 必須項目欠落（空白）
      transaction_date: "2025-12-31",  // 異常2: 未来日
      sales_amount: -50000,        // 異常3: 負の金額
      discount_rate: 1.5,          // 異常4: 範囲外（0.0 ～ 1.0 を超過）
      service_type: "standard",
      appointment_count: 3,
      contract_count: 1,
      contact_date: "2024-01-15"
    };

    // 実行: 異常値・欠落データ自動検出機能
    const result = validateSalesDataQuality(testSalesData);

    // 検証1: 検出された異常値の件数が複数存在することを確認
    expect(result.anomalies.length).toBe(4);

    // 検証2: 各異常値に対応する修正対象項目が正確に特定されていることを確認
    const anomalyTypes = result.anomalies.map((a: any) => a.field_name);
    expect(anomalyTypes).toContain("customer_name");
    expect(anomalyTypes).toContain("transaction_date");
    expect(anomalyTypes).toContain("sales_amount");
    expect(anomalyTypes).toContain("discount_rate");

    // 検証3: 修正対象項目の通知内容（項目名、異常値の種類、推奨修正内容）
    const customerNameAnomaly = result.anomalies.find(
      (a: any) => a.field_name === "customer_name"
    );
    expect(customerNameAnomaly).toEqual({
      field_name: "customer_name",
      anomaly_type: "required_field_missing",
      current_value: "",
      recommended_action: "顧客名を入力してください"
    });

    const transactionDateAnomaly = result.anomalies.find(
      (a: any) => a.field_name === "transaction_date"
    );
    expect(transactionDateAnomaly).toEqual({
      field_name: "transaction_date",
      anomaly_type: "future_date",
      current_value: "2025-12-31",
      recommended_action: "過去の日付に修正してください"
    });

    const salesAmountAnomaly = result.anomalies.find(
      (a: any) => a.field_name === "sales_amount"
    );
    expect(salesAmountAnomaly).toEqual({
      field_name: "sales_amount",
      anomaly_type: "negative_amount",
      current_value: -50000,
      recommended_action: "正の金額に修正してください"
    });

    const discountRateAnomaly = result.anomalies.find(
      (a: any) => a.field_name === "discount_rate"
    );
    expect(discountRateAnomaly).toEqual({
      field_name: "discount_rate",
      anomaly_type: "out_of_range",
      current_value: 1.5,
      recommended_action: "0.0 ～ 1.0 の範囲内に修正してください"
    });

    // 検証4: 通知に含まれる全ての異常値が、準備したテストデータの異常値と一致
    expect(result.validation_status).toBe("failed");
    expect(result.record_id).toBe("SR20240115001");
    expect(result.anomalies.length).toBe(4);

    // 検証5: 検出漏れなく全ての異常が報告される
    expect(result.summary).toEqual({
      total_anomalies_detected: 4,
      validation_passed: false,
      correction_required: true
    });
  });
});