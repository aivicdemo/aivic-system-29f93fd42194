import { validateEstimateFileFormat } from "../../src/logic/it-1-br-2-2-2-1";

describe("査定員ごとの判定結果と根拠の月次集計・分析ダッシュボード", () => {
  // SCEN-715
  test("見積書ファイル形式・サイズ検証 - 非対応形式（EXE等）のファイルアップロードが拒否される", () => {
    const unsupported_file_name = "test.exe";
    const unsupported_file_type = "application/x-msdownload";
    const unsupported_file_size_bytes = 1048576;

    expect(() =>
      validateEstimateFileFormat(
        unsupported_file_name,
        unsupported_file_type,
        unsupported_file_size_bytes
      )
    ).toThrow(/ファイル形式/);
  });
});