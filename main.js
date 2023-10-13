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
    document.getElementById('existing-teams').innerHTML = '<div>Or select an existing team:</div>';
    Object.keys(parsedTeamList).forEach(teamName => {
      document.getElementById('existing-teams').innerHTML += `<div class="team-selection">
        <button onclick="generatePlayerSelection('${teamName}')">${teamName}</button><button class="delete-button" onclick="deleteTeam('${teamName}')">DELETE ${teamName} (THERE'S NO GOING BACK FROM THIS)</button>
      </div>`;
    });
  }
})();

function deleteTeam(teamName) {
  delete parsedTeamList[teamName];
  localStorage.setItem('teams', JSON.stringify(parsedTeamList));
  document.getElementById('existing-teams').innerHTML = '<div>Or select an existing team:</div>';
  Object.keys(parsedTeamList).forEach(teamName => {
    document.getElementById('existing-teams').innerHTML += `<div class="team-selection">
      <button onclick="generatePlayerSelection('${teamName}')">${teamName}</button><button class="delete-button" onclick="deleteTeam('${teamName}')">DELETE ${teamName} (THERE'S NO GOING BACK FROM THIS)</button>
    </div>`;
  });
}

function generatePlayerEntry() {
  document.getElementById('player-amount').classList.add('hidden');
  document.getElementById('player-names').classList.remove('hidden');
  for (let i = 0; i < document.getElementById('player-amount-input').value; i++) {
    document.getElementById('player-names').innerHTML += '<div><input type="text" class="player-name-input"></div>';
  }
  document.getElementById('player-names').innerHTML += '<div><button onclick="generatePlayerSelection()">Next -></button></div>';
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
  document.getElementById('player-amount').classList.add('hidden');
  document.getElementById('player-names').classList.add('hidden');
  document.getElementById('player-selection').classList.remove('hidden');
  document.getElementById('player-selection').innerHTML += '<div><button onclick="selectAll()">Select All</button></div>';
  for (let i = 0; i < team[teamName].players.length; i++) {
    document.getElementById('player-selection').innerHTML += `<div><input type="checkbox" id="player-${i}-checkbox" value="${i}" class="player-selection-checkbox"><label for="player-${i}-checkbox">${team[teamName].players[i].name}</label></div>`;
  }
  document.getElementById('player-selection').innerHTML += '<div><input id="players-on-field" placeholder="Players on field" type="tel"></div>';
  document.getElementById('player-selection').innerHTML += `<div>
    <button onclick="manuallyCreateGroups('${teamName}')">Manually Create Groups -></button>
    <button onclick="generateGroups('${teamName}')">Randomize Groups -></button>
  </div>`;
}

function selectAll() {
  [...document.querySelectorAll('.player-selection-checkbox')].forEach(checkbox => {
    checkbox.click();
  });
}

function manuallyCreateGroups(teamName) {
  document.getElementById('player-selection').classList.add('hidden');
  document.getElementById('player-groups').classList.remove('hidden');
  const playersOnField = document.getElementById('players-on-field').value;
  let playersPlaying = [...document.querySelectorAll('.player-selection-checkbox:checked')].map(checkbox => checkbox.value);
  console.log('target player amount: ' + playersOnField * rotations);
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
  // const groups = [[], [], [], [], [], []];
  // const docRef = document.getElementById('player-groups');
  // docRef.innerHTML = '';
  // for (let i = 0; i < rotations; i++) {
  //   docRef.innerHTML += `<div class="group-header">Group ${i + 1}</div>`;
  //   let htmlBuilder = '<ol class="group-players">';
  //   for (let j = 0; j < playersOnField; j++) {
  //     const computatedIndex = (i * playersOnField) + j;
  //     htmlBuilder += `<li class="group-player">${parsedTeamList[teamName].players[fullPlayerList[computatedIndex]]}</li>`;
  //     groups[i].push(fullPlayerList[computatedIndex]);
  //   }
  //   htmlBuilder += '</ol>';
  //   docRef.innerHTML += htmlBuilder;
  // }
  parsedTeamList[teamName].games.push({ groups });
  outliers.forEach(outlier => {
    parsedTeamList[teamName].players[outlier].timesNotPlayed++;
  });
  // parsedTeamList[teamName].outliers = Array.from(new Set([...(parsedTeamList[teamName].outliers ? parsedTeamList[teamName].outliers : []), ...outliers]));
  console.log('all saved teams: ', parsedTeamList);
  localStorage.setItem('teams', JSON.stringify(parsedTeamList));
}

function generateGroups(teamName) {
  document.getElementById('player-selection').classList.add('hidden');
  document.getElementById('player-groups').classList.remove('hidden');
  const playersOnField = document.getElementById('players-on-field').value;
  console.log('target player amount: ' + playersOnField * rotations);









  const selectedPlayers = [...document.querySelectorAll('.player-selection-checkbox:checked')].map(checkbox => checkbox.value);
  const notSelectedPlayers = [...document.querySelectorAll('.player-selection-checkbox:not(:checked)')].map(checkbox => checkbox.value);

  const randomizerGroups = [];
  const highestTimesNotPlayedValue = Math.max(...parsedTeamList[teamName].players.map(player => player.timesNotPlayed));
  const selectedPlayersGlobalSet = selectedPlayers.map(selectedPlayer => parsedTeamList[teamName].players[selectedPlayer]);
  for (let i = highestTimesNotPlayedValue; i >= 0; i--) {
    const filteredPlayersList = selectedPlayersGlobalSet.filter(selectedGlobalPlayer => selectedGlobalPlayer.timesNotPlayed === i);
    if (filteredPlayersList.length !== 0) {
      let filteredPlayerIndexes = filteredPlayersList.map(filteredPlayer => parsedTeamList[teamName].players.findIndex(player => player.name === filteredPlayer.name));
      randomizerGroups.push(filteredPlayerIndexes);
    }
  }
  console.log('randomizer groups: ', randomizerGroups);


  // let outliersCheckList = [];
  // [...document.querySelectorAll('.player-selection-checkbox:checked')].map(checkbox => checkbox.value).forEach(selectedPlayer => {
  //   const oldOutlierIndex = parsedTeamList[teamName].outliers.findIndex(oldOutlier => oldOutlier === selectedPlayer);
  //   if (oldOutlierIndex !== -1) {
  //     outliersCheckList.push(selectedPlayer);
  //     parsedTeamList[teamName].outliers.splice(oldOutlierIndex, 1);
  //   }
  // });

  let randomizedPlayers = [];
  randomizerGroups.forEach(randomizerGroup => {
    randomizedPlayers = [...randomizedPlayers, ...randomize(randomizerGroup)];
  });
  console.log(randomizedPlayers);
  tempRandomizedPlayers = JSON.parse(JSON.stringify(randomizedPlayers));
  while (tempRandomizedPlayers.length < playersOnField * rotations) {
    tempRandomizedPlayers = [...tempRandomizedPlayers, ...randomizedPlayers];
  }
  randomizedPlayers = JSON.parse(JSON.stringify(tempRandomizedPlayers));
  const numOutliers = randomizedPlayers.length - (playersOnField * rotations);
  outliers = [...randomizedPlayers.slice(randomizedPlayers.length - numOutliers, randomizedPlayers.length), ...notSelectedPlayers];

  
  // let tempRandomizedPlayers;
  // let outliers;
  // let allowRandomization = false;
  // while (!allowRandomization) {
  //   randomizedPlayers = randomize([...document.querySelectorAll('.player-selection-checkbox:checked')].map(checkbox => checkbox.value));
  //   tempRandomizedPlayers = JSON.parse(JSON.stringify(randomizedPlayers));
  //   while (tempRandomizedPlayers.length < playersOnField * rotations) {
  //     tempRandomizedPlayers = [...tempRandomizedPlayers, ...randomizedPlayers];
  //   }
  //   randomizedPlayers = JSON.parse(JSON.stringify(tempRandomizedPlayers));
  //   console.log('randomization attempt: ', randomizedPlayers);
  //   const numOutliers = randomizedPlayers.length - (playersOnField * rotations);
  //   outliers = randomizedPlayers.slice(randomizedPlayers.length - numOutliers, randomizedPlayers.length);
  //   for (let i = 0; i < outliers.length; i++) {
  //     if (outliersCheckList.findIndex(oldOutlier => oldOutlier === outliers[i]) !== -1) {
  //       allowRandomization = false;
  //       break;
  //     } else {
  //       allowRandomization = true;
  //     }
  //   }
  // }











  console.log('randomized player indexes:', randomizedPlayers);
  const groups = createGroupsHelper(randomizedPlayers, teamName, playersOnField);
  // const groups = [[], [], [], [], [], []];
  // const docRef = document.getElementById('player-groups');
  // for (let i = 0; i < rotations; i++) {
  //   docRef.innerHTML += `<div class="group-header">Group ${i + 1}</div>`;
  //   let htmlBuilder = '<ol class="group-players">';
  //   for (let j = 0; j < playersOnField; j++) {
  //     const computatedIndex = (i * playersOnField) + j;
  //     htmlBuilder += `<li class="group-player">${parsedTeamList[teamName].players[randomizedPlayers[computatedIndex]]}</li>`;
  //     groups[i].push(randomizedPlayers[computatedIndex]);
  //   }
  //   htmlBuilder += '</ol>';
  //   docRef.innerHTML += htmlBuilder;
  // }
  parsedTeamList[teamName].games.push({ groups });
  outliers.forEach(outlier => {
    parsedTeamList[teamName].players[outlier].timesNotPlayed++;
  });
  // parsedTeamList[teamName].outliers = Array.from(new Set([...(parsedTeamList[teamName].outliers ? parsedTeamList[teamName].outliers : []), ...outliers]));
  console.log('all saved teams: ', parsedTeamList);
  localStorage.setItem('teams', JSON.stringify(parsedTeamList));
}

function createGroupsHelper(playerList, teamName, playersOnField) {
  const groups = [[], [], [], [], [], []];
  const docRef = document.getElementById('player-groups');
  docRef.innerHTML = '';
  for (let i = 0; i < rotations; i++) {
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