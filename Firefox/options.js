function saveOptions(e) {
  e.preventDefault();
  browser.storage.local.set({
    'numDisplayed': document.querySelector("#numDisplayed").value,
    'endTime': document.querySelector("#endTime").value
  });
}
function restoreOptions() {

  browser.storage.local.get("numDisplayed").then((result) => document.querySelector("#numDisplayed").value = result.numDisplayed || 10);
  browser.storage.local.get("endTime").then((result) => document.querySelector("#endTime").value = result.endTime || '00:00');
  browser.storage.local.get("numPastDays").then((result) => document.querySelector("#numPastDays").value = result.numPastDays || 7);


}
document.addEventListener("DOMContentLoaded", restoreOptions);
document.querySelector("form").addEventListener("submit", saveOptions);

document.getElementById("export").addEventListener("click", exportData);
document.getElementById("import").addEventListener("click", importData);
document.getElementById("deleteDay").addEventListener("click", () => clearData("Daily"));
document.getElementById("deleteWeek").addEventListener("click", () => clearData("Weekly"));
document.getElementById("deleteMonth").addEventListener("click", () => clearData("Monthly"));
document.getElementById("deleteAll").addEventListener("click", () => clearData("All"));

async function clearData(type) {
  if (!confirm("Are you sure you want to proceed?"))
    return;
  if (type === "All")
    browser.storage.local.clear();
  else {
    let data = await browser.storage.local.get();
    data = Object.entries(data);
    let deletePromises = [];
    for(let e of data){
      // console.log(e);
      let prefix = e[0].substring(0,3);
      //checks which type and if the prefix should be removed based on the type
      if(type==="Daily"&&(prefix==="t#d"||prefix==="d##"))
        browser.storage.local.remove(e[0]);
      else if(type==="Weekly"&&prefix==="wee")
        browser.storage.local.remove(e[0]);
      else if(type==="Monthly"&&prefix==="m##")
        browser.storage.local.remove(e[0]);

    }
      await Promise.allSettled(deletePromises);

  }
  
  document.getElementById("deleteResponse").innerText = `${type} data cleared.`;

}
let importResponse = document.getElementById("importResponse");

async function exportData() {
  let storage = await browser.storage.local.get();
  var file = new File([JSON.stringify(storage)], 'export.txt', {
    type: 'text/plain',
  })
  download();
  function download() {
    const link = document.createElement('a')
    const url = URL.createObjectURL(file)

    link.href = url
    link.download = file.name
    document.body.appendChild(link)
    link.click()

    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }
}

async function importData() {
  let importFileInput = document.getElementById("importFile");
  importResponse.innerText = "";

  if (importFileInput.value === "") {
    importResponse.innerText = "Import failed. Please add a file to import";
    return;
  }
  let f = importFileInput.files[0];
  let text = await f.text()//(new FileReader()).readAsText(f);
  try {
    data = JSON.parse(text);
  } catch (error) {
    importResponse.innerText = "Import failed. Please add a valid file to import. The file must be in JSON format and either a .txt or .json file as in the export.";
    importFileInput.value = "";
    return;
  }

  importResponse.innerText = "Import in progress... Do not close this tab or turn off your device.";
  importFileInput.value = "";
  // console.log(data);
  let promises = [];
  let validData = [];
  // TO DO: do some check to see if day or month is the day as existing data in storage
  let curDate = await browser.storage.local.get({ "date": 0 });
  let curMonth = await browser.storage.local.get({ "month": -1 });
  // console.log(data)
  // console.log(data["month"] + " " + curMonth["month"])
  let isCorrectDate = data["date"] && data["date"] * 1 == curDate["date"] * 1;
  let isCorrectMonth = data["month"] && data["month"] * 1 == curMonth["month"] * 1;
  data = Object.entries(data);


  for (let [k, v] of data) {
    if (isValidKey(k)) {
      promises.push(browser.storage.local.get(k));
      validData.push([k, v]);
      //  console.log(k+" "+v);
    }
  }


  promises = await Promise.all(promises)
  let setPromises = [];
  //promimses is an array of key value pairs that were collected from looking up each key in the import in storage
  for (let i = 0; i < promises.length; i++) {
    //check if the key already exists
    if (typeof promises[i] === "object" && Object.keys(promises[i]).length !== 0) {
      if (validData[i][0].substring(0, 4) === "week") {
        //reimplementation of "combine" function from background.js
        // should be slightly more efficient but might be incorrect depending on the time used for the sort and indexof in the combine function
        let curWeek = promises[i][validData[i][0]].sort(((a, b) => { (Object.keys(a)[0].localeCompare(Object.keys(b)[0])) }));
        let impWeek = validData[i][1].sort(((a, b) => { (Object.keys(a)[0].localeCompare(Object.keys(b)[0])) }));
        let curKeys = curWeek.map((e) => Object.keys(e)[0]);
        //iterate over the array that is being imported
        let minIdx = -1;
        for (let j = 0; j < impWeek.length; j++) {
          //check if the element is already in the storage week list
          let idx = -1;
          let impKey = Object.keys(impWeek[j])[0];
          for (let a = minIdx; a < curKeys.length; a++) {
            if (curKeys[a] === impKey) {
              idx = a;
              break;
            }
          }
          //else: add the element from the imported array to the storage list.
          if (idx == -1)
            curWeek.push(impWeek[j])
          else {
            //if so: add time from imported list to the storage time
            curWeek[idx][impKey] = impWeek[j][impKey] * 1 + 1 * curWeek[idx][impKey];
            minIdx = idx;
          }

        }
        setPromises.push(browser.storage.local.set({
          [validData[i][0]]: curWeek
        }));
      } else if (validData[i][0] === "initdate") {
        setPromises.push(browser.storage.local.set({
          [validData[i][0]]: validData[i][1]
        }));
      }
      else {
        //sum the import and storage values if not week
        setPromises.push(browser.storage.local.set({
          [validData[i][0]]: (1 * validData[i][1] + 1 * promises[i][validData[i][0]])
        }));
      }
      //if the key doesn't exist, add the whole object from the export into storage
    } else {
      setPromises.push(browser.storage.local.set({
        [validData[i][0]]: validData[i][1]
      }));
    }
  }
  await Promise.allSettled(setPromises);

  importResponse.innerText = "Import complete. " + (isCorrectDate ? "Imported data is from the same day, so the data was added to the daily time as well. " : "") + (isCorrectMonth ? "Imported data is from the same month, so the data was added to the month's time as well." : "");
  importFileInput.value = "";

  function isValidKey(k) {
    return k === "initdate" || k.substring(0, 3) === "w##" || (isCorrectMonth && k.substring(0, 3) === "m##")
      || k.substring(0, 3) === "t##" || k.substring(0, 4) === "week"
      || (isCorrectDate && (k.substring(0, 3) === "d##" || k.substring(0, 3) === "t#d"));
    // no guarantee that the export is from the same day as the import - thus needs to check if month/day are the same and only import data if true

  }
}

