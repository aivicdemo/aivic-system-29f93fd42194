import { describe, test, expect, beforeEach } from '@jest/globals';
import { extractContractDifference } from '../../src/logic/it-1781935279444-2-1-1';

describe('Contract Change Comparison and Difference Visualization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-839
  test('should throw error when past contract version does not exist', () => {
    const input = {
      contractId: 'CONTRACT_001',
      currentVersion: 2,
      pastVersions: []
    };

    expect(() => extractContractDifference(input)).toThrow(/契約バージョン/);
  });
});