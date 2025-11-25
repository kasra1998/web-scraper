/************************************************************
 *  WEBHOOK ENTRY POINT — n8n calls this URL
 ************************************************************/
function doGet(e) {
  // Optional: check for secret key, e.g., ?key=12345
  // if (e.parameter.key !== "YOUR_SECRET_KEY") return ContentService.createTextOutput("Unauthorized");

  syncAll();  

  return ContentService.createTextOutput("OK");
}


/************************************************************
 *  MAIN MULTI-SHEET SYNCER
 ************************************************************/
function syncAll() {
  const pairs = [
    { ref: 'shokolat-1', upd: 'shokolatUpdated' },
    { ref: 'mugdost-2', upd: 'mugdostUpdated' },
    { ref: 'migestan-3', upd: 'mugestanUpdated' },
    { ref: 'arva-4',    upd: 'arvaUpdated' }
  ];

  pairs.forEach(p => syncSheets(p.ref, p.upd));
}


/************************************************************
 *  SYNC SINGLE PAIR
 ************************************************************/
function syncSheets(refName, updName) {
  const ss = SpreadsheetApp.getActive();
  const ref = ss.getSheetByName(refName);
  const upd = ss.getSheetByName(updName);

  if (!ref || !upd) return;

  let refData = ref.getDataRange().getValues();
  let updData = upd.getDataRange().getValues();

  if (refData.length < 2 || updData.length < 2) return;

  // Indexes
  const COL_PRICE = 3;    // D
  const COL_STOCK = 4;    // E
  const COL_URL   = 7;    // H
  const COL_NEW   = 10;   // K
  const COL_CHANGED = 11; // L

  // Step 1 — decrement NEW column (K) for all rows in reference sheet
  for (let i = 1; i < refData.length; i++) {
    let v = refData[i][COL_NEW];
    if (typeof v === 'number') {
      refData[i][COL_NEW] = Math.max(0, v - 1);
    }
  }

  // Create map: productUrl → rowIndex in reference sheet
  const urlIndex = {};
  for (let i = 1; i < refData.length; i++) {
    const url = refData[i][COL_URL];
    if (url) urlIndex[url] = i;
  }

  // Step 2 — process updated rows
  for (let i = 1; i < updData.length; i++) {
    const updRow = updData[i];
    const updUrl = updRow[COL_URL];

    if (!updUrl) continue;

    const matchRow = urlIndex[updUrl];

    if (matchRow !== undefined) {
      // Existing product — compare prices
      const oldPrice = refData[matchRow][COL_PRICE];
      const newPrice = updRow[COL_PRICE];

      // If price is different, set CHANGED = 9 (fresh price update)
      if (oldPrice !== newPrice) {
        refData[matchRow][COL_PRICE] = newPrice;
        refData[matchRow][COL_CHANGED] = 9;  // Fresh price update
      } else {
        // If price is the same, decrement CHANGED by 1 (if CHANGED > 0)
        if (refData[matchRow][COL_CHANGED] > 0) {
          refData[matchRow][COL_CHANGED] = Math.max(0, refData[matchRow][COL_CHANGED] - 1);
        }
      }

    } else {
      // New product — append to reference sheet with fresh price and CHANGED = 9
      let newRow = updRow.slice();
      newRow[COL_NEW] = 9;
      newRow[COL_CHANGED] = 9;
      ref.appendRow(newRow);
    }
  }

  // Rewrite whole table back to sheet
  ref.getRange(1, 1, refData.length, refData[0].length).setValues(refData);
}

