import { detectDeprecatedVersions } from '../../src/logic/it-1781935279444-1-1-1';

describe('営業データ項目のメタデータ管理機能 - 非推奨版資料の自動検出・警告機能', () => {
  // SCEN-785
  test('複数の旧バージョンが存在する場合、すべての旧バージョンに対して警告が適用される', () => {
    const deprecated_versions_input = [
      {
        version_id: 'v1_0_doc_001',
        document_name: 'proposal_template',
        version_number: '1.0',
        created_at: new Date('2024-01-15T10:00:00Z'),
        status: 'deprecated',
        deprecation_reason: 'Superseded by v1.5'
      },
      {
        version_id: 'v1_5_doc_001',
        document_name: 'proposal_template',
        version_number: '1.5',
        created_at: new Date('2024-02-20T14:30:00Z'),
        status: 'deprecated',
        deprecation_reason: 'Superseded by v2.0'
      },
      {
        version_id: 'v2_0_doc_001',
        document_name: 'proposal_template',
        version_number: '2.0',
        created_at: new Date('2024-03-10T09:15:00Z'),
        status: 'deprecated',
        deprecation_reason: 'Superseded by v3.0'
      },
      {
        version_id: 'v3_0_doc_001',
        document_name: 'proposal_template',
        version_number: '3.0',
        created_at: new Date('2024-04-05T16:45:00Z'),
        status: 'active',
        deprecation_reason: null
      }
    ];

    const current_recommended_version = {
      version_id: 'v3_0_doc_001',
      document_name: 'proposal_template',
      version_number: '3.0',
      created_at: new Date('2024-04-05T16:45:00Z'),
      status: 'active',
      deprecation_reason: null
    };

    const result = detectDeprecatedVersions(deprecated_versions_input, current_recommended_version);

    expect(result.deprecated_count).toBe(3);
    expect(result.current_version_id).toBe('v3_0_doc_001');
    expect(result.detected_deprecated_versions).toHaveLength(3);

    expect(result.detected_deprecated_versions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          version_id: 'v1_0_doc_001',
          version_number: '1.0',
          warning_flag: true,
          warning_message: expect.stringContaining('1.0')
        }),
        expect.objectContaining({
          version_id: 'v1_5_doc_001',
          version_number: '1.5',
          warning_flag: true,
          warning_message: expect.stringContaining('1.5')
        }),
        expect.objectContaining({
          version_id: 'v2_0_doc_001',
          version_number: '2.0',
          warning_flag: true,
          warning_message: expect.stringContaining('2.0')
        })
      ])
    );

    const all_warnings_have_flag = result.detected_deprecated_versions.every(
      (deprecated_item: any) => deprecated_item.warning_flag === true
    );
    expect(all_warnings_have_flag).toBe(true);

    const all_warnings_include_metadata = result.detected_deprecated_versions.every(
      (deprecated_item: any) =>
        deprecated_item.version_number &&
        deprecated_item.deprecation_reason &&
        deprecated_item.warning_message
    );
    expect(all_warnings_include_metadata).toBe(true);

    const v1_0_warning = result.detected_deprecated_versions.find(
      (item: any) => item.version_id === 'v1_0_doc_001'
    );
    expect(v1_0_warning.warning_message).toMatch(/旧バージョン/);
    expect(v1_0_warning.deprecation_reason).toBe('Superseded by v1.5');

    const v1_5_warning = result.detected_deprecated_versions.find(
      (item: any) => item.version_id === 'v1_5_doc_001'
    );
    expect(v1_5_warning.warning_message).toMatch(/旧バージョン/);
    expect(v1_5_warning.deprecation_reason).toBe('Superseded by v2.0');

    const v2_0_warning = result.detected_deprecated_versions.find(
      (item: any) => item.version_id === 'v2_0_doc_001'
    );
    expect(v2_0_warning.warning_message).toMatch(/旧バージョン/);
    expect(v2_0_warning.deprecation_reason).toBe('Superseded by v3.0');

    expect(result.billing_automation_filter_status).toBe('pending_confirmation');
    expect(result.all_deprecated_versions_filtered).toBe(true);
    expect(result.filter_applied_timestamp).toBeDefined();
  });
});