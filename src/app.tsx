import { useEffect, useState } from "preact/hooks";
import seedrandom from "seedrandom";
import "./app.css";

export function App() {
  const today = new Date();
  const random = seedrandom(
    `${today.getFullYear()}${today.getMonth()}${today.getDate()}`
  );

  const [dictionary, setDictionary] = useState<string[]>();
  const [pangram, setPangram] = useState<string>();
  const [middleLetter, setMiddleLetter] = useState<string>();
  const [foundWords, setFoundWords] = useState<string[]>([]);

  useEffect(() => {
    fetch("dictionary.txt")
      .then((response) => response.text())
      .then((text) => {
        const dictionary = text.split(/\n/g);
        setDictionary(dictionary);
      });
  });

  useEffect(() => {
    fetch("sevenletterwords.txt")
      .then((response) => response.text())
      .then((file) => {
        const lines = file.split(/\n/g);
        const index = Math.floor(random() * lines.length);
        const pangram = lines[index];
        setPangram(pangram);
        const middleLetter = pangram.charAt(Math.floor(random() * 7));
        setMiddleLetter(middleLetter);
      });
  });

  useEffect(() => {
    const storedWords = localStorage.getItem("found-words") || "[]";
    const foundWords = JSON.parse(storedWords);
    if (
      Array.isArray(foundWords) &&
      foundWords.every((w) => typeof w === "string")
    ) {
      setFoundWords(foundWords);
    }
  });

  if (dictionary && pangram && middleLetter) {
    return (
      <div>
        `Loaded: ${pangram} ${middleLetter} ${foundWords}`
      </div>
    );
  } else {
    return <div>"Loading"</div>;
  }
}
