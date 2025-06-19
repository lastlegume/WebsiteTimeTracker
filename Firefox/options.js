function saveOptions(e) {
  e.preventDefault();
  browser.storage.local.set({
    'numDisplayed': document.querySelector("#numDisplayed").value,
    'endTime': document.querySelector("#endTime").value
  });
}
function restoreOptions() {
  function setCurrentChoice(result) {
    document.querySelector("#numDisplayed").value = result.numDisplayed || 10;
    document.querySelector("#endTime").value = result.endTime || '00:00';
    //   console.log(result.numDisplayed);
  }

  function onError(error) {
    console.log(`Error: ${error}`);
  }

  let getting = browser.storage.local.get("numDisplayed");
  getting = browser.storage.local.get("endTime");

  getting.then(setCurrentChoice, onError);
}
document.addEventListener("DOMContentLoaded", restoreOptions);
document.querySelector("form").addEventListener("submit", saveOptions);

document.getElementById("export").addEventListener("click", exportData);
document.getElementById("import").addEventListener("click", importData);

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

async function importData(){
  let importFileInput = document.getElementById("importFile");
  if(importFileInput.value===""){
    importResponse.innerText = "Import failed. Please add a file to import";
    return;
  }
  let f = importFileInput.files[0];
  let text = (new FileReader()).readAsText(f);
  console.log(text);
  try {
    data = JSON.parse(text);
  } catch (error) {
    importResponse.innerText = "Import failed. Please add a valid file to import. The file must be in a .txt or .json format as in by the export.";
    return;
  }

}

