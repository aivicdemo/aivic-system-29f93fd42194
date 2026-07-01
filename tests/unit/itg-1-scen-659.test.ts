import { filterReportsByCustomer } from "../../src/logic/it-1-2-1";

describe("ポータル配信アクセス制御機能 - 他顧客のレポートデータが除外され非表示になる", () => {
  test("SCEN-659: ログインユーザーは自身が属する顧客のレポートデータのみが表示される", () => {
    // テストデータ: 複数顧客のレポートデータ
    const allReports = [
      {
        report_id: "RPT001",
        customer_id: "CUST_A",
        customer_name: "顧客A",
        month: "2024-01",
        appointment_count: 10,
        contract_count: 3,
        service_type: "営業支援",
        billing_amount: 150000,
        created_at: "2024-01-31T09:00:00Z",
      },
      {
        report_id: "RPT002",
        customer_id: "CUST_A",
        customer_name: "顧客A",
        month: "2024-01",
        appointment_count: 8,
        contract_count: 2,
        service_type: "分析支援",
        billing_amount: 100000,
        created_at: "2024-01-31T09:15:00Z",
      },
      {
        report_id: "RPT003",
        customer_id: "CUST_B",
        customer_name: "顧客B",
        month: "2024-01",
        appointment_count: 15,
        contract_count: 5,
        service_type: "営業支援",
        billing_amount: 200000,
        created_at: "2024-01-31T10:00:00Z",
      },
      {
        report_id: "RPT004",
        customer_id: "CUST_B",
        customer_name: "顧客B",
        month: "2024-01",
        appointment_count: 12,
        contract_count: 4,
        service_type: "研修支援",
        billing_amount: 180000,
        created_at: "2024-01-31T10:30:00Z",
      },
    ];

    // テストユーザーA: 顧客Aに属する
    const userA_customer_id = "CUST_A";
    const filteredReportsA = filterReportsByCustomer(
      allReports,
      userA_customer_id
    );

    // ユーザーAが表示可能なレポートは顧客Aに属するもののみ
    expect(filteredReportsA.length).toBe(2);
    expect(filteredReportsA[0].report_id).toBe("RPT001");
    expect(filteredReportsA[0].customer_id).toBe("CUST_A");
    expect(filteredReportsA[0].appointment_count).toBe(10);
    expect(filteredReportsA[0].contract_count).toBe(3);
    expect(filteredReportsA[0].service_type).toBe("営業支援");
    expect(filteredReportsA[0].billing_amount).toBe(150000);

    expect(filteredReportsA[1].report_id).toBe("RPT002");
    expect(filteredReportsA[1].customer_id).toBe("CUST_A");
    expect(filteredReportsA[1].appointment_count).toBe(8);
    expect(filteredReportsA[1].contract_count).toBe(2);
    expect(filteredReportsA[1].service_type).toBe("分析支援");
    expect(filteredReportsA[1].billing_amount).toBe(100000);

    // ユーザーAの結果に顧客Bのレポートが含まれていないことを確認
    const userA_has_customer_B = filteredReportsA.some(
      (r) => r.customer_id === "CUST_B"
    );
    expect(userA_has_customer_B).toBe(false);

    // テストユーザーB: 顧客Bに属する
    const userB_customer_id = "CUST_B";
    const filteredReportsB = filterReportsByCustomer(
      allReports,
      userB_customer_id
    );

    // ユーザーBが表示可能なレポートは顧客Bに属するもののみ
    expect(filteredReportsB.length).toBe(2);
    expect(filteredReportsB[0].report_id).toBe("RPT003");
    expect(filteredReportsB[0].customer_id).toBe("CUST_B");
    expect(filteredReportsB[0].appointment_count).toBe(15);
    expect(filteredReportsB[0].contract_count).toBe(5);
    expect(filteredReportsB[0].service_type).toBe("営業支援");
    expect(filteredReportsB[0].billing_amount).toBe(200000);

    expect(filteredReportsB[1].report_id).toBe("RPT004");
    expect(filteredReportsB[1].customer_id).toBe("CUST_B");
    expect(filteredReportsB[1].appointment_count).toBe(12);
    expect(filteredReportsB[1].contract_count).toBe(4);
    expect(filteredReportsB[1].service_type).toBe("研修支援");
    expect(filteredReportsB[1].billing_amount).toBe(180000);

    // ユーザーBの結果に顧客Aのレポートが含まれていないことを確認
    const userB_has_customer_A = filteredReportsB.some(
      (r) => r.customer_id === "CUST_A"
    );
    expect(userB_has_customer_A).toBe(false);

    // APIレスポンスが含むデータの検証: ユーザーAとユーザーBの結果が互いに排他的
    expect(filteredReportsA.every((r) => r.customer_id === "CUST_A")).toBe(
      true
    );
    expect(filteredReportsB.every((r) => r.customer_id === "CUST_B")).toBe(
      true
    );

    // 全体のレポート数は変わらず、フィルタリングのみ実施
    expect(filteredReportsA.length + filteredReportsB.length).toBe(4);
  });
});