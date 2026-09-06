const SHEET_ID = "1ZXxYbFO7jL0ie0HFH3qZadBjPKVze_gZL4bLz71_-Pk";
const DATA_SHEET = "Data Siswa";
const REKAP_KELAS = "Rekap Kelas";
const REKAP_KELOMPOK = "Rekap Kelompok";

const HEADERS = [
  "Kelas", "Guru", "Kode Siswa", "Nama Siswa", "Kelompok", "Peran",
  "Pre-Test", "M1 Objektif", "M1 Uraian XP", "M2 Objektif", "M2 Uraian XP",
  "M3 Objektif", "M3 Uraian XP", "Boss Objektif", "Boss Uraian XP", "Post-Test",
  "N-Gain", "Kategori N-Gain", "Ketuntasan", "Total XP",
  "Jawaban M1", "Jawaban M2", "Jawaban M3", "Jawaban Boss",
  "M1 Pilihan 1", "M1 Pilihan 2", "M1 Kunci 1", "M1 Kunci 2",
  "M2 Pilihan 1", "M2 Pilihan 2", "M2 Kunci 1", "M2 Kunci 2",
  "Refleksi 3 Hal", "Refleksi 2 Hal", "Refleksi 1 Hal", "Waktu Pengiriman"
];

const FIELD = {
  "Kelas":"className", "Guru":"teacher", "Kode Siswa":"code", "Nama Siswa":"name",
  "Kelompok":"team", "Peran":"role", "Pre-Test":"pre", "M1 Objektif":"m1",
  "M1 Uraian XP":"rubric_m1", "M2 Objektif":"m2", "M2 Uraian XP":"rubric_m2",
  "M3 Objektif":"m3", "M3 Uraian XP":"rubric_m3", "Boss Objektif":"boss",
  "Boss Uraian XP":"rubric_boss", "Post-Test":"post", "Total XP":"xp",
  "Jawaban M1":"answer_m1", "Jawaban M2":"answer_m2", "Jawaban M3":"answer_m3",
  "Jawaban Boss":"answer_boss",
  "M1 Pilihan 1":"m1_choice_a", "M1 Pilihan 2":"m1_choice_b",
  "M1 Kunci 1":"m1_key_a", "M1 Kunci 2":"m1_key_b",
  "M2 Pilihan 1":"m2_choice_a", "M2 Pilihan 2":"m2_choice_b",
  "M2 Kunci 1":"m2_key_a", "M2 Kunci 2":"m2_key_b",
  "Refleksi 3 Hal":"reflection_r3",
  "Refleksi 2 Hal":"reflection_r2", "Refleksi 1 Hal":"reflection_r1"
};

function getSheet_() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName(DATA_SHEET);
  if (!sheet) sheet = ss.insertSheet(DATA_SHEET);
  sheet.getRange(1,1,1,HEADERS.length).setValues([HEADERS]).setFontWeight("bold");
  sheet.setFrozenRows(1);
  return sheet;
}

function setup() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  getSheet_();
  setupKelas_(ss);
  setupKelompok_(ss);
  refresh_();
  return "Setup selesai.";
}

function RESET_DATA_SISWA() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const old = ss.getSheetByName(DATA_SHEET);
  if (old) {
    const stamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone() || "Asia/Jakarta", "yyyyMMdd_HHmmss");
    old.copyTo(ss).setName("Backup Data " + stamp);
    ss.deleteSheet(old);
  }
  const fresh = ss.insertSheet(DATA_SHEET);
  fresh.getRange(1,1,1,HEADERS.length).setValues([HEADERS]).setFontWeight("bold");
  fresh.setFrozenRows(1);
  setupKelas_(ss);
  setupKelompok_(ss);
  refresh_();
  return "Database dikosongkan; backup dibuat.";
}

/* =========================================================
   GET / CHECK / RESERVE / RECORDS
   FIX: mendukung JSONP callback yang dipakai index.html.
========================================================= */
function doGet(e) {
  const params = (e && e.parameter) || {};

  if (params.action === "check") {
    const className = String(params.className || "").trim();
    const code = String(params.code || "").trim();
    const row = findRow_(getSheet_(), className, code);
    return jsonResponse_({ ok:true, exists:row > 0 }, params.callback);
  }

  if (params.action === "reserve") {
    const className = String(params.className || "").trim();
    const code = String(params.code || "").trim();
    const name = String(params.name || "").trim();
    const teacher = String(params.teacher || "").trim();

    if (!className || !code || !name) {
      return jsonResponse_({ok:false, exists:false, error:"Kelas, kode, dan nama wajib."}, params.callback);
    }

    const lock = LockService.getScriptLock();
    try {
      if (!lock.tryLock(5000)) {
        return jsonResponse_({
          ok:false,
          exists:false,
          created:false,
          error:"Server sedang sibuk. Silakan coba lagi."
        }, params.callback);
      }

      const sheet = getSheet_();
      const existingRow = findRow_(sheet, className, code);

      if (existingRow > 0) {
        return jsonResponse_({
          ok:true, exists:true, created:false,
          className, code, name
        }, params.callback);
      }

      const record = {
        className, teacher, code, name,
        team:"", role:"", pre:"", m1:"", rubric_m1:"", m2:"", rubric_m2:"",
        m3:"", rubric_m3:"", boss:"", rubric_boss:"", post:"", xp:"",
        answer_m1:"", answer_m2:"", answer_m3:"", answer_boss:"",
        m1_choice_a:"", m1_choice_b:"", m1_key_a:"RAM", m1_key_b:"SSD/HDD",
        m2_choice_a:"", m2_choice_b:"", m2_key_a:"ALU", m2_key_b:"CU",
        reflection_r3:"", reflection_r2:"", reflection_r1:"",
        timestamp:new Date().toISOString()
      };

      const row = HEADERS.map(header => {
        if (["N-Gain","Kategori N-Gain","Ketuntasan","Total XP"].includes(header)) return "";
        const field = FIELD[header];
        return field ? (record[field] ?? "") : "";
      });

      const rowNumber = Math.max(sheet.getLastRow()+1, 2);
      sheet.getRange(rowNumber,1,1,HEADERS.length).setValues([row]);

      // Jangan refresh rekap di request reserve.
      // Frontend menunggu JSONP; refresh_() bisa membuat response terlambat.
      // Rekap akan diperbarui oleh upsert_() saat data berikutnya dikirim.

      return jsonResponse_({
        ok:true, exists:false, created:true,
        row:rowNumber, className, code, name
      }, params.callback);
    } catch (error) {
      return jsonResponse_({ok:false, exists:false, created:false, error:String(error)}, params.callback);
    } finally {
      try { lock.releaseLock(); } catch (_) {}
    }
  }

  if (params.action === "records") {
    return jsonResponse_(getRecordsPayload_(), params.callback);
  }

  return jsonResponse_({
    ok:true,
    service:"Computer Mission 2.0",
    database:DATA_SHEET,
    classes:["X-5","X-8","X-11"]
  }, params.callback);
}

function jsonResponse_(payload, callback) {
  if (callback) {
    const safeCallback = String(callback).replace(/[^\w$]/g, "");
    return ContentService
      .createTextOutput(safeCallback + "(" + JSON.stringify(payload) + ");")
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function getRecordsPayload_() {
  const sheet = getSheet_();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return {ok:true, records:[]};

  const rows = sheet.getRange(2,1,lastRow-1,HEADERS.length).getValues();
  const records = rows
    .filter(row => String(row[2] || "").trim() !== "")
    .map(row => {
      const record = {};
      HEADERS.forEach((header,index) => record[FIELD[header] || header] = row[index]);
      record.pre = blankOrNumber_(record.pre);
      record.post = blankOrNumber_(record.post);
      ["m1","m2","m3","boss","xp"].forEach(key => record[key] = numberOrZero_(record[key]));
      ["rubric_m1","rubric_m2","rubric_m3","rubric_boss"].forEach(key => {
        record[key] = record[key] === "" || record[key] == null ? "" : numberOrZero_(record[key]);
      });
      return record;
    });
  return {ok:true, records};
}

function blankOrNumber_(value) {
  if (value === "" || value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function numberOrZero_(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/* =========================================================
   POST
========================================================= */
function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    if (!e || !e.postData || !e.postData.contents) throw new Error("Data POST kosong.");
    const payload = JSON.parse(e.postData.contents || "{}");
    if (payload.action === "upsert") return upsert_(payload.record || {});
    if (payload.action === "grade") return grade_(payload);
    throw new Error("Action tidak dikenali.");
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ok:false,error:String(error)}))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
}

function upsert_(record) {
  const className = String(record.className || "").trim();
  const code = String(record.code || "").trim();
  const name = String(record.name || "").trim();

  if (!className || !code || !name) throw new Error("Kelas, kode siswa, dan nama wajib.");
  if (!["X-5","X-8","X-11"].includes(className)) throw new Error("Kelas tidak valid.");

  const sheet = getSheet_();
  const existingRow = findRow_(sheet, className, code);
  const rowNumber = existingRow > 0 ? existingRow : Math.max(sheet.getLastRow()+1,2);

  let old = {};
  if (existingRow > 0) {
    const oldValues = sheet.getRange(rowNumber,1,1,HEADERS.length).getValues()[0];
    HEADERS.forEach((header,index) => old[header] = oldValues[index]);
  }

  const textFields = ["Jawaban M1","Jawaban M2","Jawaban M3","Jawaban Boss","Refleksi 3 Hal","Refleksi 2 Hal","Refleksi 1 Hal"];
  const rubricFields = ["M1 Uraian XP","M2 Uraian XP","M3 Uraian XP","Boss Uraian XP"];

  const row = HEADERS.map(header => {
    if (["N-Gain","Kategori N-Gain","Ketuntasan","Total XP"].includes(header)) return "";
    const field = FIELD[header];
    if (!field) return old[header] ?? "";
    const incoming = record[field];
    if (incoming === undefined || incoming === null) return old[header] ?? "";
    if (textFields.includes(header) && String(incoming).trim() === "") return old[header] ?? "";
    if (rubricFields.includes(header) && String(incoming).trim() === "") return old[header] ?? "";
    return incoming;
  });

  sheet.getRange(rowNumber,1,1,HEADERS.length).setValues([row]);
  writeDerived_(sheet,rowNumber);
  refresh_();

  return ContentService.createTextOutput(JSON.stringify({ok:true,action:"upsert",row:rowNumber,className,code,name}))
    .setMimeType(ContentService.MimeType.JSON);
}

function grade_(payload) {
  const className = String(payload.className || "").trim();
  const code = String(payload.code || "").trim();
  if (!className || !code) throw new Error("Kelas dan kode siswa wajib.");

  const sheet = getSheet_();
  const rowNumber = findRow_(sheet,className,code);
  if (rowNumber < 2) throw new Error("Data siswa tidak ditemukan.");

  const rubric = payload.rubric || {};
  const m1 = clamp_(rubric.m1,9);
  const m2 = clamp_(rubric.m2,9);
  const m3 = clamp_(rubric.m3,5);
  const boss = clamp_(rubric.boss,17);

  sheet.getRange(rowNumber,9).setValue(m1);
  sheet.getRange(rowNumber,11).setValue(m2);
  sheet.getRange(rowNumber,13).setValue(m3);
  sheet.getRange(rowNumber,15).setValue(boss);
  writeDerived_(sheet,rowNumber);
  refresh_();

  return ContentService.createTextOutput(JSON.stringify({ok:true,action:"grade",className,code,rubric:{m1,m2,m3,boss}}))
    .setMimeType(ContentService.MimeType.JSON);
}

function clamp_(value,max) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(0,Math.min(max,n)) : 0;
}

function findRow_(sheet,className,code) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;
  const values = sheet.getRange(2,1,lastRow-1,3).getValues();
  const key = className + "|" + code;
  for (let i=0;i<values.length;i++) {
    const currentKey = String(values[i][0]).trim() + "|" + String(values[i][2]).trim();
    if (currentKey === key) return i+2;
  }
  return -1;
}

function writeDerived_(sheet,rowNumber) {
  const pre = Number(sheet.getRange(rowNumber,7).getValue());
  const post = Number(sheet.getRange(rowNumber,16).getValue());
  let nGain = "", category = "", completion = "";

  if (Number.isFinite(pre) && Number.isFinite(post) && pre < 100) {
    nGain = (post-pre)/(100-pre);
    category = nGain >= 0.7 ? "Tinggi" : nGain >= 0.3 ? "Sedang" : "Rendah";
    completion = post >= 80 ? "Tuntas" : "Belum Tuntas";
  }

  sheet.getRange(rowNumber,17,1,3).setValues([[nGain,category,completion]]);

  const scoreColumns = [8,9,10,11,12,13,14,15];
  const totalXp = scoreColumns.reduce((sum,column) => sum + (Number(sheet.getRange(rowNumber,column).getValue()) || 0),0);
  sheet.getRange(rowNumber,20).setValue(totalXp);
}

function refresh_() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const dataSheet = getSheet_();
  const lastRow = dataSheet.getLastRow();
  if (lastRow < 2) {
    setupKelas_(ss);
    setupKelompok_(ss);
    return;
  }

  for (let row=2; row<=lastRow; row++) {
    if (String(dataSheet.getRange(row,3).getValue()).trim() !== "") writeDerived_(dataSheet,row);
  }
  updateKelas_(ss,dataSheet);
  updateKelompok_(ss,dataSheet);
}

function setupKelas_(ss) {
  let sheet = ss.getSheetByName(REKAP_KELAS);
  if (!sheet) sheet = ss.insertSheet(REKAP_KELAS);
  sheet.clear();
  sheet.getRange(1,1,1,10).setValues([[
    "Kelas","Guru","Jumlah Siswa","Rata-rata Pre-Test","Rata-rata Post-Test",
    "Rata-rata N-Gain","Kategori N-Gain","Tuntas (≥80)","Ketuntasan (%)","Rata-rata Total XP"
  ]]).setFontWeight("bold");
  sheet.setFrozenRows(1);
}

function updateKelas_(ss,dataSheet) {
  setupKelas_(ss);
  const sheet = ss.getSheetByName(REKAP_KELAS);
  const lastRow = dataSheet.getLastRow();
  if (lastRow < 2) return;
  const values = dataSheet.getRange(2,1,lastRow-1,20).getValues();
  const teachers = {"X-5":"Fauziah Anwar","X-8":"Ridwan Maulana","X-11":"Ismu Kamal Muhiban"};
  const output = [];

  ["X-5","X-8","X-11"].forEach(className => {
    const rows = values.filter(row => String(row[0]).trim()===className && String(row[2]).trim()!=="");
    const pre = rows.map(row=>Number(row[6])).filter(Number.isFinite);
    const post = rows.map(row=>Number(row[15])).filter(Number.isFinite);
    const nGain = rows.map(row=>Number(row[16])).filter(Number.isFinite);
    const xp = rows.map(row=>Number(row[19])).filter(Number.isFinite);
    const tuntas = post.filter(v=>v>=80).length;
    const averageNGain = avg_(nGain);
    output.push([
      className,teachers[className],rows.length,avg_(pre),avg_(post),averageNGain,
      averageNGain === "" ? "" : averageNGain>=0.7 ? "Tinggi" : averageNGain>=0.3 ? "Sedang" : "Rendah",
      tuntas,rows.length ? tuntas/rows.length : "",avg_(xp)
    ]);
  });

  sheet.getRange(2,1,output.length,10).setValues(output);
  sheet.autoResizeColumns(1,10);
}

function setupKelompok_(ss) {
  let sheet = ss.getSheetByName(REKAP_KELOMPOK);
  if (!sheet) sheet = ss.insertSheet(REKAP_KELOMPOK);
  sheet.clear();
  sheet.getRange(1,1,1,8).setValues([[
    "Kelas","Kelompok","Jumlah Siswa","Rata-rata Pre-Test","Rata-rata Post-Test",
    "Rata-rata N-Gain","Tuntas (Post ≥80)","Rata-rata Total XP"
  ]]).setFontWeight("bold");
  sheet.setFrozenRows(1);
}

function updateKelompok_(ss,dataSheet) {
  setupKelompok_(ss);
  const sheet = ss.getSheetByName(REKAP_KELOMPOK);
  const lastRow = dataSheet.getLastRow();
  if (lastRow < 2) return;
  const values = dataSheet.getRange(2,1,lastRow-1,20).getValues();
  const output = [];

  ["X-5","X-8","X-11"].forEach(className => {
    for (let teamNumber=1;teamNumber<=6;teamNumber++) {
      const team = "Tim " + teamNumber;
      const rows = values.filter(row =>
        String(row[0]).trim()===className &&
        String(row[4]).trim()===team &&
        String(row[2]).trim()!==""
      );
      if (!rows.length) continue;
      const pre = rows.map(row=>Number(row[6])).filter(Number.isFinite);
      const post = rows.map(row=>Number(row[15])).filter(Number.isFinite);
      const nGain = rows.map(row=>Number(row[16])).filter(Number.isFinite);
      const xp = rows.map(row=>Number(row[19])).filter(Number.isFinite);
      output.push([
        className,team,rows.length,avg_(pre),avg_(post),avg_(nGain),
        post.filter(v=>v>=80).length,avg_(xp)
      ]);
    }
  });

  if (output.length) sheet.getRange(2,1,output.length,8).setValues(output);
  sheet.autoResizeColumns(1,8);
}

function avg_(values) {
  return values.length ? values.reduce((sum,value)=>sum+value,0)/values.length : "";
}
