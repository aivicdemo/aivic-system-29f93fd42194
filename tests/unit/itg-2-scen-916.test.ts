import { autoAssignPastProjectClassificationTags } from '../../src/logic/it-6-2-1-1';

describe('査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化', () => {
  test('SCEN-916: 過去案件データ分類タグ自動判定機能 - 地域・工種の分類情報が不足または矛盾している案件レコードに対して未分類フラグが付与される', () => {
    // 地域情報が空白の案件レコード
    const projectWithoutRegion = {
      project_id: 'PRJ001',
      region_code: '',
      work_type: 'renovation',
      work_content: '既存建物改修',
      unclassified_flag: false,
      classification_tags: [],
      error_log: '',
    };

    // 工種情報が矛盾している案件レコード（工種='解体'だが工事内容='新築'）
    const projectWithConflictingWorkType = {
      project_id: 'PRJ002',
      region_code: 'TOKYO-01',
      work_type: 'demolition',
      work_content: '新築',
      unclassified_flag: false,
      classification_tags: [],
      error_log: '',
    };

    // 地域・工種両方の情報が不足している案件レコード
    const projectWithoutBoth = {
      project_id: 'PRJ003',
      region_code: '',
      work_type: '',
      work_content: '工事内容不詳',
      unclassified_flag: false,
      classification_tags: [],
      error_log: '',
    };

    const input_projects = [
      projectWithoutRegion,
      projectWithConflictingWorkType,
      projectWithoutBoth,
    ];

    const result = autoAssignPastProjectClassificationTags(input_projects);

    // 地域情報が不足しているレコードの検証
    expect(result[0].unclassified_flag).toBe(true);
    expect(result[0].classification_tags).toEqual([]);
    expect(result[0].error_log).toMatch(/地域/);

    // 工種情報が矛盾しているレコードの検証
    expect(result[1].unclassified_flag).toBe(true);
    expect(result[1].classification_tags).toEqual([]);
    expect(result[1].error_log).toMatch(/工種/);

    // 地域・工種両方の情報が不足しているレコードの検証
    expect(result[2].unclassified_flag).toBe(true);
    expect(result[2].classification_tags).toEqual([]);
    expect(result[2].error_log).toMatch(/地域|工種/);

    // 全レコードでエラーログが記録されていることを確認
    expect(result[0].error_log.length).toBeGreaterThan(0);
    expect(result[1].error_log.length).toBeGreaterThan(0);
    expect(result[2].error_log.length).toBeGreaterThan(0);
  });
});