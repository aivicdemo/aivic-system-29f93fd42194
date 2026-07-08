import { generateStakeholderCustomizedReport } from "../../src/logic/it-1-br-2-2-2-1";

describe("ステークホルダー別カスタマイズレポート生成", () => {
  // SCEN-1241
  test("査定部署長向けレポートが経営指標を重視したフォーマットで生成される", () => {
    const input = {
      stakeholderType: "査定部署長",
      startDate: "2024-01-01",
      endDate: "2024-01-31",
      userId: "user_dept_head_001",
    };

    const result = generateStakeholderCustomizedReport(input);

    // レポート基本構造の検証
    expect(result).toBeDefined();
    expect(result.stakeholderType).toBe("査定部署長");
    expect(result.reportFormat).toBe("executive_metrics_priority");
    expect(result.generatedAt).toBeDefined();

    // 経営指標セクションが存在し、最優先配置であることを検証
    expect(result.sections).toBeDefined();
    expect(result.sections.length).toBeGreaterThan(0);

    const metricsSection = result.sections[0];
    expect(metricsSection.sectionType).toBe("経営指標");
    expect(metricsSection.order).toBe(1);
    expect(metricsSection.visibilityPriority).toBe("highest");

    // 経営指標の具体的内容を検証
    expect(metricsSection.metrics).toBeDefined();
    expect(metricsSection.metrics).toContainEqual({
      name: "売上目標達成率",
      value: 92.5,
      unit: "%",
    });
    expect(metricsSection.metrics).toContainEqual({
      name: "原価率",
      value: 45.3,
      unit: "%",
    });
    expect(metricsSection.metrics).toContainEqual({
      name: "利益率",
      value: 54.7,
      unit: "%",
    });
    expect(metricsSection.metrics).toContainEqual({
      name: "KPI進捗",
      value: 88.0,
      unit: "%",
    });

    // メトリクスセクションの視覚的強調設定を検証
    expect(metricsSection.visualDesign).toBeDefined();
    expect(metricsSection.visualDesign.highlightColor).toBe("#FF6B6B");
    expect(metricsSection.visualDesign.fontSize).toBe("large");
    expect(metricsSection.visualDesign.placement).toBe("top_prominence");

    // 詳細査定データセクションが後方に配置されていることを検証
    const detailSection = result.sections.find(
      (s) => s.sectionType === "詳細査定データ"
    );
    expect(detailSection).toBeDefined();
    expect(detailSection.order).toBeGreaterThan(metricsSection.order);
    expect(detailSection.visibilityPriority).toBe("medium");

    // グラフ・チャート構成の検証
    expect(result.sections).toContainEqual(
      expect.objectContaining({
        sectionType: "経営指標",
        charts: expect.arrayContaining([
          expect.objectContaining({
            chartType: "gauge_chart",
            title: "売上目標達成率",
            emphasis: true,
          }),
          expect.objectContaining({
            chartType: "pie_chart",
            title: "原価率・利益率構成",
            emphasis: true,
          }),
          expect.objectContaining({
            chartType: "progress_bar",
            title: "KPI進捗",
            emphasis: true,
          }),
        ]),
      })
    );

    // レポートの全体的構成比を検証
    const totalSections = result.sections.length;
    const metricsSectionCount = result.sections.filter(
      (s) => s.sectionType === "経営指標"
    ).length;
    expect(metricsSectionCount).toBe(1);

    // レポートの構成順序が経営意思決定優先度に従っていることを検証
    const sectionOrders = result.sections.map((s) => s.order);
    const sortedOrders = [...sectionOrders].sort((a, b) => a - b);
    expect(sectionOrders).toEqual(sortedOrders);

    // スタイルテンプレートが経営指標重視で設定されていることを検証
    expect(result.styleTemplate).toBe("executive_dashboard");
    expect(result.contentPrioritization).toEqual({
      tier1_metrics: {
        position: "header",
        spaceAllocation: 0.4,
        visualEmphasis: "maximum",
      },
      tier2_kpi: {
        position: "subheader",
        spaceAllocation: 0.3,
        visualEmphasis: "high",
      },
      tier3_detail: {
        position: "body",
        spaceAllocation: 0.3,
        visualEmphasis: "standard",
      },
    });

    // レポートが正常に生成され、ダウンロード対象として有効であることを検証
    expect(result.downloadUrl).toBeDefined();
    expect(result.fileFormat).toBe("pdf");
    expect(result.pageCount).toBeGreaterThan(0);

    // タイムスタンプ検証
    expect(new Date(result.generatedAt).getTime()).toBeLessThanOrEqual(
      new Date().getTime()
    );
    expect(new Date(result.generatedAt).getTime()).toBeGreaterThan(
      new Date("2024-01-01").getTime()
    );
  });
});