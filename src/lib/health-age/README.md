# 健康年齢 MVP：医学モデルと実装仕様

## 調査した既存構成

Next.js **16.3.4**（インストール済み実体）、App Router、React 19、TypeScript。
`src/components/lifit-app.tsx` がホーム・入力導線・マイページを管理し、`entry-flow.tsx` が入力、`history-view.tsx` が履歴を担当。
独自CSS（`globals.css` の緑・生成り色、card/pill/form-grid）とTailwind CSS 4、Lucide、Radix Dialog、Rechartsを使用。
`HealthCheck.metrics` は `Partial<Record<MetricId, number>>`。既存fixtureは `mock-data.ts`。
React useState/useEffectとlocalStorage（version 1）で保存し、API・Server Actions・医療DBは未接続。
本機能もブラウザ内の純粋計算で完結する。計算結果自体は永続化せず、入力スナップショットから再計算する。

## 出典と採用モデル

Takanori Honda, Sanmei Chen, Jun Hata, Daigo Yoshida, Yoichiro Hirakawa, Yoshihiko Furuta,
Mao Shibata, Satoko Sakata, Takanari Kitazono, Toshiharu Ninomiya.
**Development and Validation of a Risk Prediction Model for Atherosclerotic Cardiovascular Disease in Japanese Adults: The Hisayama Study.**
2021年1月22日オンライン公開、2022年 J Atheroscler Thromb 29(3):345–361。

- [原著全文・Table 2・Supplemental Table 1/3](https://www.jstage.jst.go.jp/article/jat/29/3/29_61960/_html/-char/en)
- DOI: [10.5551/jat.61960](https://doi.org/10.5551/jat.61960)、[PubMed 33487620](https://pubmed.ncbi.nlm.nih.gov/33487620/)
- [2023年訂正記事](https://doi.org/10.5551/jat.ER61960)：Fig.1の簡易スコアリスク表を訂正。連続モデルのTable 2係数・本文の式は訂正対象ではない。
- 実装識別子：`hisayama-2021-ldl-continuous-published-v1`。今回指定された2021年公表モデルの**LDL連続値版のみ**を採用。non-HDL版・他モデルとのルーティングは未実装。

対象：1988年の久山町一般住民、40〜84歳、冠動脈疾患および**すべての虚血性・出血性脳卒中の既往なし**、2,454人。
10年間の初回ASCVD（冠動脈疾患またはアテローム血栓性脳梗塞）を予測する。全脳卒中や心血管死亡単独ではない。
冠動脈疾患には急性/無症候性心筋梗塞、急性症状発現1時間以内の突然心臓死、冠動脈形成術、CABGが含まれる。
追跡期間中央値24年。原著の検証は同一コホートでの識別・較正と200回bootstrap内部検証であり、健康年齢への変換を検証した研究ではない。
C統計量0.786、optimism補正後0.776、GND較正検定P=0.29。

## 変数定義・数式

```text
LP = 0.077*age + 0.984*male + 0.010*SBP
     + 0.459*diabetes - 0.012*HDL + 0.005*LDL
     + 0.632*proteinuria + 0.336*currentSmoking
     + 0.339*noRegularExercise
R10 = 1 - 0.9696 ^ exp(LP - 6.7963)
```

年齢は歳、SBPはmmHg、LDL/HDLはmg/dL、二値項目は0/1。
基準生存確率は競合死亡を考慮した `S0(10)CR=0.9696`。通常の生存率0.9688と取り違えない。
Table 2と本文に公表された丸め済み係数をそのまま使用。交互作用・対数変換・治療別係数・HbA1c項は最終式にない。
計算は数値安定性のため `-expm1(log(0.9696)*exp(LP-6.7963))`。

- SBP：5分以上安静後、右上腕座位3回測定の平均。
- LDL：原著は空腹時脂質からFriedewald式で推定。今回は健診票のLDLを入力し、測定方式の一致までは検証しない。
- 糖尿病：空腹時血糖7.0 mmol/L以上、随時/75g負荷2時間血糖11.1 mmol/L以上、または糖尿病薬使用。HbA1c単独・空腹時血糖正常のみで糖尿病なしを決めない。明示的な問診回答を使用。
- 蛋白尿：試験紙1+以上。陰性/±はなし、未測定は不明。
- 喫煙：現在毎日1本以上を習慣的に喫煙。
- 定期的運動：余暇のスポーツなどを週3回以上。既存の一般的な「週3日以上」回答からは自動変換しない。

連続モデルには年齢/SBP/脂質のカテゴリ化を加えない。簡易スコアのカテゴリは年齢40–49/50–59/60–69/70–79/80–84、SBP <120/120–129/130–139/140–159/≥160、HDL ≥60/40–59/<40、LDL <120/120–139/140–159/≥160。
カテゴリ代表値は基準人物の定義とテストの参考照合にのみ利用する。

## Reference profileと年齢探索

`referenceProfile.ts` に不変の定数を集約。

| 項目                 | 値         | 根拠                                            |
| -------------------- | ---------- | ----------------------------------------------- |
| SBP                  | 110 mmHg   | 補足表3の<120群のassigned reference value       |
| LDL                  | 100 mg/dL  | 同表の<120群のassigned reference value          |
| HDL                  | 65 mg/dL   | 同表の≥60群のassigned reference value           |
| 糖尿病・蛋白尿・喫煙 | なし       | 原著の低リスクレベル                            |
| 定期的運動           | あり       | 原著の低リスク（0点）レベル                     |
| 性別                 | 本人と同じ | Lifitの年齢換算仕様。性別差を年齢差へ転嫁しない |

これらは治療目標ではない。原著が定義・検証した「健康年齢基準人物」ではなく、原著の低リスク値を組み合わせたLifitの参考表示用プロフィール。

```text
risk = model(patient)
healthAge = argmin a in {40, 41, ..., 84} |model(reference + patient.sex + a) - risk|
ageDifference = healthAge - patient.age
```

同距離は若い年齢を採用。範囲外リスクは境界年齢と `below/above` を返し、UIは「40歳未満」「84歳超」と表記する。
境界を正確な等価年齢と扱わず、年齢差を非表示にし、外挿もしない。
年齢換算・欠損範囲は独自のMVP仕様で臨床妥当性未検証。生物学的年齢や余命を意味しない。

## 適用ゲートと欠損処理

- **complete**：9予測変数が揃い、適用条件も確認できる。
- **provisional**：適用条件、年齢・性別・SBP・LDL・HDLは揃い、糖尿病/蛋白尿/喫煙/運動のいずれかが不明。欠損二値の全組み合わせ（最大16）を計算してリスクと等価年齢の最小〜最大範囲を返す。正常補完・平均値代入・中央値の点推定はしない。`healthAge/estimatedRisk/ageDifference` はnull、`healthAgeRange/riskRange`に範囲を格納する。
- **unavailable**：重大な欠損、適用条件不明/不成立、または不正値。年齢を表示しない。

暫定範囲は二値の欠損による感度分析であり、医学的に検証された補完モデル・確率分布・信頼区間ではない。未知の状態を正常と断定しないための保守的な実装規則。
`missingFields` は未回答/null、`invalidFields` は非有限値・不正な型・フォームの入力範囲外を別々に返す。
SBP 40–300、LDL 1–600、HDL 1–200は既存フォームの誤入力防止限界であり、研究がこの全範囲を検証した意味ではない。

適用ゲートは40〜84歳、男性/女性としてのモデル入力、日本人集団、CVD既往なしを要求する。既往が不明でも無条件に通さない。
原著の空腹時LDLモデルに合わせ、空腹時確認と中性脂肪<400 mg/dLをMVPの適用条件に追加した。中性脂肪は回帰式の変数ではなく検査条件確認用。
非空腹時/TG≥400に推奨される別モデルへは切り替えない。
`eligible=false` は対象外または適用を確認できない状態。対象条件が揃っていてSBP等だけ欠ける場合は `eligible=true, unavailable` になる。

## 保存・UI・デバッグ

`HealthCheck.healthAgeContext` は健診時の年齢・性別・問診を保持するoptional追加フィールド。
検査値は従来の `metrics` をそのまま使用。後のプロフィール更新は過去の健康年齢入力を書き換えない。
旧localStorageは移行で医学的事実を付与しない。健康年齢欄から新しい健診・追加情報を入力できる。既存健診の編集機能は追加していないため、追加導線では検査値も入力が必要。
最新日付（同日は最後に追加した健診）のカードをホームに表示。
完全・暫定範囲・不足項目・対象外・境界を表示し、折りたたみ説明にリスクと基準値を掲載。
開発用detailsは `NODE_ENV === development` のみ。productionでは入力・モデルversionのデバッグJSONをレンダリングしない。

既存デモの検査値は変更しない。新規初期状態の最新健診に**明示的な架空の問診fixture**を追加し、Aは蛋白尿欠損、Bはcomplete、Cは36歳で対象外。
既存保存済みデモには後付けで事実を付与しない。独立した低/中/高/欠損fixtureは `fixtures.ts`。

## 検証・制限・今後

`tests/health-age.test.ts`：公表係数・競合死亡の生存率、本文式への独立代入、訂正Fig.1の0点チャートとの概略比較（連続モデルと整数スコアは別なので0.3 percentage points以内）、男女40〜84歳の基準一致、各危険因子の方向、改善、範囲端、全欠損項目、適用ゲート、不正値、最小距離探索、保存互換性を検証。

実行：`npm test`。tsx CLIのIPCが制限される環境は `node --import tsx --test tests/*.test.ts` で同じテストを実行可能。

原著の丸め係数から再現できる式の実装であり、著者の非公開の高精度係数や個人データとの完全一致は保証しない。
単一地域の歴史的コホートからのリスク推定をそのまま利用し、現在の個人向けに再較正していない。
採血法・問診の自己申告に依存し、家族性高コレステロール血症、治療効果、極端な検査値の個別評価は実装していない。
健康年齢改善は因果的な介入効果や寿命延長の予測ではない。医学監修・臨床利用の検証は未実施。

将来候補（未実装）：医学監修による基準/入力条件の見直し、時点と測定方法を含む医療データ連携、要因説明、CKD/糖尿病/frailty/biological ageモデル、Jev routing。
`HealthAgeModel` と純粋な年齢探索は置換可能だが、適用・欠損ルールは本MVPのHisayama専用。別モデル追加時はそのモデルの検証条件を別途定義する必要がある。

## 今回の変更ファイル一覧

| ファイル（リポジトリルートから）         | 変更内容                                     |
| ---------------------------------------- | -------------------------------------------- |
| `src/lib/health-age/types.ts`            | 入力・結果・探索境界・モデルinterfaceの型    |
| `src/lib/health-age/hisayama.ts`         | 原著連続式、公表係数、入力検証               |
| `src/lib/health-age/healthAge.ts`        | 適用ゲート、欠損範囲、等価年齢探索           |
| `src/lib/health-age/referenceProfile.ts` | 根拠付きの基準人物定数                       |
| `src/lib/health-age/adapter.ts`          | 既存健診から計算入力への変換                 |
| `src/lib/health-age/fixtures.ts`         | 低・中・高リスクと欠損のfixture              |
| `src/lib/health-age/README.md`           | 医学的出典・実装仕様・制限・検証報告         |
| `src/components/health-age-card.tsx`     | 完全・暫定・対象外表示と説明、開発時デバッグ |
| `src/components/health-age-fields.tsx`   | 研究定義を明記した未回答対応の問診欄         |
| `src/components/entry-flow.tsx`          | 追加情報入力と健診時点スナップショット保存   |
| `src/components/lifit-app.tsx`           | 既存ホームへの健康年齢カード統合             |
| `src/app/globals.css`                    | 既存配色を使うカード・補足表示スタイル       |
| `src/lib/types.ts`                       | 互換性を保つ健診コンテキスト型追加           |
| `src/lib/storage.ts`                     | 新規保存フィールドの型検証                   |
| `src/lib/mock-data.ts`                   | 既存数値を保持して最新デモ健診に架空問診追加 |
| `tests/health-age.test.ts`               | モデル照合・探索・欠損・適用条件等の18テスト |
| `README.md`                              | 実装済み機能と本仕様への導線を追加           |

## 実行結果（2026-09-20）

- `node --import tsx --test tests/*.test.ts`：**25/25成功**（本機能18、既存7）。`npm test` のtsx CLIはこの実行環境のIPC制限により起動不可のため、同じtsxローダー/テストを直接実行。
- `npm run typecheck`：成功。
- `npm run build`：成功。既存action-guidesを含む11ページを生成。
- ブラウザ：旧保存データの不足案内、追加問診→保存→再読み込み、蛋白尿欠損の57〜65歳、基準入力44歳/差0歳を確認。
- 本番ブラウザ：デモAの暫定57〜65歳、Bの62歳/差+9歳、Cの36歳対象外、開発デバッグ非表示を確認。
- 390pxで入力欄とカード、1440pxでホームを確認。確認した画面で横はみ出しなし、ブラウザのerror/warnログなし。
- これらは実装の検証であり、医学的妥当性・臨床効果の検証ではない。
