
// ===========================
// onEdit: triggers when editing column D
// ===========================
function onEdit(e) {
  const range = e.range;
  const sheet = range.getSheet();

  // Only trigger in 'result' sheet column D
  if (sheet.getName() !== 'result' || range.getColumn() !== 4) return;

  const row = range.getRow();

  // Force plain text
  range.setNumberFormat('@STRING@');
  const inputValue = range.getDisplayValue();
  if (!inputValue) return;

  // Clean and split input
  const cleanInput = inputValue.replace(/،/g, ";").replace(/\s+/g, "");
  const rowNumbers = cleanInput.split(";").map(n =>
    parseInt(n.replace(/,/g, ""), 10)
  );

  // Must be exactly 4 numbers (0 allowed)
  if (rowNumbers.length !== 4) {
    sheet.getRange(row, 4).setValue("⚠️ Enter 4 numbers separated by semicolons (a;b;c;d)");
    return;
  }

  // Sheet names
  const sourceSheets = ['shokolat-1', 'mugdost-2', 'mugestan-3', 'arva-4'];
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Helper: read fields or return blanks if row = 0
  const getData = (sheetName, rowNum) => {
    if (rowNum === 0) {
      return { stock: "", price: "", url: "", pic: "" };
    }
    const s = ss.getSheetByName(sheetName);
    return {
      price: s.getRange(rowNum, 4).getValue(), // col D
      stock: s.getRange(rowNum, 5).getValue(), // col E
      url:   s.getRange(rowNum, 8).getValue(), // col H
      pic:   s.getRange(rowNum, 9).getValue()  // col I
    };
  };

  try {
    // Extract 4 datasets
    const shoko    = getData(sourceSheets[0], rowNumbers[0]);
    const mugdost  = getData(sourceSheets[1], rowNumbers[1]);
    const mugestan = getData(sourceSheets[2], rowNumbers[2]);
    const arva     = getData(sourceSheets[3], rowNumbers[3]);

    // Insert 16 fields into columns E → T
    const dataToInsert = [
      shoko.stock, shoko.price,          // E,F
      mugdost.stock, mugdost.price,      // G,H
      mugestan.stock, mugestan.price,    // I,J
      arva.stock, arva.price,            // K,L
      shoko.url, mugdost.url, mugestan.url, arva.url, // M,N,O,P
      shoko.pic, mugdost.pic, mugestan.pic, arva.pic  // Q,R,S,T
    ];

    sheet.getRange(row, 5, 1, dataToInsert.length).setValues([dataToInsert]);

    // --- NEW: Set CHANGED column (V) to 9 ---
    sheet.getRange(row, 22).setValue(9);

  } catch (err) {
    sheet.getRange(row, 4).setValue("❌ Error: " + err.message);
  }
}






// ===========================
function refreshResultSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const resultSheet = ss.getSheetByName('result');
  const sourceSheets = ['shokolat-1', 'mugdost-2', 'mugestan-3', 'arva-4'];

  const lastRow = resultSheet.getLastRow();
  if (lastRow < 2) return; // no data

  for (let row = 2; row <= lastRow; row++) {
    const inputCell = resultSheet.getRange(row, 4);
    inputCell.setNumberFormat('@STRING@'); // plain text
    const inputValue = inputCell.getDisplayValue();
    if (!inputValue) continue;

    const cleanInput = inputValue.replace(/،/g, ";").replace(/\s+/g, "");
    const rowNumbers = cleanInput.split(";").map(n => parseInt(n.replace(/,/g, ""), 10));
    if (rowNumbers.length !== 4) continue;

    const getData = (sheetName, rowNum) => {
      if (rowNum === 0 || isNaN(rowNum)) return { stock:"", price:"", url:"", pic:"" };
      const s = ss.getSheetByName(sheetName);
      return {
        stock: s.getRange(rowNum, 5).getValue(),
        price: s.getRange(rowNum, 4).getValue(),
        url: s.getRange(rowNum, 8).getValue(),
        pic: s.getRange(rowNum, 9).getValue()
      };
    };

    try {
      // Read previous prices from result sheet BEFORE updating
      const prevPrices = [
        resultSheet.getRange(row, 6).getValue(),  // F: shokolat price
        resultSheet.getRange(row, 8).getValue(),  // H: mugdost price
        resultSheet.getRange(row, 10).getValue(), // J: mugestan price
        resultSheet.getRange(row, 12).getValue()  // L: arva price
      ];

      // Get current data from source sheets
      const shoko    = getData(sourceSheets[0], rowNumbers[0]);
      const mugdost  = getData(sourceSheets[1], rowNumbers[1]);
      const mugestan = getData(sourceSheets[2], rowNumbers[2]);
      const arva     = getData(sourceSheets[3], rowNumbers[3]);

      const newPrices = [shoko.price, mugdost.price, mugestan.price, arva.price];

      // Determine if any price has changed
      let priceChanged = false;
      for (let i = 0; i < 4; i++) {
        if (prevPrices[i] !== newPrices[i]) {
          priceChanged = true;
          break;
        }
      }

      // Update CHANGED column (V / 22)
      const changedCell = resultSheet.getRange(row, 22);
      if (priceChanged) {
        changedCell.setValue(9);
      } else {
        const prevChanged = parseInt(changedCell.getValue()) || 0;
        changedCell.setValue(Math.max(0, prevChanged - 1));
      }

      // Update other columns (stock, price, url, pic)
      const dataToInsert = [
        shoko.stock, shoko.price,          // E,F
        mugdost.stock, mugdost.price,      // G,H
        mugestan.stock, mugestan.price,    // I,J
        arva.stock, arva.price,            // K,L
        shoko.url, mugdost.url, mugestan.url, arva.url, // M,N,O,P
        shoko.pic, mugdost.pic, mugestan.pic, arva.pic  // Q,R,S,T
      ];

      resultSheet.getRange(row, 5, 1, 16).setValues([dataToInsert]);

    } catch (err) {
      resultSheet.getRange(row, 4).setValue("❌ " + err.message);
    }
  }
}
