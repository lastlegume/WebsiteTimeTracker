const totalButton = document.getElementById("total");
const avgButton = document.getElementById("average");
const dayButton = document.getElementById("day");
const weekButton = document.getElementById("week");
const prevButton = document.getElementById("yest");
const monthButton = document.getElementById("month");
const htotalButton = document.getElementById("Htotal");
const havgButton = document.getElementById("Haverage");
const hdayButton = document.getElementById("Hday");
const options = document.getElementById("options");
//show('wTotal Time for Each Website')
show('wTime for Each Website Today')
totalButton.addEventListener('click', () => show('wTotal Time for Each Website'));
avgButton.addEventListener('click', () => show('wAverage Time for Each Website'));
dayButton.addEventListener('click', () => show('wTime for Each Website Today'));
prevButton.addEventListener('click', () => show('wTime for Each Website Yesterday'));
monthButton.addEventListener('click', () => show('wTime for Each Website This Month'));
weekButton.addEventListener('click', () => show('wTime for Each Website This Week'));
htotalButton.addEventListener('click', () => show('Total Time by Hour'));
havgButton.addEventListener('click', () => show('Average Time by Hour'));
hdayButton.addEventListener('click', () => show('Total Time Today by Hour'));
options.addEventListener('click', () => open());



async function show(s) {
    let type = s;
    let vals2 = await browser.storage.local.get();
    vals2 = Object.entries(vals2);
    let vals = [];
    let curDate, initDate;
    for (let i = 0; i < vals2.length; i++) {
        if (vals2[i][0].substring(0, 3) === "w##" && (type === 'wTotal Time for Each Website' || type === 'wAverage Time for Each Website'))
            vals.push([vals2[i][0].substring(3), vals2[i][1]]);
        else if (vals2[i][0].substring(0, 3) === "d##" && type === 'wTime for Each Website Today')
            vals.push([vals2[i][0].substring(3), vals2[i][1]]);
        else if (vals2[i][0] === "week"+(curDate-1) && type === 'wTime for Each Website Yesterday')
            vals = vals2[i][1];
        else if (vals2[i][0].substring(0, 3) === "m##" && type === 'wTime for Each Website This Month')
            vals.push([vals2[i][0].substring(3), vals2[i][1]]);
        else if (vals2[i][0].substring(0, 4) === "week" && type === 'wTime for Each Website This Week')
            vals.push([vals2[i][0].substring(4), vals2[i][1]]);
        else if (vals2[i][0].substring(0, 3) === "t##" && (type === 'Total Time by Hour' || type === 'Average Time by Hour'))
            vals.push([vals2[i][0].substring(3), vals2[i][1]]);
        else if (vals2[i][0].substring(0, 3) === "t#d" && type === 'Total Time Today by Hour')
            vals.push([vals2[i][0].substring(3), vals2[i][1]]);
        else if (vals2[i][0] === "initdate")
            initDate = vals2[i][1];
        else if (vals2[i][0] === "date")
            curDate = vals2[i][1] + 1;
    }
    var error = document.getElementById("error");
    error.textContent = "";
    if (vals.length == 0) {
        if (type === 'wTime for Each Website This Week')
            error.textContent = "Error: No data for the past week"
        if (type === 'wTime for Each Website Yesterday')
            error.textContent = "Error: No data for yesterday"
        else
            error.textContent = "Error: No data"
        return;
    }
    if (type === 'wTime for Each Website Yesterday'){
        for(let i =0;i<vals.length;i++){
            vals[i]=Object.entries(vals[i])[0];
        }
    }
    
    if (type === 'wTime for Each Website This Week') {
        var weekSites = [];
        for (let i = 0; i < vals.length; i++) {
            for (let j = 0; j < vals[i][1].length; j++) {
                weekSites.push(vals[i][1][j]);
            }
        }
        // weekSites = Object.assign({}, ...weekSites);
        //console.log(weekSites);
        weekvals = [];
        weekkeys = [];
        for (let i = 0; i < weekSites.length; i++) {
            weekvals.push(Object.values(weekSites[i])[0]);
            weekkeys.push(Object.keys(weekSites[i])[0]);
        }
        for (let i = 0; i < vals2.length; i++) {
            if (vals2[i][0].substring(0, 3) === 'd##') {
                weekvals.push(vals2[i][1]);
                weekkeys.push(vals2[i][0].substring(3));
            }

        }
        vals = [];
        usedSites = [];
        for (let i = 0; i < weekvals.length; i++) {
            if (!usedSites.includes(weekkeys[i])) {
                usedSites.push(weekkeys[i]);
                vals.push([weekkeys[i], weekvals[i]]);
            }
            else {
                let siteind = getSiteIndex(usedSites, weekkeys[i]);
                let siteval = vals[siteind][1] + weekvals[i];
                vals[siteind] = [weekkeys[i], siteval];
            }
        }
    }
  //  console.log(vals);

    var canvas = document.getElementById("myChart");
    let numDays = curDate - initDate;
    if (canvas != null)
        canvas.parentNode.removeChild(canvas);
    var numShown = await browser.storage.local.get("numDisplayed");
    numShown = numShown['numDisplayed']-1;
  //  console.log(numShown);
    if (isNaN(numShown))
        numShown = 9;
    const can = document.createElement('canvas');
    can.id = "myChart";
    can.width = "500";
    can.height = "300";
    canvas = document.getElementById("table");
    if (canvas != null)
        canvas.parentNode.removeChild(canvas);
    const table = document.createElement('table');
    table.id = "table";
    document.body.appendChild(can);
    if (type.substring(0, 1) === "w") {
        vals.sort((a, b) => { return b[1] - a[1] });
        if (type.includes("Average") && numDays != 0) {
            for (let i = 0; i < vals.length; i++)
                vals[i] = [vals[i][0], Math.round(vals[i][1] / numDays)];
            type += (" (Over " + numDays + " day") + (numDays > 1 ? "s)" : ")");
        }
        if (type.includes("Total") && numDays != 0)
            type += " (Over " + numDays + " day" + (numDays > 1 ? "s)" : ")");
        let sec = [];
        for (let i = 0; i < numShown && i < vals.length; i++)
            sec.push(vals[i][1]);
        let lab = [];
        for (let i = 0; i < numShown && i < vals.length; i++)
            if (sec[i] > 0)
                lab.push(vals[i][0]);
        let sum = 0;
        if (vals.length > numShown + 1) {
            for (let i = numShown; i < vals.length; i++)
                sum += vals[i][1];
            let ind = -1;
            for (let i = 0; i < numShown && ind === -1; i++)
                if (sum > sec[i])
                    ind = i;
            sec.splice(ind, 0, sum);
            lab.splice(ind, 0, "Other");
        }
        let othersum = sum;
        //  for (let i = 0; i < numShown + 1 && i < lab.length; i++)
        //     lab[i] = createReadableTime(sec[i]) + " - " + lab[i];
        sum = 0;
        for (let i = 0; i < numShown + 1 && i < sec.length; i++)
            sum += sec[i];


        var colors = ['#ff595e', '#ff924c', '#ffca3a', '#c5ca30', '#8ac926', '#52a675', '#1982c4', '#5685dd', '#967bb9', '#b5a6c9'];
        var letters = "0123456789ABCDEF";
        for (let nCs = 0; nCs < numShown -10; nCs++) {
            let col = "#";
            for (let j = 0; j < 6; j++) {
                col += letters[Math.floor(Math.random() * 16)];
            }
            colors.push(col);
        }
//        console.log(colors);


        type = createReadableTime(sum) + " - " + type.substring(1);
        for (let i = 0; i < numShown + 1 && i < sec.length; i++)
            sec[i] = Math.round((sec[i] / sum) * 10000) / 100;
        const graph = new Chart(can, {
            type: "pie",
            data: {
                labels: lab,
                datasets: [{
                    backgroundColor: colors,
                    data: sec
                }]
            },
            options: {
                responsive: true,
                animation: {
                    duration: 500,
                    animateScale: true,
                },
                title: {
                    display: true,
                    text: [type]
                },
                legend: {
                    display: true,
                    position: "right",
                },
                elements: {
                    arc: {
                        borderWidth: 0
                    }
                },
                tooltips: {
                    callbacks: {
                        title: function (tooltipItem, data) {
                            return data['labels'][tooltipItem[0]['index']];
                        },
                        label: function (tooltipItem, data) {
                            return data['datasets'][0]['data'][tooltipItem['index']] + "%";
                        }

                    }
                }


            }
        });
        let vals3 = [];
        for (let i = 0; i < vals.length && i < numShown; i++)
            vals3.push([vals[i][0], createReadableTime(vals[i][1])]);
        if (sec.length > numShown) {
            vals3.push(["Other", createReadableTime(othersum)]);
        }
        vals3.push(["Total", createReadableTime(sum)]);
        generateTable(table, ["Website", "Time Spent"], vals3, colors[Math.round(Math.random() * (vals3.length - 2))]);
        document.body.appendChild(table);
    }
    else {
        let times = [];
        let secs = [];
        vals.sort((a, b) => { return parseInt(a[0], 10) - parseInt(b[0], 10) });
        if (type.includes("Average") && numDays != 0) {
            for (let i = 0; i < vals.length; i++)
                vals[i] = [vals[i][0], Math.round(vals[i][1] / numDays)];
            type += " (Over " + numDays + " day" + (numDays > 1 ? "s)" : ")");
        }
        if (type.includes("Total") && numDays != 0)
            type += " (Over " + numDays + " day" + (numDays > 1 ? "s)" : ")");
        for (let i = 0; i < vals.length; i++) {
            times.push(vals[i][0]);
            secs.push(vals[i][1]);
        }


        let sum = 0;
        for (let i = 0; i < secs.length; i++)
            sum += secs[i];
        for (let i = 0; i < secs.length; i++)
            secs[i] = Math.round((secs[i] / sum) * 10000) / 100;
        let colors = ['#FF0000', '#FF4000', '#FF8000', '#FFC000', '#FFFF00', '#D5FF00', '#AAFF00', '#80FF00', '#40FF00', '#00FF00', '#00FF40', '#00FF80', '#00FFC0', '#00FFFF', '#00C0FF', '#0080FF', '#0040FF', '#0000FF', '#4000FF', '#8000FF', '#C000FF', '#FF00FF', '#FF00C0', '#FF0080'];
        const graph = new Chart(can, {
            type: "bar",
            data: {
                labels: times,
                maxBarThickness: 5,
                datasets: [{
                    backgroundColor: colors,
                    data: secs
                }]
            },
            options: {
                animation: {
                    duration: 500,
                },
                scales: {
                    yAxes: [{
                        ticks: {
                            beginAtZero: true
                        },
                        scaleLabel: {
                            display: true,
                            labelString: 'Percent of Time'
                        }
                    }],
                    xAxes: [{
                        scaleLabel: {
                            display: true,
                            labelString: 'Hour'
                        }
                    }]

                },
                title: {
                    display: true,
                    text: [type]
                },
                legend: {
                    display: false
                },
                tooltips: {
                    callbacks: {
                        label: function (tooltipItems, data) {
                            return tooltipItems.yLabel + '%';
                        }
                    }

                }

            }
        });
        for (let i = 0; i < vals.length; i++)
            vals[i] = [vals[i][0], createReadableTime(vals[i][1])]
        vals.push(["Total", createReadableTime(sum)]);
        generateTable(table, ["Hour", "Time Spent"], vals, colors[Math.round(Math.random() * (vals.length - 2))]);
        document.body.appendChild(table);

    }
}
function createReadableTime(t) {
    let time = "";
    if (t > 0) {
        if (t >= 3600) {
            time += Math.floor(t / 3600);
            t = t % 3600;
            if (t != 0)
                time += "h, ";
            else
                time += "h";
        }
        if (t >= 60) {
            time += Math.floor(t / 60);
            t = t % 60;
            if (t != 0)
                time += "min, ";
            else
                time += "min";
        }
        if (t != 0)
            time += t + "s";
    }
    else
        time = '<1s';
    return time;

}
function generateTable(table, headers, data, col) {
    let thead = table.createTHead();
    let row = thead.insertRow();
    for (let k of headers) {
        let th = document.createElement("th");
        th.style.setProperty('background-color', col);
        let text = document.createTextNode(k);
        th.appendChild(text);
        row.appendChild(th);
    }
    for (let r of data) {
        let row = table.insertRow();
        for (let col of r) {
            let cell = row.insertCell();
            let text = document.createTextNode(col);
            cell.appendChild(text);
        }
    }
    totalButton.style.setProperty('background-color', col);
    htotalButton.style.setProperty('background-color', col);
    dayButton.style.setProperty('background-color', col);
    prevButton.style.setProperty('background-color', col);
    monthButton.style.setProperty('background-color', col);
    weekButton.style.setProperty('background-color', col);
    hdayButton.style.setProperty('background-color', col);
    avgButton.style.setProperty('background-color', col);
    havgButton.style.setProperty('background-color', col);
    options.style.setProperty('background-color', col);


}
function getSiteIndex(arr, key) {
    for (let i = 0; i < arr.length; i++) {
        if (arr[i] === key)
            return i;
    }
    return -1;
}

function open() {
    let page = browser.runtime.openOptionsPage();
    page.then();
}
