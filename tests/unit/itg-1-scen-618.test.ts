import { extractBillingItemsAndAggregate } from "../../src/logic/it-1-2-1";

describe("営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計", () => {
  // SCEN-618
  test("[normal] 請求対象項目自動抽出・請求額集計 - 複数の顧客・複数のサービスの営業データが混在する場合、顧客ごと・サービスごとに正確に分離集計される", () => {
    // テストデータ準備: 3社の顧客と3種類のサービスの営業データ
    const salesData = [
      // 顧客A × サービスX
      {
        customerId: "CUST_A",
        customerName: "顧客A",
        serviceId: "SVC_X",
        serviceName: "サービスX",
        appointmentCount: 10,
        dealCount: 5,
        unitPrice: 1000,
      },
      {
        customerId: "CUST_A",
        customerName: "顧客A",
        serviceId: "SVC_X",
        serviceName: "サービスX",
        appointmentCount: 8,
        dealCount: 3,
        unitPrice: 1000,
      },
      // 顧客A × サービスY
      {
        customerId: "CUST_A",
        customerName: "顧客A",
        serviceId: "SVC_Y",
        serviceName: "サービスY",
        appointmentCount: 12,
        dealCount: 6,
        unitPrice: 1500,
      },
      // 顧客B × サービスY
      {
        customerId: "CUST_B",
        customerName: "顧客B",
        serviceId: "SVC_Y",
        serviceName: "サービスY",
        appointmentCount: 15,
        dealCount: 7,
        unitPrice: 1500,
      },
      // 顧客B × サービスZ
      {
        customerId: "CUST_B",
        customerName: "顧客B",
        serviceId: "SVC_Z",
        serviceName: "サービスZ",
        appointmentCount: 20,
        dealCount: 10,
        unitPrice: 2000,
      },
      // 顧客C × サービスX
      {
        customerId: "CUST_C",
        customerName: "顧客C",
        serviceId: "SVC_X",
        serviceName: "サービスX",
        appointmentCount: 7,
        dealCount: 2,
        unitPrice: 1000,
      },
      // 顧客C × サービスY
      {
        customerId: "CUST_C",
        customerName: "顧客C",
        serviceId: "SVC_Y",
        serviceName: "サービスY",
        appointmentCount: 14,
        dealCount: 8,
        unitPrice: 1500,
      },
      {
        customerId: "CUST_C",
        customerName: "顧客C",
        serviceId: "SVC_Y",
        serviceName: "サービスY",
        appointmentCount: 6,
        dealCount: 3,
        unitPrice: 1500,
      },
      // 顧客C × サービスZ
      {
        customerId: "CUST_C",
        customerName: "顧客C",
        serviceId: "SVC_Z",
        serviceName: "サービスZ",
        appointmentCount: 25,
        dealCount: 12,
        unitPrice: 2000,
      },
    ];

    // 契約定義: 各顧客がどのサービスを契約しているか
    const contractDefinitions = [
      { customerId: "CUST_A", serviceId: "SVC_X", contractedAmount: 18000 },
      { customerId: "CUST_A", serviceId: "SVC_Y", contractedAmount: 9000 },
      { customerId: "CUST_B", serviceId: "SVC_Y", contractedAmount: 10500 },
      { customerId: "CUST_B", serviceId: "SVC_Z", contractedAmount: 20000 },
      { customerId: "CUST_C", serviceId: "SVC_X", contractedAmount: 2000 },
      { customerId: "CUST_C", serviceId: "SVC_Y", contractedAmount: 31500 },
      { customerId: "CUST_C", serviceId: "SVC_Z", contractedAmount: 24000 },
    ];

    const result = extractBillingItemsAndAggregate(salesData, contractDefinitions);

    // 期待結果の検証: 顧客ごと・サービスごとに正確に分離集計される
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);

    // 結果が7つの顧客×サービス組み合わせを含む
    expect(result.length).toBe(7);

    // 顧客A × サービスX の検証
    const custA_svcX = result.find(
      (r) => r.customerId === "CUST_A" && r.serviceId === "SVC_X"
    );
    expect(custA_svcX).toBeDefined();
    expect(custA_svcX?.customerName).toBe("顧客A");
    expect(custA_svcX?.serviceName).toBe("サービスX");
    expect(custA_svcX?.totalAppointmentCount).toBe(18); // 10 + 8
    expect(custA_svcX?.totalDealCount).toBe(8); // 5 + 3
    expect(custA_svcX?.aggregatedBillingAmount).toBe(18000); // (18 + 8) * 1000

    // 顧客A × サービスY の検証
    const custA_svcY = result.find(
      (r) => r.customerId === "CUST_A" && r.serviceId === "SVC_Y"
    );
    expect(custA_svcY).toBeDefined();
    expect(custA_svcY?.customerName).toBe("顧客A");
    expect(custA_svcY?.serviceName).toBe("サービスY");
    expect(custA_svcY?.totalAppointmentCount).toBe(12);
    expect(custA_svcY?.totalDealCount).toBe(6);
    expect(custA_svcY?.aggregatedBillingAmount).toBe(9000); // (12 + 6) * 1500

    // 顧客B × サービスY の検証
    const custB_svcY = result.find(
      (r) => r.customerId === "CUST_B" && r.serviceId === "SVC_Y"
    );
    expect(custB_svcY).toBeDefined();
    expect(custB_svcY?.customerName).toBe("顧客B");
    expect(custB_svcY?.serviceName).toBe("サービスY");
    expect(custB_svcY?.totalAppointmentCount).toBe(15);
    expect(custB_svcY?.totalDealCount).toBe(7);
    expect(custB_svcY?.aggregatedBillingAmount).toBe(10500); // (15 + 7) * 1500

    // 顧客B × サービスZ の検証
    const custB_svcZ = result.find(
      (r) => r.customerId === "CUST_B" && r.serviceId === "SVC_Z"
    );
    expect(custB_svcZ).toBeDefined();
    expect(custB_svcZ?.customerName).toBe("顧客B");
    expect(custB_svcZ?.serviceName).toBe("サービスZ");
    expect(custB_svcZ?.totalAppointmentCount).toBe(20);
    expect(custB_svcZ?.totalDealCount).toBe(10);
    expect(custB_svcZ?.aggregatedBillingAmount).toBe(20000); // (20 + 10) * 2000

    // 顧客C × サービスX の検証
    const custC_svcX = result.find(
      (r) => r.customerId === "CUST_C" && r.serviceId === "SVC_X"
    );
    expect(custC_svcX).toBeDefined();
    expect(custC_svcX?.customerName).toBe("顧客C");
    expect(custC_svcX?.serviceName).toBe("サービスX");
    expect(custC_svcX?.totalAppointmentCount).toBe(7);
    expect(custC_svcX?.totalDealCount).toBe(2);
    expect(custC_svcX?.aggregatedBillingAmount).toBe(2000); // (7 + 2) * 1000

    // 顧客C × サービスY の検証
    const custC_svcY = result.find(
      (r) => r.customerId === "CUST_C" && r.serviceId === "SVC_Y"
    );
    expect(custC_svcY).toBeDefined();
    expect(custC_svcY?.customerName).toBe("顧客C");
    expect(custC_svcY?.serviceName).toBe("サービスY");
    expect(custC_svcY?.totalAppointmentCount).toBe(20); // 14 + 6
    expect(custC_svcY?.totalDealCount).toBe(11); // 8 + 3
    expect(custC_svcY?.aggregatedBillingAmount).toBe(31500); // (20 + 11) * 1500

    // 顧客C × サービスZ の検証
    const custC_svcZ = result.find(
      (r) => r.customerId === "CUST_C" && r.serviceId === "SVC_Z"
    );
    expect(custC_svcZ).toBeDefined();
    expect(custC_svcZ?.customerName).toBe("顧客C");
    expect(custC_svcZ?.serviceName).toBe("サービスZ");
    expect(custC_svcZ?.totalAppointmentCount).toBe(25);
    expect(custC_svcZ?.totalDealCount).toBe(12);
    expect(custC_svcZ?.aggregatedBillingAmount).toBe(24000); // (25 + 12) * 2000

    // 他の顧客・サービスの組み合わせへのデータ混入がないことを検証
    expect(
      result.some((r) => r.customerId === "CUST_A" && r.serviceId === "SVC_Z")
    ).toBe(false);
    expect(
      result.some((r) => r.customerId === "CUST_B" && r.serviceId === "SVC_X")
    ).toBe(false);
    expect(
      result.some((r) => r.customerId === "CUST_C" && r.serviceId === "INVALID")
    ).toBe(false);

    // すべての顧客とサービスの組み合わせについて期待する請求額が算出されている
    const totalBillingAmount = result.reduce(
      (sum, item) => sum + item.aggregatedBillingAmount,
      0
    );
    expect(totalBillingAmount).toBe(115000); // 18000+9000+10500+20000+2000+31500+24000
  });
});