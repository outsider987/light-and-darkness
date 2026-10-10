# Light and Darkness — 光明與黑暗

**SEGA Mega Drive《光明與黑暗 續戰篇》(Shining Force, 1992) 的完整瀏覽器重製版。**
TypeScript + Canvas，零執行期依賴，所有圖像與音樂都由程式即時生成，沒有使用任何原版 ROM 素材。

▶ **線上遊玩：https://outsider987.github.io/light-and-darkness/**

## 遊戲內容

- 八個章節、23 場戰鬥、30 位可加入的夥伴（Max、Lowe、Ken、Tao、Hans、Luke、Gong、Gort、Mae、Khris、Anri、Arthur、Diane、Balbaroy、Amon、Jogurt、Zylo、Kokichi、Guntz、Pelle、Vankar、Domingo、Earnest、Lyle、Bleu、Musashi、Adam、Alef、Torasu、Hanzou）
- 王都巨神兵：第七章王都 Runefaust 城門前的 **Colossus**，以及第六章滅亡王國 Prompt 的古代兵器 **Chaos**（需用 Chaos Breaker）
- 歷代 Boss：Marionette、Elliott、Balbazak、Mishaela、Kane、Chaos、Colossus、Ramladu、Darksol、Dark Dragon（三頭）
- 完整系統還原：
  - 戰鬥：AGI 決定行動順序、地形移動成本與 Land Effect、攻擊 / 魔法 / 道具 / 待機四方向選單、反擊、連續攻擊、會心一擊、迴避、睡眠 / 混亂 / 毒 / Desoul / Dispel、戰鬥演出畫面
  - 魔法：Blaze、Freeze、Bolt、Heal、Aura、Detox、Egress、Quick、Slow、Boost、Muddle、Sleep、Desoul、Dispel（各有等級）
  - 成長：100 EXP 升級、職業成長率、Lv10 教會轉職（SDMN→HERO、KNTE→PLDN、MAGE→WIZD…）、人物專屬魔法學習表
  - 城鎮：商店（買 / 賣 / 特價品）、教會（存檔 / 復活 / 解毒解咒 / 轉職）、總部 Nova（出戰 12 人編成、倉庫、狀態）、旅館、寶箱、搜尋隱藏物品
  - 道具：四格道具欄、裝備武器與戒指、詛咒裝備、永久能力藥
  - 敵人 AI：待機誘敵、主動進攻、治療者、施法者、固定砲台（Laser Eye / Torch Eye）、Boss
- 原創像素美術（所有人物、敵人、地形皆由程式繪製）、原創 chiptune 配樂（WebAudio 音序器）、音效合成
- 戰鬥演出畫面：75 個單位（30 名夥伴 + 45 種敵人）各有一張 SEGA 風格大型戰鬥圖（以程式小圖為參考圖，由 Qwen Image 2.1 重繪後去背），魔法有火 / 冰 / 雷 / 回復 / 暗等演出特效
- 戰鬥演出用的 12 張手繪風背景（草原、森林、山地、河畔、船甲板、城堡、洞窟、遺跡、荒地、熔岩、王座、古代之塔）與標題畫面，以及 15 首配樂，是用本地 ComfyUI 生成（Qwen Image 2.1 / ACE-Step 1.5），放在 `public/bg`、`public/music`；缺檔時自動退回程式生成的版本
- 存檔於瀏覽器（教會存檔）；支援鍵盤、觸控按鈕、全螢幕

## 操作

| 按鍵 | 功能 |
| --- | --- |
| 方向鍵 / WASD | 移動、游標 |
| Z / Enter / Space | 確認、交談、開寶箱 |
| X / Esc | 取消；地圖上開啟選單 |
| C | 選單 / 查看狀態 |
| M | 靜音 |
| 手把 | 十字鍵 / 左搖桿移動，A 確認，B 取消，X 選單 |
| F | 全螢幕 |

手機：觸碰畫面後會出現虛擬按鍵。

## 開發

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # 內容完整性 + 戰鬥邏輯單元測試 (node:test)
npm run build      # tsc + vite build -> dist/
npm run preview    # 以正式建置啟動 http://localhost:4173 （測試腳本預設打這個）
npm run smoke      # Playwright 無頭瀏覽器冒煙測試：標題→開場→城鎮→商店→教會→戰鬥
npm run playthrough # 自動打完全部 23 場戰鬥，並執行每個地點的所有 NPC 腳本
node scripts/tour.mjs            # 截圖所有地圖與戰場，做成 contact sheet
node scripts/comfy/gen-backgrounds.mjs && node scripts/comfy/gen-music.mjs && npm run assets   # 用 ComfyUI 重新生成素材
```

推送到 `main` 後，GitHub Actions 會自動測試、建置並部署到 GitHub Pages。

## 架構

```
src/engine/      canvas / input / coroutine runner / gfx / audio sequencer / scene stack / save
src/game/
  data/          classes, characters, enemies, spells, items, music, content/chapter1-8 (地圖、NPC、劇情、戰鬥)
  battle/        pathfinding (Dijkstra), combat (命中/傷害/反擊), battleScene (回合、AI、演出)
  field/         fieldScene (城鎮探索、劇情腳本解譯、商店/教會/總部/旅館)
  sprites.ts     參數化像素角色產生器      tiles.ts  地形貼圖產生器
  script.ts      宣告式劇情腳本 (對話 / 選擇 / 旗標 / 加入 / 道具 / 轉場)
```

劇情、地圖、敵人配置全部是資料（`src/game/data/content/*.ts`），用 ASCII 地圖與簡單的腳本物件描述，可以直接修改。

## 版權聲明

Shining Force 為 SEGA 之商標。本專案為非商業粉絲重製，未含任何自原版遊戲擷取之程式、圖像、音樂或文字；所有素材皆由本專案程式生成。程式碼以 MIT 授權釋出。
