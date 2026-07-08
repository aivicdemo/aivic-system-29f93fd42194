import { recordJudgmentBasis } from '../../src/logic/it-6-3-1';

describe('査定判定ロジックの適用履歴と根拠の記録・検索機能', () => {
  test('SCEN-847: 乖離率が0%の場合でも判定根拠が正常に記録される', () => {
    // 乖離率が0%となる査定案件データの準備
    const appraisal_case_id = 'APPR-20240115-001';
    const deviation_rate_percent = 0;
    const deviation_amount_yen = 0;
    const referenced_past_case_count = 5;
    const price_book_source = '物価本2024年1月版';
    const applied_correction_coefficient = 1.0;
    const appraiser_id = 'APPRAISER-0042';
    const appraiser_name = '山田太郎';
    const judgment_timestamp = new Date('2024-01-15T11:30:00Z');
    const judgment_basis_text = '相場価格と同額。過去案件データ5件の平均値と完全一致。補正係数1.0適用。';

    // 判定根拠自動記録機能を実行
    const result = recordJudgmentBasis({
      appraisal_case_id: appraisal_case_id,
      deviation_rate_percent: deviation_rate_percent,
      deviation_amount_yen: deviation_amount_yen,
      referenced_past_case_count: referenced_past_case_count,
      price_book_source: price_book_source,
      applied_correction_coefficient: applied_correction_coefficient,
      appraiser_id: appraiser_id,
      appraiser_name: appraiser_name,
      judgment_timestamp: judgment_timestamp,
      judgment_basis_text: judgment_basis_text,
    });

    // 乖離率が0%であることを確認
    expect(result.deviation_rate_percent).toBe(0);

    // 判定根拠が正常に記録されていることを検証
    expect(result.judgment_basis_recorded).toBe(true);
    expect(result.judgment_basis_content).not.toBe('');
    expect(result.judgment_basis_content).not.toBeNull();
    expect(result.judgment_basis_content).toBeDefined();

    // 判定根拠の内容が正常な形式であることを検証
    expect(typeof result.judgment_basis_content).toBe('string');
    expect(result.judgment_basis_content.length).toBeGreaterThan(0);

    // 記録タイムスタンプが正しく保存されていることを確認
    expect(result.recorded_timestamp).toBeDefined();
    expect(result.recorded_timestamp instanceof Date).toBe(true);
    expect(result.recorded_timestamp.toISOString()).toBe('2024-01-15T11:30:00.000Z');

    // 記録者情報が正しく保存されていることを確認
    expect(result.recorded_by_appraiser_id).toBe(appraiser_id);
    expect(result.recorded_by_appraiser_name).toBe(appraiser_name);

    // 判定根拠に含まれるべき情報が記録されていることを検証
    expect(result.judgment_basis_content).toContain(appraisal_case_id);
    expect(result.judgment_basis_content).toContain('0');
    expect(result.judgment_basis_content).toContain(price_book_source);

    // 記録レコード全体の構造が正しいことを検証
    expect(result).toHaveProperty('appraisal_case_id');
    expect(result).toHaveProperty('judgment_basis_recorded');
    expect(result).toHaveProperty('judgment_basis_content');
    expect(result).toHaveProperty('recorded_timestamp');
    expect(result).toHaveProperty('recorded_by_appraiser_id');
    expect(result).toHaveProperty('recorded_by_appraiser_name');
    expect(result).toHaveProperty('referenced_past_case_count');
    expect(result).toHaveProperty('price_book_source');
    expect(result).toHaveProperty('applied_correction_coefficient');

    // 参照データ件数が正確に記録されていること
    expect(result.referenced_past_case_count).toBe(5);

    // 物価本出典が正確に記録されていること
    expect(result.price_book_source).toBe('物価本2024年1月版');

    // 補正係数が正確に記録されていること
    expect(result.applied_correction_coefficient).toBe(1.0);
  });
});