export function renderBoardColorSelection() {
  const boardColors = [
    {
      value: "rainbow",
      label: "Rainbow",
      lightStartColor: "#",
      lightEndColor: "#",
      darkStartColor: "#",
      darkEndColor: "#",
      grayColor: "#",
      grayEndColor: "#",
    },
    {
      value: "red-orange",
      label: "Red/Orange",
      lightStartColor: "#DB6161",
      lightEndColor: "#FFAA3B",
      darkStartColor: "#811D1D",
      darkEndColor: "#9D5900",
      grayColor: "#",
      grayEndColor: "#",
    },
    {
      value: "orange-yellow",
      label: "Orange/Yellow",
      lightStartColor: "#FFAA3B",
      lightEndColor: "#FFD00D",
      darkStartColor: "#9D5900",
      darkEndColor: "#866C00",
      grayColor: "#",
      grayEndColor: "#",
    },
    {
      value: "yellow-green",
      label: "Yellow/Green",
      lightStartColor: "#FFD00D",
      lightEndColor: "#78DD62",
      darkStartColor: "#866C00",
      darkEndColor: "#2F831C",
      grayColor: "#",
      grayEndColor: "#",
    },
    {
      value: "green-teal",
      label: "Green/Teal",
      lightStartColor: "#78DD62",
      lightEndColor: "#3FD8E0",
      darkStartColor: "#2F831C",
      darkEndColor: "#14767C",
      grayColor: "#",
      grayEndColor: "#",
    },
    {
      value: "teal-blue",
      label: "Teal/Blue",
      lightStartColor: "#3FD8E0",
      lightEndColor: "#7FA9FF",
      darkStartColor: "#14767C",
      darkEndColor: "#003FBF",
      grayColor: "#",
      grayEndColor: "#",
    },
    {
      value: "blue-purple",
      label: "Blue/Purple",
      lightStartColor: "#7FA9FF",
      lightEndColor: "#A06FCE",
      darkStartColor: "#003FBF",
      darkEndColor: "#502876",
      grayColor: "#",
      grayEndColor: "#",
    },
    {
      value: "purple-pink",
      label: "Purple/Pink",
      lightStartColor: "#A06FCE",
      lightEndColor: "#F993CE",
      darkStartColor: "#502876",
      darkEndColor: "#BC0A71",
      grayColor: "#",
      grayEndColor: "#",
    },
    {
      value: "pink-red",
      label: "Pink/Red",
      lightStartColor: "#F993CE",
      lightEndColor: "#DB6161",
      darkStartColor: "#BC0A71",
      darkEndColor: "#811D1D",
      grayColor: "#",
      grayEndColor: "#",
    },
  ];

  return (
    <div className="boardColorSelection">
      <label className="boardColorLabel">Board color:</label>
      {boardColors.map((set) => {
        const isActive = set.value === this.gameState.boardColor;
        const marker = isActive ? "✓" : "";
        return (
          <button
            key={set.value}
            className={`board-color board-color-${set.value} ${
              isActive ? "board-color-active" : ""
            }`}
            style={{
              backgroundColor: `linear-gradient(to bottom right, ${boardColors.lightStartColor}, ${boardColors.lightEndColor})`,
            }}
            onClick={(e) => {
              e.preventDefault();
              this.setGameState({
                changedSettings: true,
                boardColor: set.value,
              });
            }}
          >
            {marker} {set.label}
          </button>
        );
      })}
    </div>
  );
}

// exports.boardColors = boardColors;