let parsedTeamList = {};

(function() {
  const teamList = localStorage.getItem('teams');
  if (teamList !== null) {
    parsedTeamList = JSON.parse(teamList);
    document.getElementById('existing-teams').innerHTML += '<div>Or select an existing team:</div>';
    Object.keys(parsedTeamList).forEach(teamName => {
      document.getElementById('existing-teams').innerHTML += `<div><button onclick="generatePlayerSelection('${teamName}')">${teamName}</button></div>`;
    });
  }
})();

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
        players: [...document.getElementsByClassName('player-name-input')].map(input => input.value),
        games: []
      }
    };
    let teamList = localStorage.getItem('teams');
    if (teamList !== null) {
      JSON.parse(teamList)[teamName] = {
        players: [...document.getElementsByClassName('player-name-input')].map(input => input.value),
        games: []
      };
    } else {
      teamList = team;
    }
    parsedTeamList = Object.assign({}, team);
    localStorage.setItem('teams', JSON.stringify(parsedTeamList));
  } else {
    team = { [teamName]: parsedTeamList[teamName] };
  }
  document.getElementById('player-amount').classList.add('hidden');
  document.getElementById('player-names').classList.add('hidden');
  document.getElementById('player-selection').classList.remove('hidden');
  for (let i = 0; i < team[teamName].players.length; i++) {
    const player = team[teamName].players[i];
    document.getElementById('player-selection').innerHTML += `<div><input type="checkbox" id="player-${i}-checkbox" value="${i}" class="player-selection-checkbox"><label for="player-${i}-checkbox">${player}</label></div>`;
  }
  document.getElementById('player-selection').innerHTML += '<div><input id="players-on-field" placeholder="Players on field" type="tel"></div>';
  document.getElementById('player-selection').innerHTML += `<div><button onclick="generateGroups('${teamName}')">Next -></button></div>`;
}

function generateGroups(teamName) {
  document.getElementById('player-selection').classList.add('hidden');
  document.getElementById('player-groups').classList.remove('hidden');
  const playersOnField = document.getElementById('players-on-field').value;
  let randomizedPlayers = randomize([...document.querySelectorAll('.player-selection-checkbox:checked')].map(checkbox => checkbox.value));
  console.log('target player amount: ' + playersOnField * 6);
  let tempRandomizedPlayers = JSON.parse(JSON.stringify(randomizedPlayers));
  while (tempRandomizedPlayers.length < playersOnField * 6) {
    tempRandomizedPlayers = [...tempRandomizedPlayers, ...randomizedPlayers];
  }
  randomizedPlayers = JSON.parse(JSON.stringify(tempRandomizedPlayers));
  console.log('randomized player indexes:', randomizedPlayers);
  
  const groups = [[], [], [], [], [], []];
  const docRef = document.getElementById('player-groups');
  for (let i = 0; i < 6; i++) {
    docRef.innerHTML += `<div class="group-header">Group ${i + 1}</div>`;
    let htmlBuilder = '<ol class="group-players">';
    for (let j = 0; j < playersOnField; j++) {
      const computatedIndex = (i * playersOnField) + j;
      htmlBuilder += `<li class="group-player">${parsedTeamList[teamName].players[randomizedPlayers[computatedIndex]]}</li>`;
      groups[i].push(randomizedPlayers[computatedIndex]);
    }
    htmlBuilder += '</ol>';
    docRef.innerHTML += htmlBuilder;
  }
  const numOutliers = randomizedPlayers.length - (playersOnField * 6);
  console.log('number of outliers: ' + numOutliers);
  const outliers = randomizedPlayers.slice(randomizedPlayers.length - numOutliers, randomizedPlayers.length);
  console.log('outlier indexes: ' + outliers);
  parsedTeamList[teamName].games.push({ groups, outliers });
  console.log(parsedTeamList);
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