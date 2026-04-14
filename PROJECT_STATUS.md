# PrivateDocSend 鈥?椤圭洰鐜扮姸鎬荤粨

**鏈€鍚庢洿鏂帮細** 2026-04-14  
**褰撳墠鐗堟湰锛?* MVP锛堢函鍓嶇鐗堟湰锛?
---

## 鏍稿績瀹氫綅

**涓€鍙ヨ瘽锛?* 鏈湴 Search/Replace 浼翠荆宸ュ叿锛岃褰?mapping 骞舵敮鎸佹仮澶嶃€?
鐢ㄦ埛鍦ㄨ嚜宸辩殑缂栬緫鍣紙Word/Typora/VSCode锛変腑缂栬緫鏂囨。锛岀敤杩欎釜宸ュ叿鏉ワ細
1. 鎵嬪姩杈撳叆鏁忔劅璇?+ 閫夋嫨绫诲瀷
2. 宸ュ叿鑷姩鐢熸垚 placeholder锛坄<PERSON_001>`锛夊苟鎵ц replace-all
3. 宸ュ叿璁板綍 mapping
4. 鏈€鍚庡鍑?`mapping.json`

**鐗圭偣锛?* 瀹屽叏鏈湴銆佷笉渚濊禆 NLP 鑷姩妫€娴嬨€佺敤鎴蜂富瀵兼浛鎹㈡祦绋嬨€?
---

## MVP 鑼冨洿瀵规爣

| 闇€姹?| 鍘?PRD | 褰撳墠瀹炵幇 | 澶囨敞 |
|------|--------|----------|------|
| 鏂囨。绮樿创 | 鉁?| 鉁?| 鏀寔绮樿创鎴?Load file |
| 鑷姩妫€娴?| 鉁擄紙Presidio锛?| 鉁?| 涓嶅仛鑷姩妫€娴嬶紝鏀逛负鎵嬪姩杈撳叆 |
| 鐢ㄦ埛瀹℃牳 | 鉁?| 鉁?| 鏀逛负 Find & Replace 鐣岄潰 |
| Placeholder 鐢熸垚 | 鉁?| 鉁?| 纭畾鎬?`<TYPE_NNN>` 鏍煎紡 |
| 涓€閿鍒?| 鉁?| 鉁?| Copy Anonymized Text |
| AI 鎭㈠ | 鉁?| 鉁?| Restore 妯″紡锛屾敮鎸?JSON 鏄犲皠 |
| Txt/Md | 鉁?| 鉁?| 绾枃鏈鐞?|
| Docx | 鉁擄紙PR D锛?| 鉁?| 鏆備笉鏀寔锛堝悗缁彲鍔狅級 |
| 瀵煎嚭 mapping | 鉁?| 鉁?| `mapping.json` |

**鍐崇瓥鍘熷洜锛?* 鑷姩妫€娴嬩笉鍙帶锛屾敼涓虹敤鎴锋墜鍔ㄥ喅瀹氭浛鎹㈢偣锛屽弽鑰屾洿閫忔槑鍙潬銆?
---

## 褰撳墠鎶€鏈爤

### Frontend
- **妗嗘灦锛?* React 19 + TypeScript + Vite 6
- **鏍峰紡锛?* TailwindCSS 4
- **鐘舵€佺鐞嗭細** Zustand v5锛坅ppStore.ts锛?- **杩愯锛?* `npm run dev` 鈫?localhost:1420

### Backend锛堟惌寤轰絾涓嶄緷璧栵級
- **妗嗘灦锛?* FastAPI
- **NLP锛堟湭浣跨敤锛夛細** Presidio + spaCy
- **Models锛?* Pydantic v2
- **杩愯锛?* `conda activate presidio && python -m uvicorn backend.main:app --reload --port 8000`

### Desktop锛坰caffolding锛?- **Tauri v2锛?* 閰嶇疆宸插垱寤猴紝鏈紪璇戯紙鏃?Rust 鐜锛?- **鍙敤锛?* `npm run tauri dev`锛堥渶 Rust锛?
---

## 椤圭洰缁撴瀯

```
c:/My/Project/PrivateDocSend/
鈹溾攢鈹€ frontend/
鈹?  鈹溾攢鈹€ App.tsx                    # 涓诲簲鐢紙涓ゆ爣绛鹃〉璺敱锛?鈹?  鈹溾攢鈹€ stores/
鈹?  鈹?  鈹溾攢鈹€ appStore.ts           # 鍞竴鐘舵€佺鐞嗭紙Anonymize + Restore锛?鈹?  鈹溾攢鈹€ components/
鈹?  鈹?  鈹溾攢鈹€ AnonymizeTool.tsx      # Anonymize 鐣岄潰锛團ind & Replace 鏉?+ mapping list锛?鈹?  鈹?  鈹斺攢鈹€ RestoreTool.tsx        # Restore 鐣岄潰锛堢矘璐存枃鏈?+ load mapping锛?鈹?  鈹溾攢鈹€ hooks/
鈹?  鈹?  鈹斺攢鈹€ useApi.ts             # API 璋冪敤锛堟殏鏈娇鐢級
鈹?  鈹溾攢鈹€ main.tsx                  # React entry
鈹?  鈹斺攢鈹€ types.ts                  # TypeScript 鎺ュ彛
鈹溾攢鈹€ backend/
鈹?  鈹溾攢鈹€ main.py                   # FastAPI锛堝彲閫夊悗绔級
鈹?  鈹溾攢鈹€ models/
鈹?  鈹?  鈹斺攢鈹€ mapping.py            # Pydantic 鏁版嵁妯″瀷
鈹?  鈹溾攢鈹€ detector/
鈹?  鈹?  鈹斺攢鈹€ presidio_detector.py  # NLP 妫€娴嬶紙澶囩敤锛?鈹?  鈹溾攢鈹€ planner/
鈹?  鈹?  鈹斺攢鈹€ replacement_planner.py # 鏍稿績锛氱‘瀹氭€?placeholder + one-pass replace
鈹?  鈹溾攢鈹€ restore/
鈹?  鈹?  鈹斺攢鈹€ restore_engine.py     # 鎭㈠寮曟搸
鈹?  鈹溾攢鈹€ services/                 # 鏂囦欢绾ч珮灞傛帴鍙?鈹?  鈹斺攢鈹€ requirements.txt (legacy, not used for env bootstrap)
鈹溾攢鈹€ src-tauri/                     # Tauri 閰嶇疆锛坰caffolding锛?鈹溾攢鈹€ package.json
鈹溾攢鈹€ vite.config.ts
鈹溾攢鈹€ tsconfig.json
鈹斺攢鈹€ README.md
```

---

## 鏍稿績绠楁硶锛堜笉鍙橈級

### Placeholder 鐢熸垚
```typescript
function generatePlaceholder(type: string, count: number): string {
  return `<${type}_${String(count).padStart(3, "0")}>`;
  // 渚嬶細<PERSON_001>, <ORG_002>, <PROJECT_001>
}
```

**骞傜瓑鎬э細** 鍚屼竴鏂囧瓧 + 鍚屼竴绫诲瀷 鈫?姘歌繙鍚屼竴 placeholder

### One-pass Replacement
- 鎵惧嚭鎵€鏈夎鏇挎崲鐨勪綅缃?- 浠?*鍚庡悜鍓?*鏇挎崲锛堜繚璇佸墠闈綅缃笉澶辨晥锛?- 缁撴灉锛氭墍鏈夌浉鍚屾枃瀛楄鏇挎崲鎴愮浉鍚?placeholder

### Restore锛堢簿纭仮澶嶏級
- 鎸?placeholder 闀垮害鍊掑簭澶勭悊锛堥槻姝㈤儴鍒嗗尮閰嶏級
- 浣跨敤 `str.replace()`锛堟棤姝ｅ垯锛岀函鏂囨湰锛?- 妫€娴嬪墿浣?`<TYPE_NNN>` 妯″紡 鈫?璀﹀憡 AI 淇敼浜嗗崰浣嶇

---

## 浣跨敤娴佺▼

### Anonymize 妯″紡

1. **绮樿创鎴栧姞杞芥枃鏈?*
   ```
   鍘熸枃锛氱帇鏁忓湪澶嶆棪澶у宸ヤ綔銆侾RSOV 椤圭洰杩涘睍椤哄埄銆?   ```

2. **Find & Replace 鏉?*
   - Find: `鐜嬫晱`
   - Entity type: `PERSON`
   - 宸ュ叿鏄剧ず锛歚Replace with: <PERSON_001>` | `2 occurrences`

3. **鐐?Replace All**
   ```
   缁撴灉锛?PERSON_001> 鍦ㄥ鏃﹀ぇ瀛﹀伐浣溿€侾RSOV 椤圭洰杩涘睍椤哄埄銆?   ```
   - 宸ュ叿鑷姩璁板綍锛歚<PERSON_001> 鈫?鐜嬫晱 [PERSON]`

4. **閲嶅绗?2-3 姝?*
   - Find: `澶嶆棪澶у` 鈫?Replace 鈫?`<ORG_001>`
   - Find: `PRSOV` 鈫?Replace 鈫?`<PROJECT_001>`

5. **Export mapping.json**
   ```json
   [
     {"placeholder": "<PERSON_001>", "original": "鐜嬫晱", "entity_type": "PERSON"},
     {"placeholder": "<ORG_001>", "original": "澶嶆棪澶у", "entity_type": "ORG"},
     {"placeholder": "<PROJECT_001>", "original": "PRSOV", "entity_type": "PROJECT"}
   ]
   ```

6. **Copy Anonymized Text** 鈫?绮樿创鍒?Word/AI

### Restore 妯″紡

1. **Load File**锛氱矘璐?AI 淇敼鍚庣殑鏂囨湰锛堝惈鍗犱綅绗︼級
2. **Load mapping.json**锛氶€夋嫨鏄犲皠鏂囦欢
3. **鐐?Restore All**
   ```
   杈撳叆锛?PERSON_001> 鐜板湪鍦?<ORG_001> 鎷呬换椤圭洰缁忕悊銆?PROJECT_001> 杩涘睍鑹ソ銆?   杈撳嚭锛氱帇鏁忕幇鍦ㄥ湪澶嶆棪澶у鎷呬换椤圭洰缁忕悊銆侾RSOV 杩涘睍鑹ソ銆?   ```
4. **Download** 鎴?**Copy**

---

## 蹇€熷惎鍔?
### 鍓嶇锛堜富鍏ュ彛锛?
```bash
cd c:/My/Project/PrivateDocSend
npm install                    # 棣栨
npm run dev
# 鈫?http://localhost:1420
```

### 鍚庣锛堝彲閫夛級

```bash
conda activate presidio
python -m uvicorn backend.main:app --reload --port 8000
```

### 缂栬瘧涓?Desktop锛堥渶 Rust锛?
```bash
npm run tauri dev
```

---

## 涓嬩竴姝ュ彲鎵╁睍鏂瑰悜

### Phase 2锛氬寮哄姛鑳?- [ ] 鏀寔 `.docx` 瀵煎叆/瀵煎嚭锛堥渶 python-docx锛?- [ ] Batch Replace锛堝悓涓€绫诲瀷澶氫釜璇嶏級
- [ ] Mapping History锛堝巻鍙叉槧灏勯噸鐢級
- [ ] Custom Entity Templates

### Phase 3锛歂LP 杈呭姪锛堝彲閫夊洖褰掞級
- [ ] 鑷姩妫€娴?+ 鐢ㄦ埛瀹℃牳娣峰悎妯″紡
- [ ] Presidio 鍙€夊惎鐢?- [ ] 璁粌鑷畾涔夊疄浣撹瘑鍒?
### Phase 4锛欴esktop 鎵撶（
- [ ] Tauri 缂栬瘧锛堥渶 Rust锛?- [ ] 蹇嵎閿紙Ctrl+K Find, Ctrl+Shift+H Replace锛?- [ ] 鎷栨嫿瀵煎叆
- [ ] Dark Mode

---

## 宸查獙璇?
鉁?TypeScript 缂栬瘧锛?6 modules, 0 errors  
鉁?Anonymize 宸ヤ綔娴侊細Find 鈫?Replace 鈫?Mapping 鐢熸垚  
鉁?Restore 宸ヤ綔娴侊細绮樿创 + mapping.json 鈫?绮剧‘杩樺師  
鉁?骞傜瓑鎬э細鍚屾枃瀛楀悓绫诲瀷 鈫?鍚?placeholder  
鉁?绾墠绔繍琛岋細鏃犲悗绔緷璧? 

---

## 宸茬煡闄愬埗

| 闂 | 鍘熷洜 | 瑙ｅ喅鏂规 |
|------|------|---------|
| 涓嶆敮鎸?.docx | 闇€瑕?python-docx 搴?| 鍚庣画琛ュ厖 Phase 2 |
| 鏃犺嚜鍔ㄦ娴?| 鐢ㄦ埛寮鸿皟浜哄伐鍐崇瓥鏇村彲鎺?| 杩欐槸鐜扮姸锛屽彲鍚庣画鍔?|
| 鍗?session 鐘舵€?| 鏈疄鐜版寔涔呭寲 | 鍙姞 localStorage 鎴栨枃浠朵繚瀛?|
| UI 涓?web 鐣岄潰 | 鏈紪璇?Tauri | npm run dev 宸插彲鐢?|

---

## 鏂囦欢娓呭崟

**鏍稿績瀹炵幇锛?*
- `frontend/stores/appStore.ts` 鈥?7KB锛屽崟涓€鐪熷疄婧?- `frontend/components/AnonymizeTool.tsx` 鈥?Find & Replace UI
- `frontend/components/RestoreTool.tsx` 鈥?Restore UI
- `frontend/App.tsx` 鈥?璺敱灞?
**鍚庣锛堝鐢級锛?*
- `backend/planner/replacement_planner.py` 鈥?鏇挎崲鏍稿績绠楁硶
- `backend/restore/restore_engine.py` 鈥?鎭㈠鏍稿績绠楁硶
- `backend/main.py` 鈥?FastAPI锛堝彲閫夛級

**閰嶇疆锛?*
- `package.json`銆乣vite.config.ts`銆乣tsconfig.json`
- `src-tauri/` 鈥?Tauri scaffolding

---

## 鎬荤粨

褰撳墠 PrivateDocSend 宸茬粡鏄?*瀹屾暣鍙敤鐨?MVP**锛?
鉁?**鏈湴浼樺厛** 鈥?鏃犱簯渚濊禆  
鉁?**鍙€嗘槧灏?* 鈥?绮剧‘鎭㈠  
鉁?**鐢ㄦ埛涓诲** 鈥?Search/Replace 寮忔搷浣? 
鉁?**LLM 鍙嬪ソ** 鈥?`<TYPE_NNN>` 鏍煎紡  
鉁?**鍗冲彲浣跨敤** 鈥?`npm run dev` 鍗冲紑鍗崇敤  

**閫傚悎鍦烘櫙锛?*
- 瀛︾敓娑﹁壊璁烘枃锛堟晱鎰熷甯?瀛︽牎鍚嶏級
- PM 鏂规鑴辨晱锛堝鎴峰悕銆侀」鐩唬鍙凤級
- 娉曞姟鍚堝悓锛堝綋浜嬩汉濮撳悕銆侀噾棰濓級
- 姹傝亴淇¤劚鏁忥紙鍏徃鍚嶃€侀」鐩悕锛?
---

**涓嬩竴涓?session锛?* 鍙傝€冩鏂囨。锛屽彲缁х画浼樺寲 UI銆佹坊鍔?docx 鏀寔鎴栫紪璇?Desktop 鐗堟湰銆?

