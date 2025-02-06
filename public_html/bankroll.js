const form = document.getElementById('questionnaire');
const results = document.getElementById('results');

form.addEventListener('submit', (event) => {
  event.preventDefault();

  // Question 1
  const experience = form.experience.value;
  let experienceText;
  if (experience === 'never_played_online') {
    experienceText = '🎓Lets start with the <a href="https://pokerstarslearn.com/poker/learn/lesson/texas-holdem-rules/">Rules</a> & <a href="https://pokerstarslearn.com/poker/learn/course/the-basics/">Basics</a> of Poker.';
  } else if (experience === 'only_played_play_money') {
    experienceText = '🎓Lets take a look at the differences between <a href="#/">Play Money and Real Money</a> Poker.';
  } else if (experience === 'played_online_1_year') {
    experienceText = '🎓Pick a <a href="https://pokerstarslearn.com/poker/learn/courses/">Free Poker Course</a> to refresh your skills.';
  } else if (experience === 'played_live_1_year') {
    experienceText = '🎓Here are the differences between <a href="#/">Online and Live</a> Poker.';
  }

  // Question 2
  const time = form.time.value;
  let timeText;
  if (time === '1_hour') {
    timeText = '⏱️Based on your free time, Spin & Go\'s maybe suitable for you.';
  } else if (time === '4_hours') {
    timeText = '⏱️Based on your free time, Cash Games, Spin & Go\'s or Sit & Go\'s maybe suitable for you.';
  } else if (time === '8_hours') {
    timeText = '⏱️Based on your free time, Tournaments maybe suitable for you, but you have time to try any games. ';
  }

 // Question 3
const bankroll = form.bankroll.value;


  
// Calculate the maximum buy-in for tournaments
const minTournamentBuyIn = 1.10;
const maxBuyInTournaments = Math.max(Math.floor(bankroll / 100), minTournamentBuyIn);
const maxBuyInTournamentsText = `📈Max buy-in for tournaments: $${maxBuyInTournaments}`;

// Calculate the maximum buy-in for Spin & Go's and Sit & Go's
const minSpinAndGoBuyIn = 0.25;
const maxBuyInSpinAndGo = Math.max(Math.floor(bankroll / 50), minSpinAndGoBuyIn);
const maxBuyInSpinAndGoText = `📈Max buy-in for Spin & Go's and Sit & Go's: $${maxBuyInSpinAndGo}`;

// Calculate the maximum buy-in for table games
const minTableBuyIn = 2;
const maxBuyInTable = Math.max(Math.floor(bankroll / 25), minTableBuyIn);


// Max Table Stakes
let tableStakes = "";

if (maxBuyInTable <= 4.99) {
  tableStakes = "$0.01/$0.02";
} else if (maxBuyInTable <= 9.99) {
  tableStakes = "$0.02/$0.05";
} else if (maxBuyInTable <= 15.99) {
  tableStakes = "$0.05/$0.10";
} else if (maxBuyInTable <= 24.99) {
  tableStakes = "$0.08/$0.16";
} else if (maxBuyInTable <= 49.99) {
  tableStakes = "$0.10/$0.25";
} else if (maxBuyInTable <= 99.99) {
  tableStakes = "$0.25/$0.5";
} else if (maxBuyInTable <= 199.99) {
  tableStakes = "$0.5/$1";
} else if (maxBuyInTable <= 399.99) {
  tableStakes = "$1/$2";
} else if (maxBuyInTable <= 499.99) {
  tableStakes = "$2/$4";
} else if (maxBuyInTable <= 599.99) {
  tableStakes = "$2.5/$5";
} else if (maxBuyInTable <= 999.99) {
  tableStakes = "$3/$6";
} else if (maxBuyInTable <= 1999.99) {
  tableStakes = "$5/$10";
} else if (maxBuyInTable <= 2999.99) {
  tableStakes = "$10/$20";
} else if (maxBuyInTable <= 4999.99) {
  tableStakes = "$15/$30";
} else if (maxBuyInTable <= 5999.99) {
  tableStakes = "$25/$50";
} else if (maxBuyInTable <= 9999.99) {
  tableStakes = "$30/$60";
} else if (maxBuyInTable <= 19999.99) {
  tableStakes = "$50/$100";
} else if (maxBuyInTable <= 39999.99) {
  tableStakes = "$100/$200";
} else if (maxBuyInTable <= 59999.99) {
  tableStakes = "$200/$400";
} else if (maxBuyInTable <= 79999.99) {
  tableStakes = "$300/$600";
} else if (maxBuyInTable <= 99999.99) {
  tableStakes = "$400/$800";
} else if (maxBuyInTable <= 199999.99) {
  tableStakes = "$500/$1000";
} else if (maxBuyInTable >= 199999.99) {
  tableStakes = "$1000/$2000";
}

const maxBuyInTableText = `📈Bring no more than $${maxBuyInTable} to the table for Cash Games at stakes of ${tableStakes}`;

// Display results
results.innerHTML = "Below are your Results:<br><br>" +
  `${experienceText}<br>
  <br>
  ${timeText}<br>
  <br>
  ${maxBuyInTournamentsText}<br>
  <br>
  ${maxBuyInSpinAndGoText}<br>
  <br>
  ${maxBuyInTableText}`;


});
