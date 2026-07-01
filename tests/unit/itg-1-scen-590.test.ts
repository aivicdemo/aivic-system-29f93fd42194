import { describe, test, expect } from "@jest/globals";
import {
  classifyBillingItems,
} from "../../src/logic/it-1-2-1";

describe("請求対象項目の抽出と分類", () => {
  test("SCEN-590: 顧客IDまたはサービスIDが不正な営業データが混在する場合、エラーが検出されて分類処理が失敗する", () => {
    // 不正な顧客IDを含むテストデータ
    const invalidCustomerIdData = [
      {
        customer_id: "",
        service_id: "SVC001",
        appointment_count: 5,
        contract_count: 2,
        service_type: "standard",
      },
    ];

    // 不正なサービスIDを含むテストデータ
    const invalidServiceIdData = [
      {
        customer_id: "CUST001",
        service_id: "INVALID@#$",
        appointment_count: 5,
        contract_count: 2,
        service_type: "standard",
      },
    ];

    // nullを含むテストデータ
    const nullCustomerIdData = [
      {
        customer_id: null,
        service_id: "SVC001",
        appointment_count: 5,
        contract_count: 2,
        service_type: "standard",
      },
    ];

    // 数値以外の顧客IDを含むテストデータ
    const numericCustomerIdData = [
      {
        customer_id: 12345,
        service_id: "SVC001",
        appointment_count: 5,
        contract_count: 2,
        service_type: "standard",
      },
    ];

    // 範囲外のサービスIDを含むテストデータ
    const outOfRangeServiceIdData = [
      {
        customer_id: "CUST001",
        service_id: "SVC99999",
        appointment_count: 5,
        contract_count: 2,
        service_type: "standard",
      },
    ];

    // 空文字列のサービスIDを含むテストデータ
    const emptyServiceIdData = [
      {
        customer_id: "CUST001",
        service_id: "",
        appointment_count: 5,
        contract_count: 2,
        service_type: "standard",
      },
    ];

    // 不正な顧客ID（空文字列）でエラーが発生することを検証
    expect(() =>
      classifyBillingItems(invalidCustomerIdData as any)
    ).toThrow(/顧客ID/);

    // 不正なサービスID（特殊文字）でエラーが発生することを検証
    expect(() =>
      classifyBillingItems(invalidServiceIdData as any)
    ).toThrow(/サービスID/);

    // null の顧客IDでエラーが発生することを検証
    expect(() => classifyBillingItems(nullCustomerIdData as any)).toThrow(
      /顧客ID/
    );

    // 数値型の顧客IDでエラーが発生することを検証
    expect(() =>
      classifyBillingItems(numericCustomerIdData as any)
    ).toThrow(/顧客ID/);

    // 範囲外のサービスIDでエラーが発生することを検証
    expect(() =>
      classifyBillingItems(outOfRangeServiceIdData as any)
    ).toThrow(/サービスID/);

    // 空文字列のサービスIDでエラーが発生することを検証
    expect(() =>
      classifyBillingItems(emptyServiceIdData as any)
    ).toThrow(/サービスID/);

    // 正常なデータで正常に処理されることを検証
    const validData = [
      {
        customer_id: "CUST001",
        service_id: "SVC001",
        appointment_count: 5,
        contract_count: 2,
        service_type: "standard",
      },
      {
        customer_id: "CUST002",
        service_id: "SVC002",
        appointment_count: 3,
        contract_count: 1,
        service_type: "premium",
      },
    ];

    const result = classifyBillingItems(validData as any);
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(2);
    expect(result[0]).toHaveProperty("customer_id", "CUST001");
    expect(result[0]).toHaveProperty("service_id", "SVC001");
    expect(result[0]).toHaveProperty("appointment_count", 5);
    expect(result[0]).toHaveProperty("contract_count", 2);
    expect(result[1]).toHaveProperty("customer_id", "CUST002");
    expect(result[1]).toHaveProperty("service_id", "SVC002");
  });
});