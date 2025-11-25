// Function to convert Gregorian date to Persian (Solar Hijri) date
function toPersianDate(date) {
  const persianCalendar = new Intl.DateTimeFormat('fa-IR-u-ca-persian');
  // Format the given date into the Persian date
  return persianCalendar.format(date);
}

function monthlyBackup() {
  // ID of the target backup spreadsheet (Record-Price-Database)
  const backupSpreadsheetId = "1VRu4RUvUSrtWv1KbEF28JIeCAeBghOnIfwpj-A1RqUY";
  if (!backupSpreadsheetId || backupSpreadsheetId.indexOf("PUT_") === 0) {
    throw new Error("Please set backupSpreadsheetId in the script.");
  }

  // Shortened names for the sheets
  const sheetsToCopy = [
    { name: "shokolat-1", shortName: "sh" },
    { name: "mugdost-2", shortName: "dost" },
    { name: "mugestan-3", shortName: "stan" }, // Corrected sheet name here
    { name: "arva-4", shortName: "arva" }
  ];
  const resultSheetName = "result";

  const now = new Date();
  
  // Convert the current dafte to the Persian (Solar) date
  const persianDate = toPersianDate(now);
  
  // Use the Persian date (e.g., 10 آذر 1404) as part of the sheet name
  const monthKey = persianDate; // Using the full Persian date
  



// Use Gregorian (AD) date for backup timing
const adDay = now.getDate();

// Run only on AD days 3, 13, or 23
if (![5, 15, 25].includes(adDay)) {
  Logger.log(`Today is not a backup day (AD 3, 13, 23). Backup skipped.`);
  return;
}




//  const persianDay = parseInt(persianDate.split(" ")[1], 10);  
//  if (![2, 3, 25].includes(persianDay)) {
//    Logger.log(`Today is not a backup day (5th, 15th, or 25th). Backup skipped.`);
//    return; 
//  }

  const sourceSS = SpreadsheetApp.getActiveSpreadsheet(); // Price Database
  const backupSS = SpreadsheetApp.openById(backupSpreadsheetId);

  // Helper: create sheet safely (if name exists, delete old sheet and create a new one)
  function createSheetSafely(targetSS, desiredName) {
    let name = desiredName;
    
    // Check if a sheet with this name already exists
    let existingSheet = targetSS.getSheetByName(name);
    if (existingSheet) {
      // If the sheet exists, delete it to avoid duplication
      try {
        targetSS.deleteSheet(existingSheet);
        Logger.log(`Deleted existing sheet: ${name}`);
      } catch (e) {
        Logger.log(`Error deleting sheet: ${name}, Error: ${e.message}`);
        throw new Error(`Error deleting sheet: ${name}`);
      }
    }

    // Create blank sheet with the desired name
    const newSheet = targetSS.insertSheet();
    newSheet.setName(name);
    Logger.log(`Created new sheet: ${name}`);
    return newSheet;
  }

  // Copy the four reference sheets (only first 9 columns)
  sheetsToCopy.forEach((sObj) => {
    const sheet = sourceSS.getSheetByName(sObj.name);
    if (!sheet) {
      // Skip if the source sheet is missing
      Logger.log(`Sheet ${sObj.name} not found in source spreadsheet.`);
      return;
    }

    const lastRow = sheet.getLastRow();
    Logger.log(`Checking sheet: ${sObj.name}, Last row: ${lastRow}`);

    if (lastRow === 0) {
      // If the sheet is empty, create an empty copy with header row
      const newName = `${sObj.shortName}-${monthKey}`;
      const newSheet = createSheetSafely(backupSS, newName);
      return;
    }

    const lastColToCopy = Math.min(9, sheet.getLastColumn()); // Ensure we only copy A:I
    const data = sheet.getRange(1, 1, lastRow, lastColToCopy).getValues();

    const newName = `${sObj.shortName}-${monthKey}`;
    const newSheet = createSheetSafely(backupSS, newName);

    // Resize the target sheet to fit data if needed
    if (newSheet.getMaxRows() < data.length) {
      newSheet.insertRows(1, data.length - newSheet.getMaxRows());
    }
    if (newSheet.getMaxColumns() < data[0].length) {
      newSheet.insertColumns(1, data[0].length - newSheet.getMaxColumns());
    }

    newSheet.getRange(1, 1, data.length, data[0].length).setValues(data);
    Logger.log(`Copied data to sheet: ${newName}`);
  });

  // Copy the result sheet (all columns & rows), excluding column A (first column)
  const resultSheet = sourceSS.getSheetByName(resultSheetName);
  if (resultSheet) {
    const lastRow = resultSheet.getLastRow();
    const lastCol = resultSheet.getLastColumn();
    Logger.log(`Result Sheet found. Last row: ${lastRow}, Last column: ${lastCol}`);

    // Ensure we copy all the rows and columns that have data
    if (lastRow > 1) {  // Ensure there is data below the header row
      // Get data excluding the first column (column A)
      const data = resultSheet.getRange(2, 2, lastRow - 1, lastCol - 1).getValues(); // Exclude first column

      Logger.log(`Data retrieved from result sheet: ${data.length} rows`);

      // Create a new sheet in the backup spreadsheet
      const newName = `R-${monthKey}`;
      const newSheet = createSheetSafely(backupSS, newName);

      // Instead of resizing first, let's directly try to set the data
      try {
        // Set the RTL format only for the result sheet (R-)
        newSheet.setRightToLeft(true);

        // Create a range and set the values while leaving the first column blank
        const firstRowData = resultSheet.getRange(1, 1, 1, lastCol).getValues();  // Get header row
        
        // Set first column to blank
        const blankColumn = Array(data.length).fill([""]);  // Blank cells for column A
        
        // Insert the blank first column
        const finalData = blankColumn.map((blank, index) => {
          return [...blank, ...data[index]];  // Combine blank column A with data from B onwards
        });

        // Set the data on the new sheet
        newSheet.getRange(1, 1, 1, lastCol).setValues(firstRowData);  // Set header row
        newSheet.getRange(2, 1, finalData.length, finalData[0].length).setValues(finalData); // Set data

        Logger.log(`Copied data to result sheet: ${newName}`);
      } catch (e) {
        Logger.log(`Error copying data to result sheet: ${e.message}`);
        throw new Error(`Error copying data to result sheet: ${e.message}`);
      }
    } else {
      Logger.log('No data in result sheet to copy.');
    }
  } else {
    Logger.log(`Result sheet "${resultSheetName}" not found.`);
  }

  Logger.log(`Backup completed for month: ${monthKey}`);
}
