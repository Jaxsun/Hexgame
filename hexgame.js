let pangramLetters = [];
let middleLetter = "";

let allHexagons = [];
let outerHexagons = [];
let centralHexagon = null;

let entryContent = null;
let messageBox = null;
let foundWords = null;
let points = null;
let wordCount = null;

let dictionary = [];
let foundWordsList = [];

const today = new Date();

/**
 * sets up game
 */
const start = () => {
  // set up controls - assign buttons to functions
  allHexagons = document.querySelectorAll(".outer-hexagon, .central-hexagon");
  outerHexagons = document.querySelectorAll(".outer-hexagon");
  centralHexagon = document.querySelectorAll(".central-hexagon")[0];
  entryContent = document.querySelector("#entryContent");
  messageBox = document.querySelector("#messageBox");
  foundWords = document.querySelector("#foundWords");
  points = document.querySelector("#points");
  wordCount = document.querySelector("#wordCount");

  document
    .querySelector("#deleteButton")
    .addEventListener("click", deleteLetter);
  document.querySelector("#shuffleButton").addEventListener("click", shuffle);
  document.querySelector("#enterButton").addEventListener("click", enter);
  document.querySelector("#shareButton").addEventListener("click", share);
  document.addEventListener("keydown", typeLetter);

  allHexagons.forEach((ele) => {
    ele.addEventListener("click", addLetter);
  });

  // seed the Math random function based on the current date
  // https://github.com/davidbau/seedrandom
  Math.seedrandom(
    `${today.getFullYear()}${today.getMonth()}${today.getDate()}`
  );

  // set up game
  const urlParams = new URLSearchParams(window.location.search);

  let pangramPromise;
  if (urlParams.has("pangram")) {
    const initialPangram = urlParams.get("pangram");
    let initialMiddleLetter;
    if (urlParams.has("mid")) {
      initialMiddleLetter = urlParams.get("mid");
    }
    pangramPromise = Promise.resolve({ initialPangram, initialMiddleLetter });
  } else {
    pangramPromise = fetch("sevenletterwords.txt")
      .then((response) => response.text())
      .then((file) => {
        const lines = file.split(/\n/g);
        const count = (lines || []).length;

        const no = Math.floor(Math.random() * count);
        return { initialPangram: lines[no].trim() };
      });
  }

  const dictionaryPromise = fetch("dictionary.txt").then((response) => {
    return response.text().then((file) => {
      dictionary = file.split(/\r?\n/g);
      if (urlParams.has("pangram")) {
        dictionary.push(urlParams.get("pangram"));
      }
    });
  });

  // we need to resolve both the dictionary retrieval and pangram retrieval before initializing the game
  Promise.all([pangramPromise, dictionaryPromise]).then((results) => {
    const [pangramResult] = results;
    setUpWithWord(
      pangramResult.initialPangram,
      pangramResult.initialMiddleLetter
    );
  });
};

/**
 * Takes a seven letter word and processes it to set up the game
 */
const setUpWithWord = (pangram, mid) => {
  // remove duplicate letters
  for (let i = 0; i < pangram.length; i++) {
    if (!pangramLetters.includes(pangram[i].toUpperCase())) {
      pangramLetters.push(pangram[i].toUpperCase());
    }
  }
  shuffleArray(pangramLetters);
  if (mid && pangramLetters.includes(mid)) {
    middleLetter = mid;
  } else {
    middleLetter =
      pangramLetters[Math.floor(Math.random() * pangramLetters.length)];
  }
  pangramLetters.splice(pangramLetters.indexOf(middleLetter), 1);

  // for each unique letter in word, assign to hex
  for (let i = 0; i < pangramLetters.length; i++) {
    outerHexagons[i].innerText = pangramLetters[i];
  }
  centralHexagon.innerText = middleLetter;

  if (
    localStorage.getItem("last-pangram") === pangram &&
    localStorage.getItem("last-mid") === middleLetter
  ) {
    try {
      const lastFoundWords = JSON.parse(
        localStorage.getItem("last-found-words")
      );
      if (lastFoundWords && Array.isArray(lastFoundWords)) {
        lastFoundWords.forEach((word) => {
          if (typeof word === "string") {
            const result = validateWord(word, true);
            processResult(word, result);
          }
        });
      }
    } catch (e) {
      localStorage.setItem("last-found-words", "[]");
    }
  } else {
    localStorage.setItem("last-found-words", "[]");
  }

  localStorage.setItem("last-pangram", pangram);
  localStorage.setItem("last-mid", middleLetter);
};

/**
 * Shuffles the letters around in the outer hexagons
 */
const shuffle = () => {
  shuffleArray(pangramLetters);
  for (let i = 0; i < pangramLetters.length; i++) {
    outerHexagons[i].innerText = pangramLetters[i];
  }
};

/**
 * Adds a letter to the entered word when pressing button
 * @param {*} event button press event
 */
const addLetter = (event) => {
  const letter = event.currentTarget.innerText;
  entryContent.innerText += letter;
  validateLetters();
};

/**
 * Adds a letter to the entered word when typing
 * @param {*} event type event
 */
const typeLetter = (event) => {
  if (!event.metaKey && !event.altKey && !event.ctrlKey) {
    if (event.code === "Backspace" || event.code === "Delete") {
      event.preventDefault();
      deleteLetter();
    } else if (event.code === "Enter" || event.code === "NumpadEnter") {
      event.preventDefault();
      enter();
    } else if (event.code === "Space") {
      event.preventDefault();
      shuffle();
    } else if (
      event.key.length === 1 &&
      event.keyCode >= 65 &&
      event.keyCode <= 90
    ) {
      // key was a letter
      event.preventDefault();
      entryContent.innerText += event.key.toUpperCase();
      validateLetters();
    }
  }
};

/**
 * Deletes a letter from the entered word
 */
const deleteLetter = () => {
  if (entryContent.innerText.length > 0) {
    entryContent.innerText = entryContent.innerText.slice(0, -1);
  }
  validateLetters();
};

/**
 * Adds valid or invalid class to entered word field
 */
const validateLetters = () => {
  entryContent.classList.remove("valid");
  entryContent.classList.remove("invalid");
  if (entryContent.innerText.includes(middleLetter)) {
    entryContent.classList.add("valid");
  } else {
    entryContent.classList.add("invalid");
  }
};

/**
 * Event listener to get word from entry content and then check if word is valid and process valid/invalid words.
 */
const enter = () => {
  const word = entryContent.innerText;
  const result = validateWord(word);
  processResult(word, result);
};

const validateWord = (word, silent = false) => {
  if (!word) {
    return {
      isValid: false,
      silent: true,
      reason: "No word",
    };
  } else if (word.length < 4) {
    return {
      isValid: false,
      silent,
      reason: "Too short",
    };
  } else if (!word.includes(middleLetter)) {
    return {
      isValid: false,
      silent,
      reason: "Missing centre letter",
    };
  } else if (!dictionary.includes(word.toLowerCase())) {
    return {
      isValid: false,
      silent,
      reason: "Not in dictionary",
    };
  } else if (foundWordsList.includes(word)) {
    return {
      isValid: false,
      silent,
      reason: "Already found",
    };
  } else {
    for (let i = 0; i < word.length; i++) {
      if (!(pangramLetters.includes(word[i]) || word[i] === middleLetter)) {
        return {
          isValid: false,
          silent,
          reason: "Invalid letters!",
        };
      }
    }

    return {
      isValid: true,
      silent,
      reason: "All good",
    };
  }
};

const processResult = (word, result) => {
  if (result.isValid) {
    correctWord(word, result.silent);
  } else if (!result.silent) {
    incorrectWord(result.reason);
  }
};

/**
 * Processes the entry when the word is a valid word
 * @param {*} word
 */
const correctWord = (word, silent = false) => {
  //add word to list
  foundWordsList.push(word);
  foundWordsList.sort();
  foundWords.innerText = foundWordsList.join("\n");
  localStorage.setItem("last-found-words", JSON.stringify(foundWordsList));

  //check if pangram
  let isPangram = true;
  for (let i = 0; i < pangramLetters.length; i++) {
    if (!word.includes(pangramLetters[i])) {
      isPangram = false;
      break;
    }
  }

  //add points
  let currentPoints = parseInt(points.innerText);
  let newPoints = word.length + 1;
  if (word.length === 4) newPoints = 1;
  if (isPangram) newPoints += 7;
  points.innerText = currentPoints + newPoints;

  //update number of words found
  wordCount.innerText = foundWordsList.length;

  if (!silent) {
    //show positive message
    if (isPangram) {
      showGoodMessage("Pangram!");
    } else if (word.length === 4) {
      showGoodMessage("Good!");
    } else if (word.length < 7) {
      showGoodMessage("Great!");
    } else {
      showGoodMessage("Amazing!");
    }
  }

  //reset entry
  entryContent.innerText = "";
};

/**
 * Processes the entry when the word is an invalid word
 * @param {*} error
 */
const incorrectWord = (error) => {
  entryContent.classList.add("shake");
  messageBox.innerText = error;
  entryContent.addEventListener("animationend", () => {
    entryContent.innerText = "";
    messageBox.innerText = "";
    entryContent.classList.remove("shake");
  });
};

/**
 * Show a message without the shake
 * @param {} message
 */
const showGoodMessage = (message) => {
  messageBox.innerText = message;
  messageBox.classList.add("valid");
  setTimeout(() => {
    messageBox.innerText = "";
    messageBox.classList.remove("valid");
  }, 1000);
};

/**
 * Helper function to shuffle an array
 * https://stackoverflow.com/a/12646864/8182370
 * @param {*} array array to shuffle
 */
const shuffleArray = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
};

const share = () => {
  navigator.clipboard.writeText(shareMessage());
};

const shareMessage = () => {
  const half1 = `${pangramLetters[0]}${pangramLetters[1]}${pangramLetters[2]}`;
  const half2 = `${pangramLetters[3]}${pangramLetters[4]}${pangramLetters[5]}`;
  return `#Hexgame ${today.toLocaleDateString()}
${half1}🟨${middleLetter}🟨${half2}
Points: ${points.innerText}
Words: ${wordCount.innerText}
${window.location.origin}`;
};

window.onload = start;
