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

async function exportData() {
  let storage = await browser.storage.local.get();
  var file = new File([JSON.stringify(storage)], 'latex.txt', {
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

}

