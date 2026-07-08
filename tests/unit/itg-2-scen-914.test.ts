import { calculateNormalizationCoefficients } from '../../src/logic/it-6-2-1-1';

describe('査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化', () => {
  test('SCEN-914: 物価変動補正係数計算 - 複数の過去案件について一括で正規化金額を算出する', () => {
    // 過去案件データ（最低3件以上）
    const pastProjects = [
      {
        projectId: 'PROJ_001',
        originalAmount: 1000000,
        assessmentDate: '2023-06-15T09:30:00Z',
        location: '東京都渋谷区',
        workType: '新築工事',
        basePriceMonth: '2023-06',
        basePriceVersion: '1.0'
      },
      {
        projectId: 'PROJ_002',
        originalAmount: 1500000,
        assessmentDate: '2023-07-20T14:15:00Z',
        location: '大阪府大阪市',
        workType: '改築工事',
        basePriceMonth: '2023-07',
        basePriceVersion: '1.0'
      },
      {
        projectId: 'PROJ_003',
        originalAmount: 800000,
        assessmentDate: '2023-08-10T11:45:00Z',
        location: '愛知県名古屋市',
        workType: '新築工事',
        basePriceMonth: '2023-08',
        basePriceVersion: '1.0'
      }
    ];

    // 基準時点の物価レベル（2024-01-01を基準とする）
    const referenceDate = '2024-01-01T00:00:00Z';

    // 各月の物価変動係数（2023年6月～2024年1月）
    const priceInflationRates = {
      '2023-06': 0.98,  // 前年同月比 98%
      '2023-07': 0.99,  // 前年同月比 99%
      '2023-08': 1.01,  // 前年同月比 101%
      '2023-09': 1.02,  // 前年同月比 102%
      '2023-10': 1.03,  // 前年同月比 103%
      '2023-11': 1.04,  // 前年同月比 104%
      '2023-12': 1.05,  // 前年同月比 105%
      '2024-01': 1.06   // 前年同月比 106%
    };

    // 関数実行
    const result = calculateNormalizationCoefficients({
      projects: pastProjects,
      referenceDate,
      priceInflationRates
    });

    // 【検証1】結果の基本構造
    expect(result).toHaveProperty('normalizedProjects');
    expect(result).toHaveProperty('summary');
    expect(Array.isArray(result.normalizedProjects)).toBe(true);
    expect(result.normalizedProjects.length).toBe(3);

    // 【検証2】PROJ_001の正規化金額
    // 基準時点の物価レベルが1.06（2024-01基準）、元の査定時点が2023-06で0.98
    // 補正係数 = 1.06 / 0.98 ≈ 1.0816326531
    // 正規化金額 = 1000000 * 1.0816326531 = 1081632.6531
    const proj001 = result.normalizedProjects.find(
      (p: any) => p.projectId === 'PROJ_001'
    );
    expect(proj001).toBeDefined();
    expect(proj001.normalizedAmount).toBeCloseTo(1081632.65, 1);
    expect(proj001.adjustmentCoefficient).toBeCloseTo(1.0816, 4);
    expect(proj001.adjustmentRate).toBeCloseTo(8.16, 2); // %

    // 【検証3】PROJ_002の正規化金額
    // 補正係数 = 1.06 / 0.99 ≈ 1.0707070707
    // 正規化金額 = 1500000 * 1.0707070707 = 1606060.6061
    const proj002 = result.normalizedProjects.find(
      (p: any) => p.projectId === 'PROJ_002'
    );
    expect(proj002).toBeDefined();
    expect(proj002.normalizedAmount).toBeCloseTo(1606060.61, 1);
    expect(proj002.adjustmentCoefficient).toBeCloseTo(1.0707, 4);
    expect(proj002.adjustmentRate).toBeCloseTo(7.07, 2); // %

    // 【検証4】PROJ_003の正規化金額
    // 補正係数 = 1.06 / 1.01 ≈ 1.0495049505
    // 正規化金額 = 800000 * 1.0495049505 = 839603.9604
    const proj003 = result.normalizedProjects.find(
      (p: any) => p.projectId === 'PROJ_003'
    );
    expect(proj003).toBeDefined();
    expect(proj003.normalizedAmount).toBeCloseTo(839603.96, 1);
    expect(proj003.adjustmentCoefficient).toBeCloseTo(1.0495, 4);
    expect(proj003.adjustmentRate).toBeCloseTo(4.95, 2); // %

    // 【検証5】全案件の正規化金額が妥当な補正範囲内（元の金額に対して±30%以内）
    result.normalizedProjects.forEach((proj: any) => {
      const adjustmentPercentage = (
        (proj.normalizedAmount - proj.originalAmount) / proj.originalAmount
      ) * 100;
      expect(Math.abs(adjustmentPercentage)).toBeLessThanOrEqual(30);
    });

    // 【検証6】補正係数が全案件で正の値
    result.normalizedProjects.forEach((proj: any) => {
      expect(proj.adjustmentCoefficient).toBeGreaterThan(0);
    });

    // 【検証7】summary情報の検証
    expect(result.summary).toHaveProperty('totalProjects');
    expect(result.summary.totalProjects).toBe(3);
    expect(result.summary).toHaveProperty('totalOriginalAmount');
    expect(result.summary.totalOriginalAmount).toBe(3300000);
    expect(result.summary).toHaveProperty('totalNormalizedAmount');
    expect(result.summary.totalNormalizedAmount).toBeCloseTo(3527296.46, 1);
    expect(result.summary).toHaveProperty('averageAdjustmentRate');
    expect(result.summary.averageAdjustmentRate).toBeCloseTo(6.87, 2); // %

    // 【検証8】エクスポート機能のテスト
    expect(result).toHaveProperty('exportData');
    const exportData = result.exportData;
    expect(exportData).toHaveProperty('format');
    expect(exportData.format).toBe('csv');
    expect(exportData).toHaveProperty('rows');
    expect(Array.isArray(exportData.rows)).toBe(true);
    expect(exportData.rows.length).toBe(3);

    // 【検証9】エクスポートファイルのCSV行形式
    const csvRows = exportData.rows;
    csvRows.forEach((row: any, index: number) => {
      expect(row).toHaveProperty('projectId');
      expect(row).toHaveProperty('originalAmount');
      expect(row).toHaveProperty('normalizedAmount');
      expect(row).toHaveProperty('adjustmentCoefficient');
      expect(row).toHaveProperty('adjustmentRate');
      expect(row).toHaveProperty('assessmentDate');
      expect(row).toHaveProperty('location');
      expect(row).toHaveProperty('workType');

      // エクスポートデータが画面表示データと一致していることを確認
      const screenData = result.normalizedProjects[index];
      expect(row.projectId).toBe(screenData.projectId);
      expect(row.originalAmount).toBe(screenData.originalAmount);
      expect(row.normalizedAmount).toBeCloseTo(
        screenData.normalizedAmount,
        1
      );
      expect(row.adjustmentCoefficient).toBeCloseTo(
        screenData.adjustmentCoefficient,
        4
      );
    });

    // 【検証10】エクスポートデータが正しく生成されたことを確認
    expect(exportData.rows[0].projectId).toBe('PROJ_001');
    expect(exportData.rows[0].normalizedAmount).toBeCloseTo(1081632.65, 1);
    expect(exportData.rows[1].projectId).toBe('PROJ_002');
    expect(exportData.rows[1].normalizedAmount).toBeCloseTo(1606060.61, 1);
    expect(exportData.rows[2].projectId).toBe('PROJ_003');
    expect(exportData.rows[2].normalizedAmount).toBeCloseTo(839603.96, 1);

    // 【検証11】メタデータの検証
    expect(result).toHaveProperty('metadata');
    expect(result.metadata).toHaveProperty('processedAt');
    expect(result.metadata).toHaveProperty('referenceDate');
    expect(result.metadata.referenceDate).toBe(referenceDate);
    expect(result.metadata).toHaveProperty('processingStatus');
    expect(result.metadata.processingStatus).toBe('completed');
  });
});