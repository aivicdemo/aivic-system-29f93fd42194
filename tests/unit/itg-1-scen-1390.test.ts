import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  createMonthlySummaryTemplate,
  updateMonthlySummaryTemplate,
  getMonthlySummaryTemplateVersionHistory,
  rollbackMonthlySummaryTemplate,
} from '../../src/logic/it-1-br-1781935279444-1-2-1';

describe('月次サマリーテンプレート版管理とロールバック機能', () => {
  // SCEN-1390
  it('テンプレート変更時に版管理が正確に行われ、各バージョンが独立して保持され、任意の過去バージョンへのロールバックが可能である', () => {
    const template_id = 'tpl_001';
    const user_id = 'user_admin_001';
    const created_at_v1 = new Date('2024-01-15T09:00:00Z');

    // バージョン1作成
    const v1_result = createMonthlySummaryTemplate({
      template_id,
      template_name: 'Monthly Sales Summary Report',
      fields: [
        { field_id: 'f001', field_name: 'Total Revenue', display_order: 1 },
        { field_id: 'f002', field_name: 'Total Quota', display_order: 2 },
        { field_id: 'f003', field_name: 'Attainment Rate', display_order: 3 },
      ],
      format: 'json',
      created_by: user_id,
      created_at: created_at_v1,
    });

    expect(v1_result).toEqual({
      template_id,
      version: 1,
      template_name: 'Monthly Sales Summary Report',
      fields: [
        { field_id: 'f001', field_name: 'Total Revenue', display_order: 1 },
        { field_id: 'f002', field_name: 'Total Quota', display_order: 2 },
        { field_id: 'f003', field_name: 'Attainment Rate', display_order: 3 },
      ],
      format: 'json',
      created_by: user_id,
      created_at: created_at_v1,
      updated_by: user_id,
      updated_at: created_at_v1,
    });

    // バージョン2へ更新（フィールド追加、フォーマット変更）
    const updated_at_v2 = new Date('2024-01-15T10:30:00Z');
    const v2_result = updateMonthlySummaryTemplate({
      template_id,
      fields: [
        { field_id: 'f001', field_name: 'Total Revenue', display_order: 1 },
        { field_id: 'f002', field_name: 'Total Quota', display_order: 2 },
        { field_id: 'f003', field_name: 'Attainment Rate', display_order: 3 },
        { field_id: 'f004', field_name: 'Growth Rate %', display_order: 4 },
      ],
      format: 'csv',
      updated_by: user_id,
      updated_at: updated_at_v2,
    });

    expect(v2_result).toEqual({
      template_id,
      version: 2,
      template_name: 'Monthly Sales Summary Report',
      fields: [
        { field_id: 'f001', field_name: 'Total Revenue', display_order: 1 },
        { field_id: 'f002', field_name: 'Total Quota', display_order: 2 },
        { field_id: 'f003', field_name: 'Attainment Rate', display_order: 3 },
        { field_id: 'f004', field_name: 'Growth Rate %', display_order: 4 },
      ],
      format: 'csv',
      created_by: user_id,
      created_at: created_at_v1,
      updated_by: user_id,
      updated_at: updated_at_v2,
    });

    // バージョン履歴確認（v1とv2が別々に記録）
    const history = getMonthlySummaryTemplateVersionHistory({
      template_id,
    });

    expect(history).toEqual({
      template_id,
      versions: [
        {
          version: 1,
          template_name: 'Monthly Sales Summary Report',
          fields: [
            { field_id: 'f001', field_name: 'Total Revenue', display_order: 1 },
            { field_id: 'f002', field_name: 'Total Quota', display_order: 2 },
            { field_id: 'f003', field_name: 'Attainment Rate', display_order: 3 },
          ],
          format: 'json',
          created_by: user_id,
          created_at: created_at_v1,
          updated_by: user_id,
          updated_at: created_at_v1,
        },
        {
          version: 2,
          template_name: 'Monthly Sales Summary Report',
          fields: [
            { field_id: 'f001', field_name: 'Total Revenue', display_order: 1 },
            { field_id: 'f002', field_name: 'Total Quota', display_order: 2 },
            { field_id: 'f003', field_name: 'Attainment Rate', display_order: 3 },
            { field_id: 'f004', field_name: 'Growth Rate %', display_order: 4 },
          ],
          format: 'csv',
          created_by: user_id,
          created_at: created_at_v1,
          updated_by: user_id,
          updated_at: updated_at_v2,
        },
      ],
    });

    // バージョン3作成
    const updated_at_v3 = new Date('2024-01-15T12:00:00Z');
    const v3_result = updateMonthlySummaryTemplate({
      template_id,
      fields: [
        { field_id: 'f001', field_name: 'Total Revenue (JPY)', display_order: 1 },
        { field_id: 'f002', field_name: 'Total Quota (JPY)', display_order: 2 },
        { field_id: 'f003', field_name: 'Attainment Rate %', display_order: 3 },
        { field_id: 'f004', field_name: 'Growth Rate %', display_order: 4 },
        { field_id: 'f005', field_name: 'Top Performer', display_order: 5 },
      ],
      format: 'xlsx',
      updated_by: user_id,
      updated_at: updated_at_v3,
    });

    expect(v3_result.version).toBe(3);
    expect(v3_result.format).toBe('xlsx');
    expect(v3_result.fields.length).toBe(5);

    // バージョン4作成
    const updated_at_v4 = new Date('2024-01-15T13:15:00Z');
    const v4_result = updateMonthlySummaryTemplate({
      template_id,
      fields: [
        { field_id: 'f001', field_name: 'Total Revenue (JPY)', display_order: 1 },
        { field_id: 'f002', field_name: 'Total Quota (JPY)', display_order: 2 },
        { field_id: 'f003', field_name: 'Attainment Rate %', display_order: 3 },
        { field_id: 'f004', field_name: 'Growth Rate %', display_order: 4 },
        { field_id: 'f005', field_name: 'Top Performer', display_order: 5 },
        { field_id: 'f006', field_name: 'Notes', display_order: 6 },
      ],
      format: 'xlsx',
      updated_by: user_id,
      updated_at: updated_at_v4,
    });

    expect(v4_result.version).toBe(4);
    expect(v4_result.fields.length).toBe(6);

    // バージョン5作成
    const updated_at_v5 = new Date('2024-01-15T14:45:00Z');
    const v5_result = updateMonthlySummaryTemplate({
      template_id,
      fields: [
        { field_id: 'f001', field_name: 'Total Revenue (JPY)', display_order: 1 },
        { field_id: 'f002', field_name: 'Total Quota (JPY)', display_order: 2 },
        { field_id: 'f003', field_name: 'Attainment Rate %', display_order: 3 },
        { field_id: 'f004', field_name: 'Growth Rate %', display_order: 4 },
        { field_id: 'f005', field_name: 'Top Performer', display_order: 5 },
        { field_id: 'f006', field_name: 'Notes', display_order: 6 },
        { field_id: 'f007', field_name: 'Last Updated', display_order: 7 },
      ],
      format: 'html',
      updated_by: user_id,
      updated_at: updated_at_v5,
    });

    expect(v5_result.version).toBe(5);
    expect(v5_result.fields.length).toBe(7);

    // 完全な履歴確認
    const full_history = getMonthlySummaryTemplateVersionHistory({
      template_id,
    });

    expect(full_history.versions.length).toBe(5);
    expect(full_history.versions[0].version).toBe(1);
    expect(full_history.versions[1].version).toBe(2);
    expect(full_history.versions[2].version).toBe(3);
    expect(full_history.versions[3].version).toBe(4);
    expect(full_history.versions[4].version).toBe(5);

    // v2へロールバック実行
    const rollback_at = new Date('2024-01-15T15:30:00Z');
    const rollback_result = rollbackMonthlySummaryTemplate({
      template_id,
      target_version: 2,
      rollback_by: user_id,
      rollback_at,
      rollback_reason: 'Revert to previous stable format (CSV)',
    });

    // ロールバック後、v2の内容が復元される
    expect(rollback_result).toEqual({
      template_id,
      version: 6,
      template_name: 'Monthly Sales Summary Report',
      fields: [
        { field_id: 'f001', field_name: 'Total Revenue', display_order: 1 },
        { field_id: 'f002', field_name: 'Total Quota', display_order: 2 },
        { field_id: 'f003', field_name: 'Attainment Rate', display_order: 3 },
        { field_id: 'f004', field_name: 'Growth Rate %', display_order: 4 },
      ],
      format: 'csv',
      created_by: user_id,
      created_at: created_at_v1,
      updated_by: user_id,
      updated_at: rollback_at,
      rollback_from_version: 2,
      rollback_reason: 'Revert to previous stable format (CSV)',
    });

    // ロールバック後も履歴が保持されている（バージョン6として新規記録）
    const post_rollback_history = getMonthlySummaryTemplateVersionHistory({
      template_id,
    });

    expect(post_rollback_history.versions.length).toBe(6);
    expect(post_rollback_history.versions[5].version).toBe(6);
    expect(post_rollback_history.versions[5].rollback_from_version).toBe(2);
    expect(post_rollback_history.versions[5].updated_at).toEqual(rollback_at);

    // v1へのロールバック実行
    const rollback_to_v1_at = new Date('2024-01-15T16:00:00Z');
    const rollback_to_v1_result = rollbackMonthlySummaryTemplate({
      template_id,
      target_version: 1,
      rollback_by: user_id,
      rollback_at: rollback_to_v1_at,
      rollback_reason: 'Restore original template configuration',
    });

    // ロールバック後、v1の内容が完全に復元
    expect(rollback_to_v1_result).toEqual({
      template_id,
      version: 7,
      template_name: 'Monthly Sales Summary Report',
      fields: [
        { field_id: 'f001', field_name: 'Total Revenue', display_order: 1 },
        { field_id: 'f002', field_name: 'Total Quota', display_order: 2 },
        { field_id: 'f003', field_name: 'Attainment Rate', display_order: 3 },
      ],
      format: 'json',
      created_by: user_id,
      created_at: created_at_v1,
      updated_by: user_id,
      updated_at: rollback_to_v1_at,
      rollback_from_version: 1,
      rollback_reason: 'Restore original template configuration',
    });

    // 複数回ロールバック後も完全な履歴が保持
    const final_history = getMonthlySummaryTemplateVersionHistory({
      template_id,
    });

    expect(final_history.versions.length).toBe(7);
    expect(final_history.versions[5].version).toBe(6);
    expect(final_history.versions[5].rollback_from_version).toBe(2);
    expect(final_history.versions[6].version).toBe(7);
    expect(final_history.versions[6].rollback_from_version).toBe(1);

    // 任意のバージョン（v3）へのロールバック確認
    const rollback_to_v3_at = new Date('2024-01-15T16:30:00Z');
    const rollback_to_v3_result = rollbackMonthlySummaryTemplate({
      template_id,
      target_version: 3,
      rollback_by: user_id,
      rollback_at: rollback_to_v3_at,
      rollback_reason: 'Switch back to Excel format with expanded fields',
    });

    expect(rollback_to_v3_result.version).toBe(8);
    expect(rollback_to_v3_result.fields.length).toBe(5);
    expect(rollback_to_v3_result.format).toBe('xlsx');
    expect(rollback_to_v3_result.rollback_from_version).toBe(3);

    // 最終的な履歴確認
    const final_complete_history = getMonthlySummaryTemplateVersionHistory({
      template_id,
    });

    expect(final_complete_history.versions.length).toBe(8);
    expect(final_complete_history.versions.map(v => v.version)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(final_complete_history.versions[5].rollback_from_version).toBe(2);
    expect(final_complete_history.versions[6].rollback_from_version).toBe(1);
    expect(final_complete_history.versions[7].rollback_from_version).toBe(3);
  });
});