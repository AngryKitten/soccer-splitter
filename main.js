let mainRef;
let tempRef;
let parsedTeamList = {};
let activeTeamName;
let preRunState;
let tempStringForExport;
const rotations = 6;

/*
  Team object:
  teamName: {
    players: [{
      name: string,
      timesNotPlayed: number
    }],
    games: [{
      groups: [[]], - Second level amount based on number of rotations.
      created: string - Date/time created.
    }]
  }
*/

(function () {
  mainRef = document.getElementById('main');
  setBaseHtml();
})();

/*
  Sets Base HTML for initial page load and selection.
  Options for creating a new team, importing team data, or selecting an existing team.
*/
function setBaseHtml() {
  mainRef.innerHTML = `
    <h1>Create a new team:</h1>
    <div><input id="team-name" placeholder="Team Name" type="text"></div>
    <div id="new-team-step-one">
      <div><input id="player-amount-input" inputmode="numeric" placeholder="Number of players" type="tel"></div>
      <button onclick="generatePlayerEntry()">Next</button>
      <div class="import-button-container">
        <button class="import-button" onclick="showImportOption()">Import Team Data</button>
      </div>
    </div>
    <div id="existing-teams"></div>`;
  const teamList = localStorage.getItem('teams');
  if (teamList !== null) {
    parsedTeamList = JSON.parse(teamList);
    buildTeamList();
  }
}

/*
  Generates number of inputs for player names based on previously entered number.
*/
function generatePlayerEntry() {
  document.getElementById('existing-teams').remove();
  for (let i = 0; i < document.getElementById('player-amount-input').value; i++) {
    mainRef.insertAdjacentHTML('beforeend', '<div><input type="text" class="player-name-input" placeholder="Player Name"></div>');
  }
  mainRef.insertAdjacentHTML('beforeend', `
    <div class="flex-container">
      <button class="half" onclick="setBaseHtml()">Cancel</button>
      <button class="half" onclick="createTeam();setBaseHtml()">Create</button>
    </div>`);
  document.getElementById('new-team-step-one').remove();
}

/*
  Provides the option to import raw team data by pasting exported team data.
*/
function showImportOption() {
  mainRef.innerHTML = `
    <button class="back-button" onclick="setBaseHtml()">Back</button>
    <h1>Import Team Data</h1>
    <h4>Note: if team name is identical to existing team name, existing team data will be overwritten.</h4>
    <div><input id="import-input" placeholder="Paste raw data here..."></div>
    <button class="margin-top" onclick="saveImportedTeam()">Import</button>`;
}

/*
  Saves the imported raw team data as a new team or overrides the existing one.
*/
function saveImportedTeam() {
  const importTeam = JSON.parse(document.getElementById('import-input').value);
  const importTeamName = importTeam.teamName;
  delete importTeam.teamName;
  parsedTeamList[importTeamName] = importTeam;
  localStorage.setItem('teams', JSON.stringify(parsedTeamList));
  setBaseHtml();
}

/*
  Initializes the team object and adds all the players to the team.
  Saves the team to localStorage.
*/
function createTeam() {
  activeTeamName = document.getElementById('team-name').value;
  const team = {
    [activeTeamName]: {
      players: [...document.getElementsByClassName('player-name-input')].map(input => {
        return {
          name: input.value,
          timesNotPlayed: 0
        };
      }),
      games: []
    }
  };
  let teamList = localStorage.getItem('teams');
  if (teamList !== null) {
    parsedTeamList = Object.assign({}, JSON.parse(teamList), team);
  } else {
    parsedTeamList = team;
  }
  localStorage.setItem('teams', JSON.stringify(parsedTeamList));
}

/*
  Creates list of existing teams and shows options.
  Options include:
  Run Game - Player selection and group creation.
  Edit Team - Allows editing team name and times a player has not played.
  Delete Team - Permanently removes all data for a team.
*/
function buildTeamList() {
  let teamsListHtml = '';
  Object.keys(parsedTeamList).forEach(teamName => {
    teamsListHtml += `
    <div class="team-selection">
      <div class="select-team-header">${teamName}</div>
      <div class="team-buttons">
        <div class="select-team-column">
          <button onclick="activeTeamName = '${teamName}';exportTeam()">Export Team</button>
          <button class="margin-top" onclick="activeTeamName = '${teamName}';generatePlayerSelection(false)">Run Game</button>
        </div>
        <div class="select-team-column">
          <button onclick="activeTeamName = '${teamName}';editTeam()">Edit Team</button>
          <button class="margin-top" onclick="deleteTeam('${teamName}')">Delete Team</button>
        </div>
      </div>
    </div>`;
  });
  document.getElementById('existing-teams').innerHTML = `
    <h1>Or select an existing team:</h1>
    ${teamsListHtml}`;
}

/*
  Shows raw team data which can be copied for import.
*/
function exportTeam() {
  tempStringForExport = JSON.stringify(Object.assign({}, parsedTeamList[activeTeamName], { teamName: activeTeamName }));
  mainRef.innerHTML = `
    <button class="back-button" onclick="setBaseHtml()">Back</button>
    <div id="export-data">${tempStringForExport}</div>
    <button id="copy-export-button" onclick="copyExportData()">Copy</button>`
}

/*
  Copies raw team data to clipboard for easy copy + paste.
*/
function copyExportData() {
  navigator.clipboard.writeText(tempStringForExport);
  document.getElementById('copy-export-button').innerHTML = 'Copied!';
}

/*
  Creates list of players with checkboxes to select which players are present for the game.
  Provides input to indicate the number of players to put into each group.
  Gives option to either automatically randomize groups or manually create them.
*/
function generatePlayerSelection(fromInGame) {
  if (fromInGame) {
    parsedTeamList[activeTeamName] = JSON.parse(JSON.stringify(preRunState));
    localStorage.setItem('teams', JSON.stringify(parsedTeamList));
  }
  let team = parsedTeamList[activeTeamName];
  mainRef.innerHTML = `
    <button class="back-button" onclick="setBaseHtml()">Back</button>
    <div class="margin-bottom">
      <button onclick="selectAll()">Select All</button>
    </div>`;
  for (let i = 0; i < team.players.length; i++) {
    mainRef.innerHTML += `
      <div class="checkbox-container">
        <input type="checkbox" id="player-${i}-checkbox" value="${i}" class="player-selection-checkbox">
        <label for="player-${i}-checkbox">${team.players[i].name}</label>
      </div>`;
  }
  mainRef.innerHTML += `
    <h2>Enter the number of players on the field at a time:</h2>
    <div>
      <input id="players-on-field" inputmode="numeric" placeholder="Players on field" type="tel">
    </div>
    <div>
      <button onclick="manuallyCreateGroups()">Manual Groups</button>
      <button class="margin-top" onclick="generateGroups()">Random Groups</button>
    </div>`;
}

/*
  Checks all unchecked boxes.
*/
function selectAll() {
  [...document.querySelectorAll('.player-selection-checkbox:not(:checked)')].forEach(checkbox => {
    checkbox.click();
  });
}

/*
  Builds UI for creating groups manually.
*/
function manuallyCreateGroups() {
  const playersOnField = document.getElementById('players-on-field').value;
  tempRef = [...document.querySelectorAll('.player-selection-checkbox:checked')].map(checkbox => checkbox.value);
  let optionsBuilder = '';
  tempRef.map(playerIndex => {
    return {
      playerIndex,
      playerName: parsedTeamList[activeTeamName].players[playerIndex].name
    };
  }).forEach(player => {
    optionsBuilder += `<option value="${player.playerIndex}">${player.playerName}`;
  });
  mainRef.innerHTML = '';
  for (let i = 0; i < rotations; i++) {
    mainRef.innerHTML += `<div class="group-header">Group ${i + 1}</div>`;
    for (let j = 0; j < playersOnField; j++) {
      mainRef.innerHTML += `<div>
        <select type="text" class="group-player-select">
          ${optionsBuilder}
        </select>
      </div>`;
    }
  }
  mainRef.innerHTML += `<div class="group-header group-outlier">Outliers</div><div id="group-outliers"></div><div><button onclick="addOutlier()">Add Least Playing Player</button></div>`;
  mainRef.innerHTML += `<div><button onclick="saveGroup(${playersOnField})">Save</button></div>`;
}

/*
  Have to manually add outliers also.
*/
function addOutlier() {
  let optionsBuilder = '';
  tempRef.map(playerIndex => {
    return {
      playerIndex,
      playerName: parsedTeamList[activeTeamName].players[playerIndex].name
    };
  }).forEach(player => {
    optionsBuilder += `<option value="${player.playerIndex}">${player.playerName}`;
  });
  const docRef = document.getElementById('group-outliers');
  docRef.insertAdjacentHTML('beforeend', `<div>
    <select type="text" class="group-outlier-select">
      ${optionsBuilder}
    </select>
  </div>`);
}

/*
  Saves the manually created group and builds the UI for running.
*/
function saveGroup(playersOnField) {
  const fullPlayerList = [...document.getElementsByClassName('group-player-select')].map(playerSelect => playerSelect.value);
  const outliers = [...document.getElementsByClassName('group-outlier-select')].map(playerSelect => playerSelect.value);
  const groups = createGroupsHelper(fullPlayerList, playersOnField);
  parsedTeamList[activeTeamName].games.push({ groups });
  outliers.forEach(outlier => {
    parsedTeamList[activeTeamName].players[outlier].timesNotPlayed = parseInt(parsedTeamList[activeTeamName].players[outlier].timesNotPlayed) + 1;
  });
  localStorage.setItem('teams', JSON.stringify(parsedTeamList));
}

/*
  Permanently deletes a team.
*/
function deleteTeam(teamName) {
  if (confirm(`Are you sure you want to delete ${teamName}?`)) {
    delete parsedTeamList[teamName];
    if (Object.keys(parsedTeamList).length === 0) {
      localStorage.removeItem('teams');
    } else {
      localStorage.setItem('teams', JSON.stringify(parsedTeamList));
    }
    setBaseHtml();
  }
}

/*
  Builds UI to enable editing of team name and individual times not played.
*/
function editTeam() {
  mainRef.innerHTML = `<button class="back-button" onclick="setBaseHtml()">Back</button>
    <div class="edit-row">
      Team Name:<input id="new-team-name" placeholder="Team Name" type="text" value="${activeTeamName}">
    </div>
    <h2>Edit number of times not played:</h2>`;
  const playersRef = parsedTeamList[activeTeamName].players;
  for (let i = 0; i < playersRef.length; i++) {
    mainRef.innerHTML += `<div class="edit-row">
        <div class="times-not-played-name">${playersRef[i].name}</div>
        <input id="${i}" placeholder="Times Not Played" type="text" class="times-not-played-input" value="${playersRef[i].timesNotPlayed}">
      </div>`;
  }
  mainRef.innerHTML += `<div class="align-right"><button onclick="saveTeam()">Save Team</button></div>`;
}

/*
  Saves team after finished editing.
*/
function saveTeam() {
  newTeamName = document.getElementById('new-team-name').value;
  team = {
    [newTeamName]: {
      players: [...document.getElementsByClassName('times-not-played-input')].map(input => {
        return {
          name: parsedTeamList[activeTeamName].players[input.id].name,
          timesNotPlayed: parseInt(input.value)
        };
      }),
      games: JSON.parse(JSON.stringify(parsedTeamList[activeTeamName].games))
    }
  };
  parsedTeamList = Object.assign({}, parsedTeamList, team);
  if (activeTeamName !== newTeamName) {
    delete parsedTeamList[activeTeamName];
  }
  localStorage.setItem('teams', JSON.stringify(parsedTeamList));
  setBaseHtml();
}

/*
  Generates randomized groups.
*/
function generateGroups() {
  const randomizerGroups = [];
  const highestTimesNotPlayedValue = Math.max(...parsedTeamList[activeTeamName].players.map(player => player.timesNotPlayed));
  const selectedPlayersGlobalSet = [...document.querySelectorAll('.player-selection-checkbox:checked')].map(checkbox => checkbox.value).map(selectedPlayer => parsedTeamList[activeTeamName].players[selectedPlayer]);
  for (let i = highestTimesNotPlayedValue; i >= 0; i--) {
    const filteredPlayersList = selectedPlayersGlobalSet.filter(selectedGlobalPlayer => parseInt(selectedGlobalPlayer.timesNotPlayed) === i);
    if (filteredPlayersList.length !== 0) {
      let filteredPlayerIndexes = filteredPlayersList.map(filteredPlayer => parsedTeamList[activeTeamName].players.findIndex(player => player.name === filteredPlayer.name));
      randomizerGroups.push(filteredPlayerIndexes);
    }
  }
  let randomizedPlayers = [];
  randomizerGroups.forEach(randomizerGroup => {
    randomizedPlayers = [...randomizedPlayers, ...randomize(randomizerGroup)];
  });
  const playersOnField = document.getElementById('players-on-field').value;
  tempRandomizedPlayers = JSON.parse(JSON.stringify(randomizedPlayers));
  while (tempRandomizedPlayers.length < playersOnField * rotations) {
    tempRandomizedPlayers = [...tempRandomizedPlayers, ...randomizedPlayers];
  }
  randomizedPlayers = JSON.parse(JSON.stringify(tempRandomizedPlayers));
  const numOutliers = randomizedPlayers.length - (playersOnField * rotations);
  outliers = [...randomizedPlayers.slice(randomizedPlayers.length - numOutliers, randomizedPlayers.length), ...[...document.querySelectorAll('.player-selection-checkbox:not(:checked)')].map(checkbox => checkbox.value)];
  const groups = createGroupsHelper(randomizedPlayers, playersOnField);
  mainRef.insertAdjacentHTML('afterbegin', '<button class="back-button" onclick="generatePlayerSelection(true)">Back</button>');
  preRunState = JSON.parse(JSON.stringify(parsedTeamList[activeTeamName]));
  parsedTeamList[activeTeamName].games.push({ groups });
  outliers.forEach(outlier => {
    parsedTeamList[activeTeamName].players[outlier].timesNotPlayed = parseInt(parsedTeamList[activeTeamName].players[outlier].timesNotPlayed) + 1;
  });
  localStorage.setItem('teams', JSON.stringify(parsedTeamList));
}

/*
  Builds UI for running the game.
*/
function createGroupsHelper(playerList, playersOnField) {
  const groups = [[], [], [], [], [], []];
  mainRef.innerHTML = '';
  for (let i = 0; i < rotations; i++) {
    if (i === 3) {
      mainRef.innerHTML += '<div class="halftime-splitter">-- Half-Time --</div>';
    }
    mainRef.innerHTML += `<div class="group-header">Group ${i + 1}</div>`;
    let htmlBuilder = '<ol class="group-players">';
    for (let j = 0; j < playersOnField; j++) {
      const computatedIndex = (i * playersOnField) + j;
      htmlBuilder += `<li class="group-player">${parsedTeamList[activeTeamName].players[playerList[computatedIndex]].name}</li>`;
      groups[i].push(playerList[computatedIndex]);
    }
    htmlBuilder += '</ol>';
    mainRef.innerHTML += htmlBuilder;
  }
  return groups;
}

/*
  Randomizer for building groups.
*/
function randomize(array) {
  let currentIndex = array.length, temporaryValue, randomIndex;
  while (0 !== currentIndex) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }
  return array;
}