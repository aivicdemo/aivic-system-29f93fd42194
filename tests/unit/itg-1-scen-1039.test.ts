import { describe, test, expect, beforeEach } from '@jest/globals';
import {
  defineMetadata,
  retrieveMetadata,
  updateMetadata,
  listMetadata,
} from '../../src/logic/it-1781935279444-1-1-1';

describe('営業データ項目のメタデータ管理', () => {
  // SCEN-1039
  test('営業データ項目のメタデータ一元管理 - 新規作成・参照・編集・複数ユーザーアクセス', () => {
    // ========== Phase 1: 新規営業データ項目メタデータの作成 ==========
    const createInput = {
      itemName: '販売数量',
      unit: '個',
      dataType: 'numeric',
      calculationLogic: '売上単価 × 販売数量',
      createdBy: 'user001',
      createdAt: new Date('2024-01-15T09:00:00Z'),
    };

    const createResult = defineMetadata(createInput);

    expect(createResult).toBeDefined();
    expect(createResult.metadataId).toBeDefined();
    expect(createResult.itemName).toBe('販売数量');
    expect(createResult.unit).toBe('個');
    expect(createResult.dataType).toBe('numeric');
    expect(createResult.calculationLogic).toBe('売上単価 × 販売数量');
    expect(createResult.status).toBe('active');
    expect(createResult.createdBy).toBe('user001');

    const metadataId = createResult.metadataId;

    // ========== Phase 2: メタデータの詳細参照 ==========
    const retrieveResult = retrieveMetadata({
      metadataId: metadataId,
      accessedBy: 'user001',
    });

    expect(retrieveResult).toBeDefined();
    expect(retrieveResult.metadataId).toBe(metadataId);
    expect(retrieveResult.itemName).toBe('販売数量');
    expect(retrieveResult.unit).toBe('個');
    expect(retrieveResult.dataType).toBe('numeric');
    expect(retrieveResult.calculationLogic).toBe('売上単価 × 販売数量');
    expect(retrieveResult.isAccessible).toBe(true);

    // ========== Phase 3: 別ユーザーアカウントからのアクセス確認 ==========
    const retrieveByAnotherUserResult = retrieveMetadata({
      metadataId: metadataId,
      accessedBy: 'user002',
    });

    expect(retrieveByAnotherUserResult).toBeDefined();
    expect(retrieveByAnotherUserResult.metadataId).toBe(metadataId);
    expect(retrieveByAnotherUserResult.itemName).toBe('販売数量');
    expect(retrieveByAnotherUserResult.isAccessible).toBe(true);

    // ========== Phase 4: メタデータ一覧の検索 ==========
    const listResult = listMetadata({
      searchKeyword: '販売数量',
      pageSize: 10,
      pageNumber: 1,
    });

    expect(listResult).toBeDefined();
    expect(Array.isArray(listResult.items)).toBe(true);
    expect(listResult.items.length).toBeGreaterThan(0);

    const foundItem = listResult.items.find((item) => item.metadataId === metadataId);
    expect(foundItem).toBeDefined();
    expect(foundItem?.itemName).toBe('販売数量');
    expect(foundItem?.dataType).toBe('numeric');

    // ========== Phase 5: メタデータの編集・更新 ==========
    const updateInput = {
      metadataId: metadataId,
      itemName: '販売数量（改訂版）',
      unit: '個',
      dataType: 'numeric',
      calculationLogic: '実単価 × 販売数量 × (1 - 割引率)',
      updatedBy: 'user001',
      updatedAt: new Date('2024-01-15T10:30:00Z'),
    };

    const updateResult = updateMetadata(updateInput);

    expect(updateResult).toBeDefined();
    expect(updateResult.metadataId).toBe(metadataId);
    expect(updateResult.itemName).toBe('販売数量（改訂版）');
    expect(updateResult.calculationLogic).toBe('実単価 × 販売数量 × (1 - 割引率)');
    expect(updateResult.updatedBy).toBe('user001');
    expect(updateResult.updateStatus).toBe('success');

    // ========== Phase 6: 更新内容の反映確認 ==========
    const retrieveUpdatedResult = retrieveMetadata({
      metadataId: metadataId,
      accessedBy: 'user001',
    });

    expect(retrieveUpdatedResult).toBeDefined();
    expect(retrieveUpdatedResult.itemName).toBe('販売数量（改訂版）');
    expect(retrieveUpdatedResult.calculationLogic).toBe(
      '実単価 × 販売数量 × (1 - 割引率)'
    );

    // ========== Phase 7: 別ユーザーからも更新内容が参照可能であることを確認 ==========
    const retrieveUpdatedByAnotherUserResult = retrieveMetadata({
      metadataId: metadataId,
      accessedBy: 'user003',
    });

    expect(retrieveUpdatedByAnotherUserResult).toBeDefined();
    expect(retrieveUpdatedByAnotherUserResult.itemName).toBe('販売数量（改訂版）');
    expect(retrieveUpdatedByAnotherUserResult.calculationLogic).toBe(
      '実単価 × 販売数量 × (1 - 割引率)'
    );
    expect(retrieveUpdatedByAnotherUserResult.isAccessible).toBe(true);
  });
});