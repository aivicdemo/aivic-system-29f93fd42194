import { sendProductionProgressReport } from '../../src/logic/it-1-br-1-2-1';

describe("作業完了実績の登録と次工程引き継ぎ情報の記録機能", () => {
  test("実績データ送信機能 - 実績データに必須項目の欠損がある場合、送信処理がエラーになる", () => {
    // SCEN-392
    
    // 必須項目の一部が欠損している実績データ（作業指示書IDが未入力）
    expect(() => 
      sendProductionProgressReport(
        "",  // workOrderId: 空文字（必須項目欠損）
        100,  // actualQuantity
        "合格",  // qualityStatus
        "W001",  // workerId
        new Date("2024-01-15T14:30:00Z"),  // completionTime
        "次工程への引き継ぎ事項です"  // remarks
      )
    ).toThrow(/必須項目/);

    // 品質状況が未入力の場合
    expect(() => 
      sendProductionProgressReport(
        "WO12345",  // workOrderId
        100,  // actualQuantity
        "",  // qualityStatus: 空文字（必須項目欠損）
        "W001",  // workerId
        new Date("2024-01-15T14:30:00Z"),  // completionTime
        "次工程への引き継ぎ事項です"  // remarks
      )
    ).toThrow(/品質状況/);

    // 作業員IDが未入力の場合
    expect(() => 
      sendProductionProgressReport(
        "WO12345",  // workOrderId
        100,  // actualQuantity
        "合格",  // qualityStatus
        "",  // workerId: 空文字（必須項目欠損）
        new Date("2024-01-15T14:30:00Z"),  // completionTime
        "次工程への引き継ぎ事項です"  // remarks
      )
    ).toThrow(/作業員/);

    // 完了時刻が未来日時の場合
    expect(() => 
      sendProductionProgressReport(
        "WO12345",  // workOrderId
        100,  // actualQuantity
        "合格",  // qualityStatus
        "W001",  // workerId
        new Date("2025-12-31T14:30:00Z"),  // completionTime: 未来日時
        "次工程への引き継ぎ事項です"  // remarks
      )
    ).toThrow(/完了時刻/);

    // 実績数量が0以下の場合
    expect(() => 
      sendProductionProgressReport(
        "WO12345",  // workOrderId
        0,  // actualQuantity: 0以下（必須項目不正）
        "合格",  // qualityStatus
        "W001",  // workerId
        new Date("2024-01-15T14:30:00Z"),  // completionTime
        "次工程への引き継ぎ事項です"  // remarks
      )
    ).toThrow(/実績数量/);
  });
});