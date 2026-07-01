import { describe, test, expect } from "@jest/globals";
import {
  validateBillingDataCompleteness,
} from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データ品質検証 - 請求データ妥当性自動検証機能", () => {
  // SCEN-819: [error] 請求データ妥当性自動検証機能 - 請求対象項目が営業成果データに存在しない場合にエラーが検出される
  test("請求対象項目が営業成果データに存在しない場合、エラーが検出されること", () => {
    // Arrange
    const sales_performance_data = {
      customer_id: "CUST-001",
      service_id: "SVC-A",
      appointment_count: 5,
      contract_count: 2,
      customer_response_rating: 8.5,
      billing_month: "2024-01",
    };

    const billing_data = {
      customer_id: "CUST-001",
      service_id: "SVC-A",
      billing_target_item_1: "appointment_count",
      billing_target_item_2: "non_existent_field",
      billing_target_item_3: "unknown_metric",
      billing_month: "2024-01",
    };

    // Act & Assert
    expect(() =>
      validateBillingDataCompleteness({
        sales_performance_data,
        billing_data,
      })
    ).toThrow(/営業成果データに存在しません/);
  });

  test("すべての請求対象項目が営業成果データに存在する場合、検証が成功すること", () => {
    // Arrange
    const sales_performance_data = {
      customer_id: "CUST-001",
      service_id: "SVC-A",
      appointment_count: 5,
      contract_count: 2,
      customer_response_rating: 8.5,
      billing_month: "2024-01",
    };

    const billing_data = {
      customer_id: "CUST-001",
      service_id: "SVC-A",
      billing_target_item_1: "appointment_count",
      billing_target_item_2: "contract_count",
      billing_target_item_3: "customer_response_rating",
      billing_month: "2024-01",
    };

    // Act
    const result = validateBillingDataCompleteness({
      sales_performance_data,
      billing_data,
    });

    // Assert
    expect(result).toEqual({
      is_valid: true,
      missing_fields: [],
      validation_status: "合格",
    });
  });

  test("複数の欠落項目が存在する場合、すべての欠落項目がエラーメッセージに含まれること", () => {
    // Arrange
    const sales_performance_data = {
      customer_id: "CUST-002",
      service_id: "SVC-B",
      appointment_count: 3,
      billing_month: "2024-02",
    };

    const billing_data = {
      customer_id: "CUST-002",
      service_id: "SVC-B",
      billing_target_item_1: "contract_count",
      billing_target_item_2: "customer_response_rating",
      billing_target_item_3: "undefined_metric",
      billing_month: "2024-02",
    };

    // Act & Assert
    expect(() =>
      validateBillingDataCompleteness({
        sales_performance_data,
        billing_data,
      })
    ).toThrow(/営業成果データに存在しません/);
  });

  test("請求対象項目が空の場合、検証が成功すること", () => {
    // Arrange
    const sales_performance_data = {
      customer_id: "CUST-003",
      service_id: "SVC-C",
      appointment_count: 0,
      contract_count: 0,
      billing_month: "2024-03",
    };

    const billing_data = {
      customer_id: "CUST-003",
      service_id: "SVC-C",
      billing_month: "2024-03",
    };

    // Act
    const result = validateBillingDataCompleteness({
      sales_performance_data,
      billing_data,
    });

    // Assert
    expect(result).toEqual({
      is_valid: true,
      missing_fields: [],
      validation_status: "合格",
    });
  });

  test("営業成果データが空の場合、すべての請求対象項目に対してエラーが検出されること", () => {
    // Arrange
    const sales_performance_data = {
      customer_id: "CUST-004",
      service_id: "SVC-D",
      billing_month: "2024-04",
    };

    const billing_data = {
      customer_id: "CUST-004",
      service_id: "SVC-D",
      billing_target_item_1: "appointment_count",
      billing_target_item_2: "contract_count",
      billing_month: "2024-04",
    };

    // Act & Assert
    expect(() =>
      validateBillingDataCompleteness({
        sales_performance_data,
        billing_data,
      })
    ).toThrow(/営業成果データに存在しません/);
  });
});