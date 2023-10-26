let parsedTeamList = {};
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

(function() {
  const teamList = localStorage.getItem('teams');
  if (teamList !== null) {
    parsedTeamList = JSON.parse(teamList);
    buildTeamList();
  }
})();

function buildTeamList() {
  document.getElementById('existing-teams').innerHTML = '<h3>Or select an existing team:</h3>';
  Object.keys(parsedTeamList).forEach(teamName => {
    document.getElementById('existing-teams').innerHTML += `<div class="team-selection">
      <button onclick="generatePlayerSelection('${teamName}')">${teamName}</button>
      <button class="team-button" onclick="editTeam('${teamName}')">Edit Team</button>
      <button class="team-button" onclick="deleteTeam('${teamName}')">Delete Team (THERE'S NO GOING BACK FROM THIS)</button>
    </div>`;
  });
}

function deleteTeam(teamName) {
  delete parsedTeamList[teamName];
  localStorage.setItem('teams', JSON.stringify(parsedTeamList));
  buildTeamList();
}

function editTeam(teamName) {
  setSectionNotHidden('flex-container');
  const docRef = document.getElementById('flex-container');
  docRef.innerHTML = `<div class="edit-row">Team Name:<input id="new-team-name" placeholder="Team Name" type="text" value="${teamName}"></div><h3>Edit number of times not played:</h3>`;
  const playersRef = parsedTeamList[teamName].players;
  for (let i = 0; i < playersRef.length; i++) {
    docRef.innerHTML += `<div class="edit-row">${playersRef[i].name}<input id="${i}" placeholder="Times Not Played" type="text" class="times-not-played-input" value="${playersRef[i].timesNotPlayed}"></div>`;
  }
  docRef.innerHTML += `<div class="align-right"><button onclick="saveTeam('${teamName}')">Save Team</button></div>`;
}

function saveTeam(teamName) {
  newTeamName = document.getElementById('new-team-name').value;
  team = {
    [newTeamName]: {
      players: [...document.getElementsByClassName('times-not-played-input')].map(input => {
        return {
          name: parsedTeamList[teamName].players[input.id].name,
          timesNotPlayed: parseInt(input.value)
        };
      }),
      games: JSON.parse(JSON.stringify(parsedTeamList[teamName].games))
    }
  };
  parsedTeamList = Object.assign({}, parsedTeamList, team);
  if (teamName !== newTeamName) {
    delete parsedTeamList[teamName];
  }
  localStorage.setItem('teams', JSON.stringify(parsedTeamList));
  setSectionNotHidden('player-amount');
  buildTeamList();
}

function generatePlayerEntry() {
  setSectionNotHidden('player-names');
  for (let i = 0; i < document.getElementById('player-amount-input').value; i++) {
    document.getElementById('player-names').innerHTML += '<div><input type="text" class="player-name-input"></div>';
  }
  document.getElementById('player-names').innerHTML += '<div><button onclick="generatePlayerSelection()">Next</button></div>';
}

function generatePlayerSelection(teamName) {
  if (teamName === undefined) {
    teamName = document.getElementById('team-name').value;
    team = {
      [teamName]: {
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
      JSON.parse(teamList)[teamName] = {
        players: [...document.getElementsByClassName('player-name-input')].map(input => {
          return {
            name: input.value,
            timesNotPlayed: 0
          };
        }),
        games: []
      };
    } else {
      teamList = team;
    }
    parsedTeamList = Object.assign({}, parsedTeamList, team);
    localStorage.setItem('teams', JSON.stringify(parsedTeamList));
  } else {
    team = { [teamName]: parsedTeamList[teamName] };
  }
  setSectionNotHidden('player-selection');
  document.getElementById('player-selection').innerHTML += '<div><button onclick="selectAll()">Select All</button></div>';
  for (let i = 0; i < team[teamName].players.length; i++) {
    document.getElementById('player-selection').innerHTML += `<div class="checkbox-container"><input type="checkbox" id="player-${i}-checkbox" value="${i}" class="player-selection-checkbox"><label for="player-${i}-checkbox">${team[teamName].players[i].name}</label></div>`;
  }
  document.getElementById('player-selection').innerHTML += '<h3>Enter the number of players on the field at a time:</h3<div><input id="players-on-field" placeholder="Players on field" type="tel"></div>';
  document.getElementById('player-selection').innerHTML += `<div>
    <button onclick="manuallyCreateGroups('${teamName}')">Manually Create Groups</button>
    <button onclick="generateGroups('${teamName}')">Randomize Groups</button>
  </div>`;
}

function selectAll() {
  [...document.querySelectorAll('.player-selection-checkbox:not(:checked)')].forEach(checkbox => {
    checkbox.click();
  });
}

function manuallyCreateGroups(teamName) {
  setSectionNotHidden('player-groups');
  const playersOnField = document.getElementById('players-on-field').value;
  let playersPlaying = [...document.querySelectorAll('.player-selection-checkbox:checked')].map(checkbox => checkbox.value);
  let optionsBuilder = '';
  playersPlaying.map(playerIndex => {
    return {
      playerIndex,
      playerName: parsedTeamList[teamName].players[playerIndex].name
    };
  }).forEach(player => {
    optionsBuilder += `<option value="${player.playerIndex}">${player.playerName}`;
  });
  const docRef = document.getElementById('player-groups');
  for (let i = 0; i < rotations; i++) {
    docRef.innerHTML += `<div class="group-header">Group ${i + 1}</div>`;
    for (let j = 0; j < playersOnField; j++) {
      docRef.innerHTML += `<div>
        <select type="text" class="group-player-select">
          ${optionsBuilder}
        </select>
      </div>`;
    }
  }
  docRef.innerHTML += `<div class="group-header group-outlier">Outliers</div><div id="group-outliers"></div><div><button onclick="addOutlier('${teamName}')">Add Least Playing Player</button></div>`;
  docRef.innerHTML += `<div><button onclick="saveGroup('${teamName}', ${playersOnField})">Save</button></div>`;
}

function addOutlier(teamName) {
  let playersPlaying = [...document.querySelectorAll('.player-selection-checkbox:checked')].map(checkbox => checkbox.value);
  let optionsBuilder = '';
  playersPlaying.map(playerIndex => {
    return {
      playerIndex,
      playerName: parsedTeamList[teamName].players[playerIndex].name
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

function saveGroup(teamName, playersOnField) {
  const fullPlayerList = [...document.getElementsByClassName('group-player-select')].map(playerSelect => playerSelect.value);
  const outliers = [...document.getElementsByClassName('group-outlier-select')].map(playerSelect => playerSelect.value);
  const groups = createGroupsHelper(fullPlayerList, teamName, playersOnField);
  parsedTeamList[teamName].games.push({ groups });
  outliers.forEach(outlier => {
    parsedTeamList[teamName].players[outlier].timesNotPlayed = parseInt(parsedTeamList[teamName].players[outlier].timesNotPlayed) + 1;
  });
  localStorage.setItem('teams', JSON.stringify(parsedTeamList));
}

function generateGroups(teamName) {
  setSectionNotHidden('player-groups');
  
  const randomizerGroups = [];
  const highestTimesNotPlayedValue = Math.max(...parsedTeamList[teamName].players.map(player => player.timesNotPlayed));
  const selectedPlayersGlobalSet = [...document.querySelectorAll('.player-selection-checkbox:checked')].map(checkbox => checkbox.value).map(selectedPlayer => parsedTeamList[teamName].players[selectedPlayer]);
  for (let i = highestTimesNotPlayedValue; i >= 0; i--) {
    const filteredPlayersList = selectedPlayersGlobalSet.filter(selectedGlobalPlayer => parseInt(selectedGlobalPlayer.timesNotPlayed) === i);
    if (filteredPlayersList.length !== 0) {
      let filteredPlayerIndexes = filteredPlayersList.map(filteredPlayer => parsedTeamList[teamName].players.findIndex(player => player.name === filteredPlayer.name));
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

  const groups = createGroupsHelper(randomizedPlayers, teamName, playersOnField);
  parsedTeamList[teamName].games.push({ groups });
  outliers.forEach(outlier => {
    parsedTeamList[teamName].players[outlier].timesNotPlayed = parseInt(parsedTeamList[teamName].players[outlier].timesNotPlayed) + 1;
  });
  localStorage.setItem('teams', JSON.stringify(parsedTeamList));
}

function createGroupsHelper(playerList, teamName, playersOnField) {
  const groups = [[], [], [], [], [], []];
  const docRef = document.getElementById('player-groups');
  docRef.innerHTML = '';
  for (let i = 0; i < rotations; i++) {
    if (i === 3) {
      docRef.innerHTML += '<div class="halftime-splitter">-- Half-Time --</div>';
    }
    docRef.innerHTML += `<div class="group-header">Group ${i + 1}</div>`;
    let htmlBuilder = '<ol class="group-players">';
    for (let j = 0; j < playersOnField; j++) {
      const computatedIndex = (i * playersOnField) + j;
      htmlBuilder += `<li class="group-player">${parsedTeamList[teamName].players[playerList[computatedIndex]].name}</li>`;
      groups[i].push(playerList[computatedIndex]);
    }
    htmlBuilder += '</ol>';
    docRef.innerHTML += htmlBuilder;
  }
  return groups;
}

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

function setSectionNotHidden(selectedId) {
  ['player-amount', 'player-names', 'player-selection', 'flex-container', 'player-groups'].forEach(sectionId => {
    if (sectionId !== selectedId) {
      document.getElementById(sectionId).classList.add('hidden');
    } else {
      document.getElementById(sectionId).classList.remove('hidden');
    }
  })
}