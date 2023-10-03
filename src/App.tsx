import React from "react";
import "./App.css";
import Game from "./Game";

export type WordEntry = { word: string; isPangram: boolean };
export type GameConfiguration = {
  letters: [string, string, string, string, string, string, string];
  middleLetter: string;
};

export default function App() {
  const [configuration, setConfiguration] = React.useState<GameConfiguration>();
  const [words, setWords] = React.useState<WordEntry[]>([]);

  return (
    <Game
      configuration={{
        letters: ["A", "B", "C", "D", "E", "F", "G"],
        middleLetter: "D",
      }}
      words={words}
    ></Game>
  );
}
