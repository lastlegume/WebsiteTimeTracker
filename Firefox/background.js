// Runs every second, stores which website the user is on, what hour it is, and clears old data when necessary

var currentId = -1;
// browser.tabs.onActivated.addListener(() => {
//         console.log('change');
// });
// browser.tabs.onUpdated.addListener(() => {
//     console.log('updated');
// });
browser.windows.onFocusChanged.addListener((windowId) => {
    currentId = windowId;
});
setInterval(addTime, 1000);
function addTime() {
    browser.tabs.query({ currentWindow: true, active: true }).then(logTabs, onError);
}
// async function startDate(){
//     var tabs = await browser.tabs.query({ currentWindow: true, active: true });
//     console.log(tabs[0].url);
// }
function onError() {
    console.log("error");
}

/* 
I was going to add this to the readme but it's excessive and serves better as a reference for the code.
## Technical details
### Storage
The extension stores information about time spent. Because of the nature of the data stored, some amount of redundancy is required to accurately store all of the necessary information. The extension has separate counters for all time per website and all time per hour. Additionally, the extension stores data about the current month, daily usage per site, daily usage per hour, and usage for previous days, all of which are cleared periodically. Each type of data is stored with a specific prefix so that the program knows which type of data it is reading. 
#### Prefixes
```t##[day][site]``` amount of time spent on the browser during the hour during all time

```t#d[day][site]``` - amount of time spent on the browser during the hour on the current day

```w##[site]``` - all time spent on site

```m##[site]``` - time for the current month on site

```d##[site]``` - time for the current day on site

```week[day]``` - array of objects storing all of the sites and how much time was spent on them on day-1. For some reason, week[day] refers to the time spent on the date (day-1), and this won't be changed to maintain backwards compatibility.

#### Special storage codes

```initdate``` - date index for the first day the extension is used. 
```date``` - date index for the current day. 
```month``` - month index for the current month. 


*/





async function logTabs(tabs) {
    if(currentId<0)
        return;
    let ta = new URL(tabs[0].url);
    let t = ta.hostname;
    t = t.replace("www.", "");
    let date = new Date();
    try {
        let endTime = await browser.storage.local.get({ 'endTime': '00:00' });
        var [EThours, ETminutes] = endTime['endTime'].split(':');
    } catch (error) {
        console.log(error);
    }
    //change to make days 'Tfactor'x faster 
    let Tfactor = 1;//24 * 60 * 2;
    var numDate = Math.floor(Tfactor * (date - ((EThours * 60 + ETminutes * 1) + date.getTimezoneOffset()) * 60000) / 86400000);
    var numMonth = date.getMonth();
    try {
        let hour = "t##" + date.getHours();
        let cHour = await browser.storage.local.get({ [hour]: 0 });
        browser.storage.local.set({ [hour]: cHour[hour] + 1 });
        hour = "t#d" + date.getHours();
        cHour = await browser.storage.local.get({ [hour]: 0 });
        browser.storage.local.set({ [hour]: cHour[hour] + 1 });
    }
    catch (error) {
        console.log(error);
    }

    if (t != "") {
        t = "w##" + t;
        try {
            let time = await browser.storage.local.get({ [t]: 0 });
            browser.storage.local.set({ [t]: time[t] + 1 });
        }
        catch (error) {
            console.log(error);
        }

        t = "d##" + t.substring(3);
        try {
            let dtime = await browser.storage.local.get({ [t]: 0 });
            browser.storage.local.set({ [t]: dtime[t] + 1 });
            draw(dtime[t]);
        }
        catch (error) {
            console.log(error);
        }
        t = "m##" + t.substring(3);
        try {
            let mtime = await browser.storage.local.get({ [t]: 0 });
            browser.storage.local.set({ [t]: mtime[t] + 1 });
        }
        catch (error) {
            console.log(error);
        }

    }
    try {
        let temp = await browser.storage.local.get({ 'initdate': numDate });
        //I think the next line is redundant, but I don't want to change it in case it isn't
        browser.storage.local.set({ 'initdate': temp['initdate'] });
        let d = await browser.storage.local.get({ 'date': 0 });
        d = d['date'];
        browser.storage.local.set({ 'date': numDate });
        if (d != numDate) {
            let vals = await browser.storage.local.get();
            vals = Object.keys(vals);
            for (let i = 0; i < vals.length; i++) {
                let j = vals[i];
                // removes relics from a previous version 
                if (j.substring(0, 3) === "y##") {
                    browser.storage.local.remove([j]);
                }
                //clears data from the days more than 10 days before the current day
                if (j.substring(0, 4) === 'week') {
                    let tempDate = j.substring(4);
                    if (tempDate - numDate < -10)
                        browser.storage.local.remove([j]);
                }
            }
            vals = await browser.storage.local.get();
            actvals = Object.values(vals);
            vals = Object.keys(vals);
            week = [];
            for (let i = 0; i < vals.length; i++) {
                let j = vals[i];
                let value = await browser.storage.local.get({ [j]: 0 });
                if (j.substring(0, 3) === "d##" || j.substring(0, 3) === "t#d") {
                    if (j.substring(0, 3) === "d##") {
                        //  browser.storage.local.set({ ['y##' + j.substring(3)]: value[j] });
                        week.push({ [j.substring(3)]: value[j] });
                    }
                    browser.storage.local.remove([j]);
                }
            }
            //console.log(week);
            //it would make a lot more sense if 
            var timeForWeek = await browser.storage.local.get({ ['week' + numDate]: [] });
            // console.log(Object.values(timeForWeek));
            if (Object.values(timeForWeek).length > 0) {
                //   console.log("IMPORTANT MERGE");
                //  console.log(week);
                // console.log(Object.values(timeForWeek)[0]);
                week = combine(week, Object.values(timeForWeek)[0]);
            }
            browser.storage.local.set({ ['week' + numDate]: week });
            browser.storage.local.remove(['week' + (numDate - 7)]);
        }
    }
    catch (error) {
        console.log(error);
    }
    try {
        let m = await browser.storage.local.get({ 'month': 0 });
        m = m['month'];
        if (m != numMonth) {
            let vals = await browser.storage.local.get();
            vals = Object.keys(vals);
            for (let i = 0; i < vals.length; i++) {
                let j = vals[i];
                if (j.substring(0, 3) === "m##") {
                    browser.storage.local.remove([j]);
                }
            }
            browser.storage.local.set({ 'month': numMonth });
        }
    }
    catch (error) {
        console.log(error);
    }
}
function combine(one, two) {
    var keys1 = [];
    var vals1 = [];
    for (let i = 0; i < one.length; i++) {
        keys1.push(Object.keys(one[i])[0]);
        vals1.push(Object.values(one[i])[0]);
    }
    for (let i = 0; i < two.length; i++) {
        let idx = keys1.indexOf(Object.keys(two[i])[0]);
        if (idx == -1)
            one.push(two[i])
        else {
            one[idx] = { [keys1[idx]]: vals1[idx] + Object.values(two[i])[0] };
        }
    }
    //   console.log(one);
    return one;
}
function draw(seconds) {
    var s = Math.round(seconds / 60) + "m";
    var canvas = document.createElement('canvas');
    var context = canvas.getContext('2d');
    context.width = 30;
    context.height = 30;
    let img = new Image();
    img.src = "stopwatch.png";
    context.drawImage(img, 0, 0, 30, 30);
    context.font = '15px Verdana';
    context.fillStyle = 'black';
    context.fillRect(0, 15, 30, 15);
    context.fillStyle = 'white';
    context.fillText(s, 0, 28, 30);
    browser.browserAction.setIcon({
        imageData: context.getImageData(0, 0, 30, 30)
    });
}

