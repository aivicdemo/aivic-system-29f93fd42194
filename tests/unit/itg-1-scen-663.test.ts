import { describe, test, expect } from "@jest/globals";
import {
  generateReportWithMetadata,
} from "../../src/logic/it-1781935279444-1-1-1";

describe("営業データ項目メタデータ管理機能", () => {
  test("SCEN-663: レポート生成時にメタデータに基づいて自動マッピングと計算が実行される", () => {
    // テストデータ: 営業データ項目メタデータ定義
    const salesMetadata = [
      {
        itemId: "apoCount",
        itemName: "アポイント数",
        unit: "件",
        dataType: "number",
        calculationLogic: "SUM",
        reportMapping: "appointments",
        minValue: 0,
        maxValue: 1000,
      },
      {
        itemId: "contractCount",
        itemName: "成約数",
        unit: "件",
        dataType: "number",
        calculationLogic: "SUM",
        reportMapping: "contracts",
        minValue: 0,
        maxValue: 500,
      },
      {
        itemId: "customerReaction",
        itemName: "顧客反応",
        unit: "評価",
        dataType: "string",
        calculationLogic: "MODE",
        reportMapping: "customer_feedback",
        allowedValues: ["高", "中", "低"],
      },
      {
        itemId: "contactDate",
        itemName: "接触日時",
        unit: "日付",
        dataType: "date",
        calculationLogic: "MAX",
        reportMapping: "last_contact_date",
      },
      {
        itemId: "conversionRate",
        itemName: "成約率",
        unit: "%",
        dataType: "number",
        calculationLogic: "DIVIDE",
        formulaTemplate: "contractCount / apoCount * 100",
        reportMapping: "conversion_percentage",
        minValue: 0,
        maxValue: 100,
      },
    ];

    // テストデータ: 営業データ（複数顧客・サービス別）
    const salesData = [
      {
        customerId: "cust_001",
        serviceId: "svc_A",
        apoCount: 50,
        contractCount: 10,
        customerReaction: "高",
        contactDate: "2024-01-15",
      },
      {
        customerId: "cust_001",
        serviceId: "svc_B",
        apoCount: 30,
        contractCount: 6,
        customerReaction: "中",
        contactDate: "2024-01-10",
      },
      {
        customerId: "cust_002",
        serviceId: "svc_A",
        apoCount: 40,
        contractCount: 8,
        customerReaction: "高",
        contactDate: "2024-01-20",
      },
    ];

    // マッピングルールと計算式の事前設定
    const mappingConfig = {
      apoCountMapping: "appointments",
      contractCountMapping: "contracts",
      reactionMapping: "customer_feedback",
      dateMapping: "last_contact_date",
      conversionFormulaTemplate: "contractCount / apoCount * 100",
    };

    // レポート生成機能を実行
    const generatedReport = generateReportWithMetadata(
      salesData,
      salesMetadata,
      mappingConfig
    );

    // 生成されたレポートが存在することを確認
    expect(generatedReport).toBeDefined();
    expect(generatedReport).not.toBeNull();

    // レポートの構造が正しく生成されていることを確認
    expect(generatedReport.metadata).toBeDefined();
    expect(generatedReport.reportItems).toBeDefined();
    expect(Array.isArray(generatedReport.reportItems)).toBe(true);

    // メタデータに基づいたマッピングが正確に実行されていることを確認
    // 顧客1・サービスA の検証
    const cust1SvcAReport = generatedReport.reportItems.find(
      (item: { customerId: string; serviceId: string }) =>
        item.customerId === "cust_001" && item.serviceId === "svc_A"
    );

    expect(cust1SvcAReport).toBeDefined();
    expect(cust1SvcAReport.appointments).toBe(50); // apoCount がマッピングされたことを確認
    expect(cust1SvcAReport.contracts).toBe(10); // contractCount がマッピングされたことを確認
    expect(cust1SvcAReport.customer_feedback).toBe("高"); // customerReaction がマッピングされたことを確認
    expect(cust1SvcAReport.last_contact_date).toBe("2024-01-15"); // contactDate がマッピングされたことを確認

    // メタデータで定義された計算式が正確に実行されていることを確認
    // 成約率の計算: 10 / 50 * 100 = 20
    expect(cust1SvcAReport.conversion_percentage).toBe(20);

    // 顧客1・サービスB の検証
    const cust1SvcBReport = generatedReport.reportItems.find(
      (item: { customerId: string; serviceId: string }) =>
        item.customerId === "cust_001" && item.serviceId === "svc_B"
    );

    expect(cust1SvcBReport).toBeDefined();
    expect(cust1SvcBReport.appointments).toBe(30);
    expect(cust1SvcBReport.contracts).toBe(6);
    expect(cust1SvcBReport.customer_feedback).toBe("中");
    expect(cust1SvcBReport.last_contact_date).toBe("2024-01-10");
    // 成約率の計算: 6 / 30 * 100 = 20
    expect(cust1SvcBReport.conversion_percentage).toBe(20);

    // 顧客2・サービスA の検証
    const cust2SvcAReport = generatedReport.reportItems.find(
      (item: { customerId: string; serviceId: string }) =>
        item.customerId === "cust_002" && item.serviceId === "svc_A"
    );

    expect(cust2SvcAReport).toBeDefined();
    expect(cust2SvcAReport.appointments).toBe(40);
    expect(cust2SvcAReport.contracts).toBe(8);
    expect(cust2SvcAReport.customer_feedback).toBe("高");
    expect(cust2SvcAReport.last_contact_date).toBe("2024-01-20");
    // 成約率の計算: 8 / 40 * 100 = 20
    expect(cust2SvcAReport.conversion_percentage).toBe(20);

    // 複数のデータ型を含むメタデータが正しく処理されていることを確認
    // 数値型（apoCount, contractCount, conversionRate）が正しく処理されている
    expect(typeof cust1SvcAReport.appointments).toBe("number");
    expect(typeof cust1SvcAReport.contracts).toBe("number");
    expect(typeof cust1SvcAReport.conversion_percentage).toBe("number");

    // 文字列型（customerReaction）が正しく処理されている
    expect(typeof cust1SvcAReport.customer_feedback).toBe("string");
    expect(["高", "中", "低"]).toContain(cust1SvcAReport.customer_feedback);

    // 日付型（contactDate）が正しく処理されている
    expect(typeof cust1SvcAReport.last_contact_date).toBe("string");
    expect(/^\d{4}-\d{2}-\d{2}$/).toTest(cust1SvcAReport.last_contact_date);

    // レポート生成時にエラーが発生せず、正常に完了していることを確認
    expect(generatedReport.status).toBe("success");
    expect(generatedReport.errorCount).toBe(0);
    expect(generatedReport.generatedAt).toBeDefined();

    // レポート内のすべてのデータ項目数が一致していることを確認
    expect(generatedReport.reportItems.length).toBe(3);

    // メタデータ情報がレポートに含まれていることを確認
    expect(generatedReport.metadata.length).toBe(5);
    expect(generatedReport.metadata[0].reportMapping).toBe("appointments");
    expect(generatedReport.metadata[1].reportMapping).toBe("contracts");
    expect(generatedReport.metadata[4].reportMapping).toBe(
      "conversion_percentage"
    );
  });
});