import { describe, test, expect } from '@jest/globals';
import { determineLatestVersionByPriority } from '../../src/logic/it-1781935279444-1-1-1';

describe('営業データ項目メタデータ管理 - 複数バージョン存在時の優先度ルール適用機能', () => {
  test('SCEN-795: 同一案件に対して複数の有効なバージョンが存在する場合、優先度ルールに基づいて唯一の最新版が特定される', () => {
    // テストケース1: バージョンA(優先度1), バージョンB(優先度2), バージョンC(優先度3) - バージョンAが最新版として特定されるべき
    const versions_pattern1 = [
      {
        versionId: 'version-a-001',
        proposalId: 'proposal-123',
        versionNumber: 'A',
        priority: 1,
        effectiveFrom: new Date('2024-01-01T00:00:00Z'),
        effectiveTo: new Date('2024-12-31T23:59:59Z'),
        isActive: true
      },
      {
        versionId: 'version-b-002',
        proposalId: 'proposal-123',
        versionNumber: 'B',
        priority: 2,
        effectiveFrom: new Date('2024-01-01T00:00:00Z'),
        effectiveTo: new Date('2024-12-31T23:59:59Z'),
        isActive: true
      },
      {
        versionId: 'version-c-003',
        proposalId: 'proposal-123',
        versionNumber: 'C',
        priority: 3,
        effectiveFrom: new Date('2024-01-01T00:00:00Z'),
        effectiveTo: new Date('2024-12-31T23:59:59Z'),
        isActive: true
      }
    ];

    const result_pattern1 = determineLatestVersionByPriority(versions_pattern1, 'proposal-123');
    expect(result_pattern1).toEqual({
      versionId: 'version-a-001',
      versionNumber: 'A',
      priority: 1
    });

    // テストケース2: 優先度パターン変更 - バージョンC(優先度1), バージョンB(優先度2), バージョンA(優先度3) - バージョンCが最新版として特定されるべき
    const versions_pattern2 = [
      {
        versionId: 'version-a-001',
        proposalId: 'proposal-456',
        versionNumber: 'A',
        priority: 3,
        effectiveFrom: new Date('2024-01-01T00:00:00Z'),
        effectiveTo: new Date('2024-12-31T23:59:59Z'),
        isActive: true
      },
      {
        versionId: 'version-b-002',
        proposalId: 'proposal-456',
        versionNumber: 'B',
        priority: 2,
        effectiveFrom: new Date('2024-01-01T00:00:00Z'),
        effectiveTo: new Date('2024-12-31T23:59:59Z'),
        isActive: true
      },
      {
        versionId: 'version-c-003',
        proposalId: 'proposal-456',
        versionNumber: 'C',
        priority: 1,
        effectiveFrom: new Date('2024-01-01T00:00:00Z'),
        effectiveTo: new Date('2024-12-31T23:59:59Z'),
        isActive: true
      }
    ];

    const result_pattern2 = determineLatestVersionByPriority(versions_pattern2, 'proposal-456');
    expect(result_pattern2).toEqual({
      versionId: 'version-c-003',
      versionNumber: 'C',
      priority: 1
    });

    // テストケース3: 非アクティブなバージョンを除外 - アクティブなバージョンのみから最新版を特定
    const versions_pattern3 = [
      {
        versionId: 'version-a-001',
        proposalId: 'proposal-789',
        versionNumber: 'A',
        priority: 1,
        effectiveFrom: new Date('2024-01-01T00:00:00Z'),
        effectiveTo: new Date('2024-12-31T23:59:59Z'),
        isActive: false
      },
      {
        versionId: 'version-b-002',
        proposalId: 'proposal-789',
        versionNumber: 'B',
        priority: 2,
        effectiveFrom: new Date('2024-01-01T00:00:00Z'),
        effectiveTo: new Date('2024-12-31T23:59:59Z'),
        isActive: true
      },
      {
        versionId: 'version-c-003',
        proposalId: 'proposal-789',
        versionNumber: 'C',
        priority: 3,
        effectiveFrom: new Date('2024-01-01T00:00:00Z'),
        effectiveTo: new Date('2024-12-31T23:59:59Z'),
        isActive: true
      }
    ];

    const result_pattern3 = determineLatestVersionByPriority(versions_pattern3, 'proposal-789');
    expect(result_pattern3).toEqual({
      versionId: 'version-b-002',
      versionNumber: 'B',
      priority: 2
    });

    // テストケース4: 複数バージョンが同一優先度の場合、エラーを検出
    const versions_pattern4 = [
      {
        versionId: 'version-a-001',
        proposalId: 'proposal-error-1',
        versionNumber: 'A',
        priority: 1,
        effectiveFrom: new Date('2024-01-01T00:00:00Z'),
        effectiveTo: new Date('2024-12-31T23:59:59Z'),
        isActive: true
      },
      {
        versionId: 'version-b-002',
        proposalId: 'proposal-error-1',
        versionNumber: 'B',
        priority: 1,
        effectiveFrom: new Date('2024-01-01T00:00:00Z'),
        effectiveTo: new Date('2024-12-31T23:59:59Z'),
        isActive: true
      }
    ];

    expect(() => {
      determineLatestVersionByPriority(versions_pattern4, 'proposal-error-1');
    }).toThrow(/優先度/);

    // テストケース5: バージョンが存在しない場合、エラーを検出
    const versions_pattern5: any[] = [];

    expect(() => {
      determineLatestVersionByPriority(versions_pattern5, 'proposal-not-found');
    }).toThrow(/バージョン/);

    // テストケース6: 複合優先度シナリオ - バージョンB(優先度1), バージョンD(優先度1.5), バージョンA(優先度2) - バージョンBが最新版として特定されるべき
    const versions_pattern6 = [
      {
        versionId: 'version-a-001',
        proposalId: 'proposal-complex',
        versionNumber: 'A',
        priority: 2,
        effectiveFrom: new Date('2024-01-01T00:00:00Z'),
        effectiveTo: new Date('2024-12-31T23:59:59Z'),
        isActive: true
      },
      {
        versionId: 'version-b-002',
        proposalId: 'proposal-complex',
        versionNumber: 'B',
        priority: 1,
        effectiveFrom: new Date('2024-01-01T00:00:00Z'),
        effectiveTo: new Date('2024-12-31T23:59:59Z'),
        isActive: true
      },
      {
        versionId: 'version-d-004',
        proposalId: 'proposal-complex',
        versionNumber: 'D',
        priority: 1.5,
        effectiveFrom: new Date('2024-01-01T00:00:00Z'),
        effectiveTo: new Date('2024-12-31T23:59:59Z'),
        isActive: true
      }
    ];

    const result_pattern6 = determineLatestVersionByPriority(versions_pattern6, 'proposal-complex');
    expect(result_pattern6).toEqual({
      versionId: 'version-b-002',
      versionNumber: 'B',
      priority: 1
    });
  });
});