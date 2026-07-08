import { getApprovalAuthorityForROIReport } from "../../src/logic/it-6-2-2-1";

describe("ROI実績レポート承認ルート自動判定機能", () => {
  test("SCEN-1337: レポート金額規模が承認権限の上限値と一致する場合、正確な権者判定が行われる", () => {
    // 承認権限マスタデータ: 上限金額と権者情報
    const approvalAuthorities = [
      {
        authorityId: "auth_001",
        authorityName: "部長決裁",
        limitAmount: 1000000,
        approverName: "部長",
        approverEmail: "bucho@example.com",
        approverRank: 1,
      },
      {
        authorityId: "auth_002",
        authorityName: "次長決裁",
        limitAmount: 5000000,
        approverName: "次長",
        approverEmail: "jichou@example.com",
        approverRank: 2,
      },
      {
        authorityId: "auth_003",
        authorityName: "本部長決裁",
        limitAmount: 10000000,
        approverName: "本部長",
        approverEmail: "honbucho@example.com",
        approverRank: 3,
      },
    ];

    // テストケース1: レポート金額が部長決裁の上限値と完全一致
    const reportData1 = {
      reportId: "roi_001",
      reportAmount: 1000000,
      reportDate: "2024-01-15",
      reportTitle: "初期30名運用ROI実績レポート",
    };

    const result1 = getApprovalAuthorityForROIReport(
      reportData1.reportAmount,
      approvalAuthorities
    );

    expect(result1.authorityId).toBe("auth_001");
    expect(result1.authorityName).toBe("部長決裁");
    expect(result1.approverName).toBe("部長");
    expect(result1.approverEmail).toBe("bucho@example.com");
    expect(result1.limitAmount).toBe(1000000);
    expect(result1.approverRank).toBe(1);

    // テストケース2: レポート金額が次長決裁の上限値と完全一致
    const reportData2 = {
      reportId: "roi_002",
      reportAmount: 5000000,
      reportDate: "2024-01-15",
      reportTitle: "700名規模展開ROI実績レポート",
    };

    const result2 = getApprovalAuthorityForROIReport(
      reportData2.reportAmount,
      approvalAuthorities
    );

    expect(result2.authorityId).toBe("auth_002");
    expect(result2.authorityName).toBe("次長決裁");
    expect(result2.approverName).toBe("次長");
    expect(result2.approverEmail).toBe("jichou@example.com");
    expect(result2.limitAmount).toBe(5000000);
    expect(result2.approverRank).toBe(2);

    // テストケース3: レポート金額が本部長決裁の上限値と完全一致
    const reportData3 = {
      reportId: "roi_003",
      reportAmount: 10000000,
      reportDate: "2024-01-15",
      reportTitle: "グループ企業横展開ROI実績レポート",
    };

    const result3 = getApprovalAuthorityForROIReport(
      reportData3.reportAmount,
      approvalAuthorities
    );

    expect(result3.authorityId).toBe("auth_003");
    expect(result3.authorityName).toBe("本部長決裁");
    expect(result3.approverName).toBe("本部長");
    expect(result3.approverEmail).toBe("honbucho@example.com");
    expect(result3.limitAmount).toBe(10000000);
    expect(result3.approverRank).toBe(3);

    // テストケース4: レポート金額が複数の権限上限値の間に位置する場合
    // (適切な権限者が選択されることを確認)
    const reportData4 = {
      reportId: "roi_004",
      reportAmount: 3000000,
      reportDate: "2024-01-15",
      reportTitle: "中間規模ROI実績レポート",
    };

    const result4 = getApprovalAuthorityForROIReport(
      reportData4.reportAmount,
      approvalAuthorities
    );

    // 3,000,000円は1,000,000円を超え、5,000,000円以下なので次長決裁が該当
    expect(result4.authorityId).toBe("auth_002");
    expect(result4.approverRank).toBe(2);

    // テストケース5: 最小の上限値未満の場合、エラーが発生することを確認
    const reportData5 = {
      reportId: "roi_005",
      reportAmount: 500000,
      reportDate: "2024-01-15",
      reportTitle: "小規模ROI実績レポート",
    };

    expect(() => {
      getApprovalAuthorityForROIReport(
        reportData5.reportAmount,
        approvalAuthorities
      );
    }).toThrow(/承認権限/);

    // テストケース6: すべての権限上限値を超える場合、エラーが発生することを確認
    const reportData6 = {
      reportId: "roi_006",
      reportAmount: 15000000,
      reportDate: "2024-01-15",
      reportTitle: "超大規模ROI実績レポート",
    };

    expect(() => {
      getApprovalAuthorityForROIReport(
        reportData6.reportAmount,
        approvalAuthorities
      );
    }).toThrow(/承認権限/);
  });
});