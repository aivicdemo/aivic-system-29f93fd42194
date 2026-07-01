import { structureValidationEvidenceData } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能", () => {
  // SCEN-1205: [normal] 検証結果根拠資料構造化機能 - 検証結果『誤り』の場合、営業活動記録・契約書・計算ロジックが構造化されて返される
  test("検証結果『誤り』の場合、営業活動記録・契約書・計算ロジックが構造化フォーマットで統合されて返される", () => {
    // テストデータ：検証結果が『誤り』の営業データ
    const validationResultWithError = {
      validation_id: "val_20240115_001",
      sales_data_id: "sales_20240115_0001",
      customer_id: "cust_12345",
      service_id: "svc_001",
      validation_status: "error",
      validation_timestamp: "2024-01-15T11:00:00Z",
      error_details: {
        error_type: "amount_calculation_mismatch",
        detected_value: 50000,
        expected_value: 55000,
        difference: -5000,
        error_description: "成約数から計算された請求額が契約ルールと不一致"
      }
    };

    const contractData = {
      contract_id: "cont_20240101_001",
      customer_id: "cust_12345",
      service_id: "svc_001",
      base_price: 10000,
      commission_rate: 0.15,
      calculation_method: "base_price_plus_commission_on_deals",
      discount_applicable: false,
      effective_date: "2024-01-01",
      expiration_date: "2024-12-31"
    };

    const salesActivityRecord = {
      activity_id: "act_20240115_0001",
      sales_data_id: "sales_20240115_0001",
      customer_id: "cust_12345",
      appointment_count: 5,
      deal_count: 10,
      customer_response_category: "positive",
      activity_date: "2024-01-15",
      salesperson_id: "sales_emp_001",
      notes: "成約数10件確認"
    };

    const calculationLogic = {
      logic_id: "calc_001",
      logic_name: "base_plus_commission_calculation",
      formula_pseudocode: "base_price + (deal_count * commission_per_deal)",
      base_price: 10000,
      commission_per_deal: 4500,
      parameters: {
        deal_count: 10,
        expected_total: 55000,
        calculation_step_1: "base_price (10000) + (deal_count * commission_per_deal)",
        calculation_step_2: "10000 + (10 * 4500) = 10000 + 45000 = 55000"
      }
    };

    // 検証結果根拠資料構造化機能に上記データを入力
    const result = structureValidationEvidenceData(
      validationResultWithError,
      contractData,
      salesActivityRecord,
      calculationLogic
    );

    // 返されたデータスキーマが定義された構造に準拠していることを検証
    expect(result).toHaveProperty("structured_evidence_id");
    expect(result).toHaveProperty("validation_result_status");
    expect(result).toHaveProperty("structured_data");
    expect(result).toHaveProperty("integration_timestamp");

    // validation_result_statusが『誤り』であることを確認
    expect(result.validation_result_status).toBe("error");

    // structured_dataが3要素を含むことを確認
    expect(result.structured_data).toHaveProperty("sales_activity_record");
    expect(result.structured_data).toHaveProperty("contract_information");
    expect(result.structured_data).toHaveProperty("calculation_logic");

    // 営業活動記録が構造化フォーマットで抽出されていることを確認
    expect(result.structured_data.sales_activity_record).toEqual({
      activity_id: "act_20240115_0001",
      sales_data_id: "sales_20240115_0001",
      customer_id: "cust_12345",
      appointment_count: 5,
      deal_count: 10,
      customer_response_category: "positive",
      activity_date: "2024-01-15",
      salesperson_id: "sales_emp_001",
      notes: "成約数10件確認",
      error_relevance: "deal_count値が計算式に直接反映される"
    });

    // 契約書情報が構造化フォーマットで抽出されていることを確認
    expect(result.structured_data.contract_information).toEqual({
      contract_id: "cont_20240101_001",
      customer_id: "cust_12345",
      service_id: "svc_001",
      base_price: 10000,
      commission_rate: 0.15,
      calculation_method: "base_price_plus_commission_on_deals",
      discount_applicable: false,
      effective_date: "2024-01-01",
      expiration_date: "2024-12-31",
      error_relevance: "計算メソッド『base_price_plus_commission_on_deals』と実計算値の不一致が誤り原因"
    });

    // 計算ロジックが構造化フォーマットで抽出されていることを確認
    expect(result.structured_data.calculation_logic).toEqual({
      logic_id: "calc_001",
      logic_name: "base_plus_commission_calculation",
      formula_pseudocode: "base_price + (deal_count * commission_per_deal)",
      base_price: 10000,
      commission_per_deal: 4500,
      parameters: {
        deal_count: 10,
        expected_total: 55000,
        calculation_step_1: "base_price (10000) + (deal_count * commission_per_deal)",
        calculation_step_2: "10000 + (10 * 4500) = 10000 + 45000 = 55000"
      },
      actual_calculation_result: 50000,
      calculation_discrepancy: {
        expected: 55000,
        actual: 50000,
        difference: -5000,
        discrepancy_reason: "計算ロジックではdeal_count=10で55000となるべきだが、実系統から50000が報告された"
      }
    });

    // 各要素に誤りの詳細情報が含まれていることを確認
    expect(result.structured_data.sales_activity_record).toHaveProperty("error_relevance");
    expect(result.structured_data.contract_information).toHaveProperty("error_relevance");
    expect(result.structured_data.calculation_logic).toHaveProperty("calculation_discrepancy");

    // 統合された構造化データとして返されていることを確認
    expect(result.structured_data).toBeDefined();
    expect(Object.keys(result.structured_data).length).toBe(3);

    // integration_timestampがISO形式で記録されていることを確認
    expect(result.integration_timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);

    // 誤り箇所が明確に特定されていることを確認
    expect(result).toHaveProperty("error_point_analysis");
    expect(result.error_point_analysis).toHaveProperty("root_cause");
    expect(result.error_point_analysis).toHaveProperty("affected_elements");

    // root_causeが明確に説明されていることを確認
    expect(result.error_point_analysis.root_cause).toContain("計算");

    // affected_elementsが配列で複数の要素を含むことを確認
    expect(Array.isArray(result.error_point_analysis.affected_elements)).toBe(true);
    expect(result.error_point_analysis.affected_elements.length).toBeGreaterThan(0);
  });
});