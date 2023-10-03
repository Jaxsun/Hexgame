import { GameConfiguration, WordEntry } from "./App";
import GameBoard from "./GameBoard";
import ScoreBoard from "./ScoreBoard";

export default function Game({
  configuration,
  words,
}: {
  configuration: GameConfiguration;
  words: WordEntry[];
}) {
  return (
    <div className="game">
      <GameBoard words={words}></GameBoard>
      <ScoreBoard words={words}></ScoreBoard>
    </div>
  );
}
