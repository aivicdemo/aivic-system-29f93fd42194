import { describe, test, expect, beforeEach } from '@jest/globals';
import { getLatestProposalMaterialVersion } from '../../src/logic/it-1-1-1';

describe('契約・成果物情報の時系列統合表示機能 - 提案資料バージョン管理', () => {
  // SCEN-846: 提案資料のバージョンが複数存在するときに最新版のみが正しく表示される
  test('should display only the latest version of proposal material when multiple versions exist', () => {
    const contract_id = 'CONT-2024-001';
    const proposal_materials = [
      {
        proposal_material_id: 'PM-001-v1',
        contract_id: contract_id,
        version: 1,
        file_name: 'proposal_v1.pdf',
        created_at: new Date('2024-01-10T09:00:00Z'),
        updated_at: new Date('2024-01-10T09:00:00Z'),
        is_active: false,
      },
      {
        proposal_material_id: 'PM-001-v2',
        contract_id: contract_id,
        version: 2,
        file_name: 'proposal_v2.pdf',
        created_at: new Date('2024-01-15T14:30:00Z'),
        updated_at: new Date('2024-01-15T14:30:00Z'),
        is_active: false,
      },
      {
        proposal_material_id: 'PM-001-v3',
        contract_id: contract_id,
        version: 3,
        file_name: 'proposal_v3_latest.pdf',
        created_at: new Date('2024-01-20T11:15:00Z'),
        updated_at: new Date('2024-01-20T11:15:00Z'),
        is_active: true,
      },
    ];

    const result = getLatestProposalMaterialVersion({
      contract_id: contract_id,
      proposal_materials: proposal_materials,
    });

    expect(result).toEqual({
      proposal_material_id: 'PM-001-v3',
      contract_id: contract_id,
      version: 3,
      file_name: 'proposal_v3_latest.pdf',
      created_at: new Date('2024-01-20T11:15:00Z'),
      updated_at: new Date('2024-01-20T11:15:00Z'),
      is_active: true,
    });

    expect(result.version).toBe(3);
    expect(result.file_name).toBe('proposal_v3_latest.pdf');
    expect(result.updated_at.toISOString()).toBe('2024-01-20T11:15:00.000Z');
    expect(result.is_active).toBe(true);
  });

  test('should exclude outdated versions from timeline display when multiple versions exist', () => {
    const contract_id = 'CONT-2024-002';
    const proposal_materials = [
      {
        proposal_material_id: 'PM-002-v1',
        contract_id: contract_id,
        version: 1,
        file_name: 'proposal_old_v1.pdf',
        created_at: new Date('2024-01-05T08:00:00Z'),
        updated_at: new Date('2024-01-05T08:00:00Z'),
        is_active: false,
      },
      {
        proposal_material_id: 'PM-002-v2',
        contract_id: contract_id,
        version: 2,
        file_name: 'proposal_old_v2.pdf',
        created_at: new Date('2024-01-12T10:30:00Z'),
        updated_at: new Date('2024-01-12T10:30:00Z'),
        is_active: false,
      },
      {
        proposal_material_id: 'PM-002-v3',
        contract_id: contract_id,
        version: 3,
        file_name: 'proposal_current.pdf',
        created_at: new Date('2024-01-25T15:45:00Z'),
        updated_at: new Date('2024-01-25T15:45:00Z'),
        is_active: true,
      },
    ];

    const result = getLatestProposalMaterialVersion({
      contract_id: contract_id,
      proposal_materials: proposal_materials,
    });

    expect(result.proposal_material_id).toBe('PM-002-v3');
    expect(result.version).toBe(3);
    expect(result.is_active).toBe(true);
    expect(result.updated_at.getTime()).toBeGreaterThan(
      proposal_materials[1].updated_at.getTime()
    );
  });

  test('should return single proposal material when only one version exists', () => {
    const contract_id = 'CONT-2024-003';
    const proposal_materials = [
      {
        proposal_material_id: 'PM-003-v1',
        contract_id: contract_id,
        version: 1,
        file_name: 'proposal_single.pdf',
        created_at: new Date('2024-01-18T13:20:00Z'),
        updated_at: new Date('2024-01-18T13:20:00Z'),
        is_active: true,
      },
    ];

    const result = getLatestProposalMaterialVersion({
      contract_id: contract_id,
      proposal_materials: proposal_materials,
    });

    expect(result.version).toBe(1);
    expect(result.file_name).toBe('proposal_single.pdf');
    expect(result.is_active).toBe(true);
  });

  test('should throw error when proposal materials list is empty', () => {
    const contract_id = 'CONT-2024-004';
    const proposal_materials: any[] = [];

    expect(() =>
      getLatestProposalMaterialVersion({
        contract_id: contract_id,
        proposal_materials: proposal_materials,
      })
    ).toThrow(/提案資料/);
  });

  test('should throw error when contract_id is empty or null', () => {
    const proposal_materials = [
      {
        proposal_material_id: 'PM-005-v1',
        contract_id: 'CONT-2024-005',
        version: 1,
        file_name: 'proposal.pdf',
        created_at: new Date('2024-01-20T10:00:00Z'),
        updated_at: new Date('2024-01-20T10:00:00Z'),
        is_active: true,
      },
    ];

    expect(() =>
      getLatestProposalMaterialVersion({
        contract_id: '',
        proposal_materials: proposal_materials,
      })
    ).toThrow(/契約/);
  });

  test('should identify latest version by updated_at timestamp when versions have same version number', () => {
    const contract_id = 'CONT-2024-006';
    const proposal_materials = [
      {
        proposal_material_id: 'PM-006-v2-old',
        contract_id: contract_id,
        version: 2,
        file_name: 'proposal_v2_old.pdf',
        created_at: new Date('2024-01-10T08:00:00Z'),
        updated_at: new Date('2024-01-10T08:00:00Z'),
        is_active: false,
      },
      {
        proposal_material_id: 'PM-006-v2-new',
        contract_id: contract_id,
        version: 2,
        file_name: 'proposal_v2_new.pdf',
        created_at: new Date('2024-01-10T08:00:00Z'),
        updated_at: new Date('2024-01-22T16:30:00Z'),
        is_active: true,
      },
    ];

    const result = getLatestProposalMaterialVersion({
      contract_id: contract_id,
      proposal_materials: proposal_materials,
    });

    expect(result.proposal_material_id).toBe('PM-006-v2-new');
    expect(result.updated_at.toISOString()).toBe('2024-01-22T16:30:00.000Z');
  });
});