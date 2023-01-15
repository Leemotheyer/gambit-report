var apiKey = "8277ba23a9f74fcd89b8e92467609e75";
var quickUser = ""; //set this to a player name to quick load them

var rankDict = [
    "Guardian I",
    "Guardian II",
    "Guardian III",
    "Brave I",
    "Brave II",
    "Brave III",
    "Heroic I",
    "Heroic II",
    "Heroic III",
    "Fabled I",
    "Fabled II",
    "Fabled III",
    "Mythic I",
    "Mythic II",
    "Mythic III",
    "Legend",
    "Max Rank"
];
var count = 30;

//function to get the data from the API using a given url
async function apiFetch(url) {
    var response = await fetch(url, {
        method: "GET",
        headers: {
            "X-API-Key": apiKey
        }
    });
    var data = await response.json();
    return data;
}

async function searchAccountID() {
    var player = document.getElementById("search-bar").value;
      //error handling for empty search bar
      if (player == "") {
          alert("Please enter a player name");
          return;
      }
      else{
          var newName = player.replace(/#/, '%23');
          var url = "https://www.bungie.net/Platform/Destiny2/SearchDestinyPlayer/all/" + newName + "/";
          var data = await apiFetch(url);
          //error handling for player not found
          if (data.ErrorCode == 217) {
              alert(data.Message);
              return;
          }
          //check is data.response is empty
          else if(data.Response.length == 0) {
              alert("Player not found");
              return;
          }
          else {
              var accountID = data.Response[0].membershipId;
              var membershipType = data.Response[0].membershipType;
              //return the values
              return [accountID, membershipType];
          }
      }
}

async function getCharacterID(accountID) {
    var url = "https://www.bungie.net/Platform/Destiny2/" + accountID[1] + "/Account/" + accountID[0] + "/Stats/?groups=102";
    var data = await apiFetch(url);
    var characterIDJson = data.Response.characters;
    //put character id's into an array
    var characterID = [];
    for (var i in characterIDJson) {
        characterID.push(characterIDJson[i].characterId);
    }
    return characterID;
}

if (quickUser != "") {
    document.getElementById("quickLoad").style.display = "block";
    //set text of quickLoad button to quickUser
    document.getElementById("quickLoad").innerHTML = "Search: " + quickUser;
}
async function searchMe() {
    document.getElementById("search-bar").value = quickUser;
    document.getElementById("quickLoad").style.display = "none";
    run();
}

async function getLastChar(accountID, charID) {
    lastAct = [];
    //loop through characterID array and get the latest activity for each character
    for (var i = 0; i < charID.length; i++) {
        var url = "https://www.bungie.net/Platform/Destiny2/" + accountID[1] + "/Account/" + accountID[0] + "/Character/" + charID[i] + "/Stats/Activities/?count=1&mode=0";
        var data = await apiFetch(url);
        act = data.Response.activities[0];
        lastAct.push(act);
        //if undefined break the loop
        if (data.Response.activities == undefined) {
            break;
        }
    }
    //find which activity in lastAct has the highest date
    let mostRecentIndex = -1;
    let mostRecentDate = new Date(0);

    lastAct.forEach((lastAct, index) => {
        let activityDate = new Date(lastAct.period);
        if (activityDate > mostRecentDate) {
            mostRecentIndex = index;
            mostRecentDate = activityDate;
        }
    });
    //return the activity with the highest date
    return charID[mostRecentIndex];
}

async function getGambitMatches(accountID, charID) {
    var url = "https://www.bungie.net/Platform/Destiny2/" + accountID[1] + "/Account/" + accountID[0] + "/Character/" + charID + "/Stats/Activities/?count=250&mode=gambit";
    var data = await apiFetch(url);
    return data.Response.activities;
}

async function makeTable(gambitMatches) {
    //make a html table filled with the data from the gambitMatches array
    var table = document.getElementById("gambitTable");
    for (var i = 0; i < 30; i++) {
        var row = table.insertRow(i + 1);
        var standing = row.insertCell(0);
        var kills = row.insertCell(1);
        var deaths = row.insertCell(2);
        var duration = row.insertCell(3);
        //add data to the table
        standing.innerHTML = gambitMatches[i].values.standing.basic.displayValue;
        kills.innerHTML = gambitMatches[i].values.opponentsDefeated.basic.displayValue;
        deaths.innerHTML = gambitMatches[i].values.deaths.basic.displayValue;
        duration.innerHTML = gambitMatches[i].values.activityDurationSeconds.basic.displayValue;
    }
    //make every row with Victory have a green background color
    for (var i = 1; i < table.rows.length; i++) {
        if (table.rows[i].cells[0].innerHTML == "Victory") {
            table.rows[i].style.backgroundColor = "rgb(34, 175, 144)";
        }
        if (table.rows[i].cells[0].innerHTML == "Defeat") {
            table.rows[i].style.backgroundColor = "rgb(210, 42, 47)";
        }
    }
}

async function getGambitRank(accountID, lastChar) {
    var url = "https://www.bungie.net/Platform/Destiny2/" + accountID[1] + "/Profile/" + accountID[0] + "?components=202";
    var data = await apiFetch(url);
    var getGambitRankData = data.Response.characterProgressions.data[lastChar].progressions["3008065600"];
    return getGambitRankData;
}

async function moreStats(accountID) {
    var url = "https://www.bungie.net/Platform/Destiny2/" + accountID[1] + "/Profile/" + accountID[0] + "/?components=1100";
    var data = await apiFetch(url);
    console.log(data);
    var totalWins = data.Response.metrics.data.metrics["3587221881"].objectiveProgress.progress;
    var totalSealGild = data.Response.metrics.data.metrics["2365336843"].objectiveProgress.progress
    var totalResets = data.Response.metrics.data.metrics["1963785799"].objectiveProgress.progress
    var statMetrics = [totalWins, totalSealGild, totalResets];
    return statMetrics;
}

async function avgStats(gambitMatches) {
    var totalKills = 0;
    var totalDeaths = 0;
    var totalDuration = 0;
    for (var i = 0; i < count; i++) {
        totalKills += parseInt(gambitMatches[i].values.opponentsDefeated.basic.value);
        totalDeaths += parseInt(gambitMatches[i].values.deaths.basic.value);
        totalDuration += parseInt(gambitMatches[i].values.activityDurationSeconds.basic.value);
    }
    var avgKills = totalKills / count;
    var avgDeaths = totalDeaths / count;
    var avgDuration = totalDuration / count;
    //to.fixed(2) rounds to 2 decimal places
    avgKills = avgKills.toFixed(2);
    avgDeaths = avgDeaths.toFixed(2);
    //convert avgDuration to minutes and seconds
    var minutes = Math.floor(avgDuration / 60);
    var seconds = avgDuration % 60;
    seconds = seconds.toFixed(0);
    avgDuration = minutes + "m " + seconds + "s";

    //calculate victory percentage
    var victoryCount = 0;
    for (var i = 0; i < count; i++) {
        if (gambitMatches[i].values.standing.basic.value == 0) {
            victoryCount++;
        }
    }
    var winPercent = victoryCount / count * 100;
    winPercent = winPercent.toFixed(2);
    var avgStat = [avgKills, avgDeaths, avgDuration, winPercent];
    return avgStat;
}

async function showGambitRankData(getGambitRankData, statMetrics, avgStat) {
    //show data from getGambitRankData in the rankStats element
    var rankStats = document.getElementById("rankStats");
    var metricsH1 = document.getElementById("metricsH1");
    var metrics = document.getElementById("metrics");

    var rankNum = "Gambit Rank: " + rankDict[getGambitRankData.level] + " (" + getGambitRankData.level + "/16)";
    var rankProgress = "Rank Progress: " + getGambitRankData.progressToNextLevel + "/" + getGambitRankData.nextLevelAt;
    var resetProgress = "Reset Progress: " + getGambitRankData.currentProgress + "/10000";
    var progressBar = document.createElement("progress");
    progressBar.setAttribute("value", getGambitRankData.currentProgress);
    progressBar.setAttribute("max", "10000");
    var totalResets = "Total Resets: " + statMetrics[2];
    var totalGilds = "Total Dredgen Gildings: " + statMetrics[1];
    var totalWins = "Total Wins: " + statMetrics[0] //only season 10 onwards
    var avgKills = "Average Kills: " + avgStat[0];
    var avgDeaths = "Average Deaths: " + avgStat[1];
    var avgDuration = "Average Duration: " + avgStat[2];
    var avgWinPercent = "Average Win Percentage: " + avgStat[3] + "%";

    rankStats.innerHTML = rankNum + " <br> " + rankProgress + " <br> " + resetProgress + " <br> " + progressBar.outerHTML
    metricsH1.innerHTML = "Metrics";
    metrics.innerHTML = totalResets + " <br> " + totalGilds + " <br> " + totalWins
    avgH1.innerHTML = "Average Stats";
    avg.innerHTML = avgKills + " <br> " + avgDeaths + " <br> " + avgDuration + " <br> " + avgWinPercent;
}

async function setHeader(accountID, lastChar) {
    var playerName = document.getElementById("search-bar").value;
    var url = "https://www.bungie.net/Platform/Destiny2/" + accountID[1] + "/Profile/" + accountID[0] + "?components=200";
    var data = await apiFetch(url);
    emblem = data.Response.characters.data[lastChar].emblemPath;
    document.getElementById("emblem").src = "https://www.bungie.net" + emblem;
    document.getElementById("player").innerHTML = playerName;
}

async function run() {
    accountID = await searchAccountID();
    console.log(accountID);
    document.getElementById("search").style.display = "none";
    document.getElementById("stats").style.display = "block";
    document.getElementById("table").style.display = "block";
    charID = await getCharacterID(accountID);
    console.log(charID);
    lastChar = await getLastChar(accountID, charID);
    console.log(lastChar);
    await setHeader(accountID, lastChar);
    gambitMatches = await getGambitMatches(accountID, lastChar);
    console.log(gambitMatches);
    await makeTable(gambitMatches);
    getGambitRankData = await getGambitRank(accountID, lastChar);
    console.log(getGambitRankData);
    statMetrics = await moreStats(accountID);
    console.log(statMetrics);
    avgStat = await avgStats(gambitMatches);
    console.log(avgStat);
    await showGambitRankData(getGambitRankData, statMetrics, avgStat);
}