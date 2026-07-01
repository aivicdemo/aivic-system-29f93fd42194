import { describe, test, expect, beforeEach } from "@jest/globals";
import {
  recordDocumentVersionHistory,
  getDocumentVersionHistories,
} from "../../src/logic/it-1781935279444-1-1-1";

describe("営業データ項目のメタデータ管理機能 - 契約書・提案資料バージョン履歴自動記録", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-768: [edge] 契約書・提案資料バージョン履歴自動記録機能 - 日時がシステム時刻の境界値（秒単位）で正確に記録される
  test("バージョン履歴のタイムスタンプが秒単位で正確に記録される - 秒の境界値を含む", () => {
    // Arrange
    const document_id_contract = "contract-2024-001";
    const document_id_proposal = "proposal-2024-001";
    const version_author_1 = "user-admin-001";
    const version_author_2 = "user-admin-002";

    const timestamp_59sec = new Date("2024-01-15T14:30:59.000Z");
    const timestamp_00sec = new Date("2024-01-15T14:31:00.000Z");
    const timestamp_01sec = new Date("2024-01-15T14:31:01.000Z");
    const timestamp_58sec = new Date("2024-01-15T14:31:58.000Z");

    const contract_version_input_1 = {
      document_id: document_id_contract,
      document_type: "contract",
      version_number: 1,
      change_content: "Initial version - contract terms defined",
      updated_by: version_author_1,
      recorded_at: timestamp_59sec,
    };

    const proposal_version_input_1 = {
      document_id: document_id_proposal,
      document_type: "proposal",
      version_number: 1,
      change_content: "Initial version - proposal created",
      updated_by: version_author_2,
      recorded_at: timestamp_00sec,
    };

    const contract_version_input_2 = {
      document_id: document_id_contract,
      document_type: "contract",
      version_number: 2,
      change_content: "Amendment - pricing updated",
      updated_by: version_author_1,
      recorded_at: timestamp_01sec,
    };

    const proposal_version_input_2 = {
      document_id: document_id_proposal,
      document_type: "proposal",
      version_number: 2,
      change_content: "Revision - scope expanded",
      updated_by: version_author_2,
      recorded_at: timestamp_58sec,
    };

    // Act - Record first contract version at 59 second boundary
    recordDocumentVersionHistory(contract_version_input_1);

    // Act - Record first proposal version at 00 second boundary (next minute)
    recordDocumentVersionHistory(proposal_version_input_1);

    // Act - Record second contract version at 01 second
    recordDocumentVersionHistory(contract_version_input_2);

    // Act - Record second proposal version at 58 second (previous minute)
    recordDocumentVersionHistory(proposal_version_input_2);

    // Act - Retrieve all version histories
    const contract_histories = getDocumentVersionHistories(document_id_contract);
    const proposal_histories = getDocumentVersionHistories(
      document_id_proposal
    );

    // Assert - Contract version history validation
    expect(contract_histories).toHaveLength(2);

    expect(contract_histories[0].document_id).toBe(document_id_contract);
    expect(contract_histories[0].version_number).toBe(1);
    expect(contract_histories[0].document_type).toBe("contract");
    expect(contract_histories[0].change_content).toBe(
      "Initial version - contract terms defined"
    );
    expect(contract_histories[0].updated_by).toBe(version_author_1);
    const recorded_at_1_timestamp = new Date(
      contract_histories[0].recorded_at
    ).getTime();
    const expected_timestamp_1 = timestamp_59sec.getTime();
    expect(Math.abs(recorded_at_1_timestamp - expected_timestamp_1)).toBeLessThanOrEqual(
      1000
    );
    expect(contract_histories[0].recorded_at).toBe(
      "2024-01-15T14:30:59.000Z"
    );

    expect(contract_histories[1].document_id).toBe(document_id_contract);
    expect(contract_histories[1].version_number).toBe(2);
    expect(contract_histories[1].document_type).toBe("contract");
    expect(contract_histories[1].change_content).toBe(
      "Amendment - pricing updated"
    );
    expect(contract_histories[1].updated_by).toBe(version_author_1);
    const recorded_at_2_timestamp = new Date(
      contract_histories[1].recorded_at
    ).getTime();
    const expected_timestamp_2 = timestamp_01sec.getTime();
    expect(Math.abs(recorded_at_2_timestamp - expected_timestamp_2)).toBeLessThanOrEqual(
      1000
    );
    expect(contract_histories[1].recorded_at).toBe(
      "2024-01-15T14:31:01.000Z"
    );

    // Assert - Proposal version history validation
    expect(proposal_histories).toHaveLength(2);

    expect(proposal_histories[0].document_id).toBe(document_id_proposal);
    expect(proposal_histories[0].version_number).toBe(1);
    expect(proposal_histories[0].document_type).toBe("proposal");
    expect(proposal_histories[0].change_content).toBe(
      "Initial version - proposal created"
    );
    expect(proposal_histories[0].updated_by).toBe(version_author_2);
    const proposal_recorded_at_1_timestamp = new Date(
      proposal_histories[0].recorded_at
    ).getTime();
    const proposal_expected_timestamp_1 = timestamp_00sec.getTime();
    expect(
      Math.abs(
        proposal_recorded_at_1_timestamp - proposal_expected_timestamp_1
      )
    ).toBeLessThanOrEqual(1000);
    expect(proposal_histories[0].recorded_at).toBe(
      "2024-01-15T14:31:00.000Z"
    );

    expect(proposal_histories[1].document_id).toBe(document_id_proposal);
    expect(proposal_histories[1].version_number).toBe(2);
    expect(proposal_histories[1].document_type).toBe("proposal");
    expect(proposal_histories[1].change_content).toBe(
      "Revision - scope expanded"
    );
    expect(proposal_histories[1].updated_by).toBe(version_author_2);
    const proposal_recorded_at_2_timestamp = new Date(
      proposal_histories[1].recorded_at
    ).getTime();
    const proposal_expected_timestamp_2 = timestamp_58sec.getTime();
    expect(
      Math.abs(
        proposal_recorded_at_2_timestamp - proposal_expected_timestamp_2
      )
    ).toBeLessThanOrEqual(1000);
    expect(proposal_histories[1].recorded_at).toBe(
      "2024-01-15T14:31:58.000Z"
    );

    // Assert - Chronological order validation across all histories
    const all_histories = [...contract_histories, ...proposal_histories];
    const sorted_by_timestamp = all_histories
      .map((h) => new Date(h.recorded_at).getTime())
      .sort((a, b) => a - b);

    expect(sorted_by_timestamp[0]).toBe(timestamp_59sec.getTime());
    expect(sorted_by_timestamp[1]).toBe(timestamp_58sec.getTime());
    expect(sorted_by_timestamp[2]).toBe(timestamp_00sec.getTime());
    expect(sorted_by_timestamp[3]).toBe(timestamp_01sec.getTime());

    // Assert - Timestamp precision and boundary value handling
    for (let i = 0; i < all_histories.length; i++) {
      const history_timestamp = all_histories[i].recorded_at;
      expect(history_timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);

      const parsed_date = new Date(history_timestamp);
      expect(parsed_date.getMilliseconds()).toBe(0);
    }

    // Assert - Verify all version numbers are correctly recorded
    expect(contract_histories.map((h) => h.version_number)).toEqual([1, 2]);
    expect(proposal_histories.map((h) => h.version_number)).toEqual([1, 2]);

    // Assert - Verify no data loss or corruption
    expect(contract_histories.every((h) => h.document_id === document_id_contract)).toBe(
      true
    );
    expect(proposal_histories.every((h) => h.document_id === document_id_proposal)).toBe(
      true
    );
    expect(contract_histories.every((h) => h.document_type === "contract")).toBe(
      true
    );
    expect(proposal_histories.every((h) => h.document_type === "proposal")).toBe(
      true
    );
  });
});