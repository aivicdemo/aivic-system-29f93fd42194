import { describe, test, expect, beforeEach } from '@jest/globals';
import { generateMonthlySummaryReport } from '../../src/logic/it-1-br-1781935279444-1-2-1';

describe('月次サマリーテンプレートの定義・管理機能', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1281
  test('営業成果データが0件の場合、空のレポートテンプレートが正常に生成される', () => {
    // 前提：営業成果データが0件の状態を準備
    const emptyBusinessData = [];
    const templateConfig = {
      templateId: 'MONTHLY_SUMMARY_001',
      templateName: '月次営業成果サマリー',
      reportMonth: '2024-01',
      generatedDate: '2024-02-01T09:00:00Z',
      generatedBy: 'system',
      headerSection: {
        title: '営業成果月次レポート',
        period: '2024年1月',
        organization: 'Sales Division',
      },
      footerSection: {
        pageNumber: 1,
        totalPages: 1,
        generatedTimestamp: '2024-02-01T09:00:00Z',
        confidentialLevel: 'internal',
      },
      dataSection: {
        salesMetrics: [],
        customerAchievements: [],
        serviceBreakdown: [],
        summaryStatistics: null,
      },
      styleConfig: {
        fontFamily: 'Arial',
        fontSize: 11,
        theme: 'standard',
      },
    };

    // 実行：営業成果レポート自動生成機能を実行
    const generatedReport = generateMonthlySummaryReport(
      emptyBusinessData,
      templateConfig
    );

    // 検証1：生成されたレポートファイルが存在することを確認
    expect(generatedReport).toBeDefined();
    expect(generatedReport).not.toBeNull();

    // 検証2：レポートテンプレート構造が保持されていることを確認
    expect(generatedReport.templateId).toBe('MONTHLY_SUMMARY_001');
    expect(generatedReport.templateName).toBe('月次営業成果サマリー');
    expect(generatedReport.reportMonth).toBe('2024-01');

    // 検証3：ヘッダーセクションが正常に生成されていることを確認
    expect(generatedReport.headerSection).toBeDefined();
    expect(generatedReport.headerSection.title).toBe('営業成果月次レポート');
    expect(generatedReport.headerSection.period).toBe('2024年1月');
    expect(generatedReport.headerSection.organization).toBe('Sales Division');

    // 検証4：フッターセクションが正常に生成されていることを確認
    expect(generatedReport.footerSection).toBeDefined();
    expect(generatedReport.footerSection.pageNumber).toBe(1);
    expect(generatedReport.footerSection.totalPages).toBe(1);
    expect(generatedReport.footerSection.confidentialLevel).toBe('internal');

    // 検証5：スタイル設定が保持されていることを確認
    expect(generatedReport.styleConfig).toBeDefined();
    expect(generatedReport.styleConfig.fontFamily).toBe('Arial');
    expect(generatedReport.styleConfig.fontSize).toBe(11);
    expect(generatedReport.styleConfig.theme).toBe('standard');

    // 検証6：データセクションが空の状態であることを確認
    expect(generatedReport.dataSection).toBeDefined();
    expect(generatedReport.dataSection.salesMetrics).toEqual([]);
    expect(generatedReport.dataSection.customerAchievements).toEqual([]);
    expect(generatedReport.dataSection.serviceBreakdown).toEqual([]);
    expect(generatedReport.dataSection.summaryStatistics).toBeNull();

    // 検証7：レポートの生成メタデータが正確に設定されていることを確認
    expect(generatedReport.generatedDate).toBe('2024-02-01T09:00:00Z');
    expect(generatedReport.generatedBy).toBe('system');

    // 検証8：レポートステータスが「正常」であることを確認
    expect(generatedReport.status).toBe('success');
    expect(generatedReport.dataRowCount).toBe(0);
  });
});