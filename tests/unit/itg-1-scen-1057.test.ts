import { generateSalesReportAggregationManual } from '../../src/logic/it-1-2-1';

describe('営業報告書集計標準手順書生成機能 - 複数集計単位の同時定義と文書反映', () => {
  test('SCEN-1057: 顧客別・サービス別・期間別の複数集計単位が同時に定義され、全集計パターンが文書に反映される', () => {
    // Input: 複数の集計単位と対象データを定義
    const aggregationConfig = {
      customerAggregationEnabled: true,
      selectedCustomers: ['CUST001', 'CUST002', 'CUST003'],
      serviceAggregationEnabled: true,
      selectedServices: ['SVC_A', 'SVC_B'],
      periodAggregationEnabled: true,
      periodPatterns: ['MONTHLY', 'QUARTERLY', 'YEARLY'],
    };

    // 標準手順書生成を実行
    const generatedManual = generateSalesReportAggregationManual(aggregationConfig);

    // Assertion 1: 生成文書の基本構造を検証
    expect(generatedManual).toBeDefined();
    expect(generatedManual.title).toBe('営業報告書集計標準手順書');
    expect(generatedManual.sections).toBeDefined();
    expect(Array.isArray(generatedManual.sections)).toBe(true);

    // Assertion 2: 目次内に3つの主要セクションが存在
    const tableOfContents = generatedManual.tableOfContents;
    expect(tableOfContents.length).toBeGreaterThanOrEqual(3);
    expect(tableOfContents.some((item) => item.title.includes('顧客別集計'))).toBe(true);
    expect(tableOfContents.some((item) => item.title.includes('サービス別集計'))).toBe(true);
    expect(tableOfContents.some((item) => item.title.includes('期間別集計'))).toBe(true);

    // Assertion 3: 顧客別集計セクションの検証
    const customerSection = generatedManual.sections.find(
      (s) => s.sectionType === 'CUSTOMER_AGGREGATION'
    );
    expect(customerSection).toBeDefined();
    expect(customerSection.targetItems).toEqual(['CUST001', 'CUST002', 'CUST003']);
    expect(customerSection.aggregationPatterns.length).toBe(3); // 選択顧客数
    customerSection.aggregationPatterns.forEach((pattern) => {
      expect(pattern.customerId).toMatch(/^CUST\d{3}$/);
      expect(pattern.calculationLogic).toBeDefined();
      expect(pattern.dataSource).toBeDefined();
    });

    // Assertion 4: サービス別集計セクションの検証
    const serviceSection = generatedManual.sections.find(
      (s) => s.sectionType === 'SERVICE_AGGREGATION'
    );
    expect(serviceSection).toBeDefined();
    expect(serviceSection.targetItems).toEqual(['SVC_A', 'SVC_B']);
    expect(serviceSection.aggregationPatterns.length).toBe(2); // 選択サービス数
    serviceSection.aggregationPatterns.forEach((pattern) => {
      expect(pattern.serviceId).toMatch(/^SVC_[A-Z]$/);
      expect(pattern.calculationLogic).toBeDefined();
    });

    // Assertion 5: 期間別集計セクションの検証
    const periodSection = generatedManual.sections.find(
      (s) => s.sectionType === 'PERIOD_AGGREGATION'
    );
    expect(periodSection).toBeDefined();
    expect(periodSection.periodPatterns).toEqual(['MONTHLY', 'QUARTERLY', 'YEARLY']);
    expect(periodSection.aggregationPatterns.length).toBe(3); // 期間パターン数
    periodSection.aggregationPatterns.forEach((pattern) => {
      expect(['MONTHLY', 'QUARTERLY', 'YEARLY']).toContain(pattern.periodType);
      expect(pattern.calculationSteps).toBeDefined();
    });

    // Assertion 6: クロス集計セクションの存在と内容を検証
    const crossAggregationSection = generatedManual.sections.find(
      (s) => s.sectionType === 'CROSS_AGGREGATION'
    );
    expect(crossAggregationSection).toBeDefined();

    // クロス集計パターン数: 顧客×サービス + 顧客×期間 + サービス×期間 + 顧客×サービス×期間
    // = (3×2) + (3×3) + (2×3) + (3×2×3) = 6 + 9 + 6 + 18 = 39
    expect(crossAggregationSection.crossPatterns.length).toBe(39);

    // Assertion 7: 顧客×サービスのクロス集計が完全に反映
    const customerServicePatterns = crossAggregationSection.crossPatterns.filter(
      (p) => p.type === 'CUSTOMER_SERVICE'
    );
    expect(customerServicePatterns.length).toBe(6); // 3顧客 × 2サービス
    customerServicePatterns.forEach((pattern) => {
      expect(pattern.customerId).toMatch(/^CUST\d{3}$/);
      expect(pattern.serviceId).toMatch(/^SVC_[A-Z]$/);
      expect(['CUST001', 'CUST002', 'CUST003']).toContain(pattern.customerId);
      expect(['SVC_A', 'SVC_B']).toContain(pattern.serviceId);
    });

    // Assertion 8: 顧客×期間のクロス集計が完全に反映
    const customerPeriodPatterns = crossAggregationSection.crossPatterns.filter(
      (p) => p.type === 'CUSTOMER_PERIOD'
    );
    expect(customerPeriodPatterns.length).toBe(9); // 3顧客 × 3期間パターン
    customerPeriodPatterns.forEach((pattern) => {
      expect(pattern.customerId).toMatch(/^CUST\d{3}$/);
      expect(['MONTHLY', 'QUARTERLY', 'YEARLY']).toContain(pattern.periodType);
    });

    // Assertion 9: サービス×期間のクロス集計が完全に反映
    const servicePeriodPatterns = crossAggregationSection.crossPatterns.filter(
      (p) => p.type === 'SERVICE_PERIOD'
    );
    expect(servicePeriodPatterns.length).toBe(6); // 2サービス × 3期間パターン
    servicePeriodPatterns.forEach((pattern) => {
      expect(pattern.serviceId).toMatch(/^SVC_[A-Z]$/);
      expect(['MONTHLY', 'QUARTERLY', 'YEARLY']).toContain(pattern.periodType);
    });

    // Assertion 10: 顧客×サービス×期間の3元クロス集計が完全に反映
    const triplePatterns = crossAggregationSection.crossPatterns.filter(
      (p) => p.type === 'CUSTOMER_SERVICE_PERIOD'
    );
    expect(triplePatterns.length).toBe(18); // 3顧客 × 2サービス × 3期間パターン
    triplePatterns.forEach((pattern) => {
      expect(['CUST001', 'CUST002', 'CUST003']).toContain(pattern.customerId);
      expect(['SVC_A', 'SVC_B']).toContain(pattern.serviceId);
      expect(['MONTHLY', 'QUARTERLY', 'YEARLY']).toContain(pattern.periodType);
    });

    // Assertion 11: 文書内参照関連性を検証（ページ番号が矛盾していない）
    const pageReferences = generatedManual.sections.flatMap((s) => s.pageReferences || []);
    const maxPageNumber = Math.max(...pageReferences.map((ref) => ref.pageNumber));
    expect(generatedManual.totalPages).toBeGreaterThanOrEqual(maxPageNumber);
    pageReferences.forEach((ref) => {
      expect(ref.pageNumber).toBeGreaterThan(0);
      expect(ref.pageNumber).toBeLessThanOrEqual(generatedManual.totalPages);
      expect(ref.sectionId).toBeDefined();
    });

    // Assertion 12: 文書の論理的整合性を検証（参照関連性に矛盾がない）
    const sectionIds = generatedManual.sections.map((s) => s.sectionId);
    pageReferences.forEach((ref) => {
      expect(sectionIds).toContain(ref.sectionId);
    });

    // Assertion 13: 各セクションの集計ステップが論理的に一貫
    generatedManual.sections.forEach((section) => {
      if (section.aggregationPatterns) {
        section.aggregationPatterns.forEach((pattern) => {
          expect(pattern.calculationLogic).toBeTruthy();
          expect(pattern.calculationLogic.steps).toBeDefined();
          expect(Array.isArray(pattern.calculationLogic.steps)).toBe(true);
          expect(pattern.calculationLogic.steps.length).toBeGreaterThan(0);
        });
      }
    });

    // Assertion 14: 生成文書がすべての有効な集計単位を網羅
    expect(generatedManual.enabledAggregationTypes).toEqual(
      expect.arrayContaining(['CUSTOMER', 'SERVICE', 'PERIOD'])
    );
    expect(generatedManual.enabledAggregationTypes.length).toBe(3);

    // Assertion 15: 文書の総セクション数が期待値を満たす
    // 基本セクション（目次、はじめに）+ 3つの単位セクション + クロス集計セクション + 附録 ≥ 6
    expect(generatedManual.sections.length).toBeGreaterThanOrEqual(6);

    // Assertion 16: 生成文書のメタデータが完全
    expect(generatedManual.generatedAt).toBeDefined();
    expect(typeof generatedManual.generatedAt).toBe('string');
    expect(generatedManual.version).toBe('1.0');
    expect(generatedManual.status).toBe('GENERATED');

    // Assertion 17: すべての集計パターンが網羅されており、漏れがないことを確認
    const totalExpectedPatterns =
      3 + // 顧客別集計パターン
      2 + // サービス別集計パターン
      3 + // 期間別集計パターン
      39; // クロス集計パターン
    const totalActualPatterns = generatedManual.sections.reduce((sum, section) => {
      const sectionPatterns =
        (section.aggregationPatterns?.length || 0) +
        (section.crossPatterns?.length || 0);
      return sum + sectionPatterns;
    }, 0);
    expect(totalActualPatterns).toBe(totalExpectedPatterns);
  });
});