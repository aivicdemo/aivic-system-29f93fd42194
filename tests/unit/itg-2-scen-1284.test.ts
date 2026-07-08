import { calculateRequiredStaffByBusyLevel } from '../../src/logic/it-1-br-2-2-2-1';

describe('査定員ごとの判定結果と根拠の月次集計・分析ダッシュボード', () => {
  // SCEN-1284
  test('月次変動パターン分類・必要人員数算出機能 - 繁忙度レベル別の必要人員数が正確に算出される', () => {
    // テストデータ: 複数の繁忙度レベル（低・中・高・超高）ごとに査定件数、平均処理時間、品質基準を定義
    const busyLevelInputs = [
      {
        busyLevelName: '低',
        estimatedMonthlyCount: 300,
        avgProcessTimeMinutes: 15,
        qualityStandardAccuracyRate: 95,
      },
      {
        busyLevelName: '中',
        estimatedMonthlyCount: 600,
        avgProcessTimeMinutes: 15,
        qualityStandardAccuracyRate: 95,
      },
      {
        busyLevelName: '高',
        estimatedMonthlyCount: 1000,
        avgProcessTimeMinutes: 15,
        qualityStandardAccuracyRate: 95,
      },
      {
        busyLevelName: '超高',
        estimatedMonthlyCount: 1500,
        avgProcessTimeMinutes: 15,
        qualityStandardAccuracyRate: 95,
      },
    ];

    // 営業日数（月次）
    const businessDaysPerMonth = 20;
    // 1 人あたり 1 日の稼働時間（分）
    const workMinutesPerDay = 480;

    // 期待される必要人員数を手動計算
    // 低: (300 件 / 20 日) * 15 分 / 480 分 = 15 * 15 / 480 ≈ 0.47 → 切上げ 1 名
    // 中: (600 件 / 20 日) * 15 分 / 480 分 = 30 * 15 / 480 ≈ 0.94 → 切上げ 1 名
    // 高: (1000 件 / 20 日) * 15 分 / 480 分 = 50 * 15 / 480 ≈ 1.56 → 切上げ 2 名
    // 超高: (1500 件 / 20 日) * 15 分 / 480 分 = 75 * 15 / 480 ≈ 2.34 → 切上げ 3 名

    const expectedRequiredStaffPerLevel = [
      { busyLevelName: '低', requiredStaff: 1 },
      { busyLevelName: '中', requiredStaff: 1 },
      { busyLevelName: '高', requiredStaff: 2 },
      { busyLevelName: '超高', requiredStaff: 3 },
    ];

    // 関数呼び出し
    const result = calculateRequiredStaffByBusyLevel(
      busyLevelInputs,
      businessDaysPerMonth,
      workMinutesPerDay
    );

    // 結果の必須フィールド確認: 各繁忙度レベルに対応した必要人員数が返却されること
    expect(result).toHaveLength(4);
    expect(result[0]).toHaveProperty('busyLevelName');
    expect(result[0]).toHaveProperty('requiredStaff');
    expect(result[0]).toHaveProperty('totalProcessingMinutes');
    expect(result[0]).toHaveProperty('reportDate');

    // 低繁忙度レベルの必要人員数が算出されることを確認
    expect(result[0].busyLevelName).toBe('低');
    expect(result[0].requiredStaff).toBe(expectedRequiredStaffPerLevel[0].requiredStaff);

    // 中繁忙度レベルの必要人員数が算出されることを確認
    expect(result[1].busyLevelName).toBe('中');
    expect(result[1].requiredStaff).toBe(expectedRequiredStaffPerLevel[1].requiredStaff);

    // 高繁忙度レベルの必要人員数が算出されることを確認
    expect(result[2].busyLevelName).toBe('高');
    expect(result[2].requiredStaff).toBe(expectedRequiredStaffPerLevel[2].requiredStaff);

    // 超高繁忙度レベルの必要人員数が算出されることを確認
    expect(result[3].busyLevelName).toBe('超高');
    expect(result[3].requiredStaff).toBe(expectedRequiredStaffPerLevel[3].requiredStaff);

    // 各繁忙度レベル間で必要人員数が段階的に増加していることを検証
    expect(result[0].requiredStaff).toBeLessThanOrEqual(result[1].requiredStaff);
    expect(result[1].requiredStaff).toBeLessThanOrEqual(result[2].requiredStaff);
    expect(result[2].requiredStaff).toBeLessThanOrEqual(result[3].requiredStaff);

    // 超高レベルが最も必要人員数が多いことを確認
    expect(result[3].requiredStaff).toBeGreaterThan(result[2].requiredStaff);

    // 算出結果がレポート形式で出力されることを確認
    // 各行がレポート形式のフィールドを保持していることを確認
    result.forEach((levelRecord) => {
      expect(typeof levelRecord.busyLevelName).toBe('string');
      expect(typeof levelRecord.requiredStaff).toBe('number');
      expect(levelRecord.requiredStaff).toBeGreaterThan(0);
      expect(typeof levelRecord.totalProcessingMinutes).toBe('number');
      expect(levelRecord.totalProcessingMinutes).toBeGreaterThan(0);
      expect(typeof levelRecord.reportDate).toBe('string');
      // reportDate は ISO 形式の日付文字列であることを確認
      expect(new Date(levelRecord.reportDate)).toBeInstanceOf(Date);
      expect(Number.isNaN(new Date(levelRecord.reportDate).getTime())).toBe(false);
    });

    // 総人員数が妥当な範囲内にあることを確認
    const totalRequiredStaff = result.reduce((sum, record) => sum + record.requiredStaff, 0);
    expect(totalRequiredStaff).toBe(1 + 1 + 2 + 3); // 7 名
    expect(totalRequiredStaff).toBeGreaterThan(0);
    expect(totalRequiredStaff).toBeLessThanOrEqual(30); // 初期 30 名規模に対して妥当な範囲
  });
});