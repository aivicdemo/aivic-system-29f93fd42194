import { determineReportDistributionRules } from "../../src/logic/it-1-br-1781935279444-1-2-1";

describe("月次サマリーテンプレートの定義・管理機能", () => {
  test("SCEN-1064: レポート配信ルール判定機能 - 顧客契約の複数配信形式が正確に判定・反映される", () => {
    // テストデータ: 複数の顧客契約レコード（配信形式: メールのみ、ポータルのみ、メール・ポータル両方）
    const contracts = [
      {
        contract_id: "CT-001",
        customer_id: "CUST-001",
        distribution_format: "email",
        is_active: true,
        customer_email: "contact@customer1.com",
      },
      {
        contract_id: "CT-002",
        customer_id: "CUST-002",
        distribution_format: "portal",
        is_active: true,
        customer_email: "contact@customer2.com",
      },
      {
        contract_id: "CT-003",
        customer_id: "CUST-003",
        distribution_format: "both",
        is_active: true,
        customer_email: "contact@customer3.com",
      },
    ];

    // メールのみの契約に対してルール判定を実行
    const emailOnlyResult = determineReportDistributionRules(contracts[0]);
    // 判定結果がメール配信フラグのみ真であることを検証
    expect(emailOnlyResult.send_by_email).toBe(true);
    expect(emailOnlyResult.send_by_portal).toBe(false);
    expect(emailOnlyResult.contract_id).toBe("CT-001");
    expect(emailOnlyResult.customer_id).toBe("CUST-001");

    // ポータルのみの契約に対してルール判定を実行
    const portalOnlyResult = determineReportDistributionRules(contracts[1]);
    // 判定結果がポータル配信フラグのみ真であることを検証
    expect(portalOnlyResult.send_by_email).toBe(false);
    expect(portalOnlyResult.send_by_portal).toBe(true);
    expect(portalOnlyResult.contract_id).toBe("CT-002");
    expect(portalOnlyResult.customer_id).toBe("CUST-002");

    // メール・ポータル両方の契約に対してルール判定を実行
    const bothResult = determineReportDistributionRules(contracts[2]);
    // 判定結果がメール配信フラグとポータル配信フラグの両方が真であることを検証
    expect(bothResult.send_by_email).toBe(true);
    expect(bothResult.send_by_portal).toBe(true);
    expect(bothResult.contract_id).toBe("CT-003");
    expect(bothResult.customer_id).toBe("CUST-003");

    // 各配信形式の判定ロジックが独立して動作していることを確認
    const allResults = [emailOnlyResult, portalOnlyResult, bothResult];
    expect(allResults.length).toBe(3);
    expect(allResults[0].send_by_email).not.toBe(allResults[0].send_by_portal);
    expect(allResults[1].send_by_email).not.toBe(allResults[1].send_by_portal);
    expect(allResults[2].send_by_email).toBe(allResults[2].send_by_portal);

    // レポート配信ルール判定の結果が実際の配信対象リストに正確に反映されていることを検証
    const distributionTargets = allResults.filter(
      (r) => r.send_by_email || r.send_by_portal
    );
    expect(distributionTargets.length).toBe(3);
    expect(distributionTargets[0].send_by_email).toBe(true);
    expect(distributionTargets[0].send_by_portal).toBe(false);
    expect(distributionTargets[1].send_by_email).toBe(false);
    expect(distributionTargets[1].send_by_portal).toBe(true);
    expect(distributionTargets[2].send_by_email).toBe(true);
    expect(distributionTargets[2].send_by_portal).toBe(true);

    // 無効な契約は配信対象から除外されることを検証
    const inactiveContract = {
      contract_id: "CT-004",
      customer_id: "CUST-004",
      distribution_format: "email",
      is_active: false,
      customer_email: "contact@customer4.com",
    };
    const inactiveResult = determineReportDistributionRules(inactiveContract);
    expect(inactiveResult.send_by_email).toBe(false);
    expect(inactiveResult.send_by_portal).toBe(false);
  });
});