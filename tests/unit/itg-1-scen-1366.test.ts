import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { confirmSpecification } from '../../src/logic/it-1781935279444-2-1-1';

describe('営業データ標準化仕様書確定機能', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1366
  it('品質検証ルール件数が0件の場合、警告メッセージが表示されるが処理は中断されず、仕様書は正常に確定される', () => {
    const specification_id = 'spec_001';
    const specification_name = '営業データ標準化仕様書_202406';
    const mapping_rules_count = 5;
    const validation_rules_count = 0;
    const checklist_items_count = 8;
    const created_by = 'user_001';
    const created_at = new Date('2024-06-15T10:00:00Z');
    const status_before = 'draft';

    const result = confirmSpecification({
      specification_id,
      specification_name,
      mapping_rules_count,
      validation_rules_count,
      checklist_items_count,
      created_by,
      created_at,
      status_before,
    });

    expect(result.has_warning).toBe(true);
    expect(result.warning_message).toMatch(/品質検証ルール/);
    expect(result.is_processing_continued).toBe(true);
    expect(result.is_completed).toBe(true);
    expect(result.status_after).toBe('confirmed');
    expect(result.specification_id).toBe(specification_id);
    expect(result.confirmed_at).toBeDefined();
    expect(typeof result.confirmed_at).toBe('string');
  });
});