import Head from 'next/head'
import styles from '../styles/Home.module.css'
import pickRandom from 'pick-random'


import villagers from '../data/villager-names.json'

const ALL_COLORS = [
  "red",
  "orange",
  "yellow",
  "green",
  "teal",
  "blue",
  "purple",
  "pink",
  "gold",
];

function BoardTile(props) {
  const {villager} = props;
  return <div class="tile">
    <img src={villager.Photo} class="picture"></img>
    <p class="nameTag" style={{
      backgroundColor: villager["Bubble Color"],
      color: villager["Name Color"],
    }}>{villager.Name}</p>
    {/* <div class="blot"></div> */}
  </div>;
}

export default class Home extends React.Component {
  state = {
    excludedVillagers: [],
    boardVillagers: [],
    selectedColor: 'red',
    selectedVillagers: [],
  };

  handleCreateBoard(event) {
    event.preventDefault();

    const excludedVillagers = pickRandom(villagers, {count: 9});

    const possibleVillagers = villagers.filter((villager) => {
      return !excludedVillagers.includes(villager);
    });
    const boardVillagers = pickRandom(possibleVillagers, {count: 24});

    this.setState({
      excludedVillagers,
      boardVillagers,
      selectedVillagers: [],
    });
  }

  /**
   * @param {Event} event 
   */
  handleSaveClick(event) {
    event.preventDefault();
  }

  renderBoardTile(villager) {
    const isSelected =
      this.state.selectedVillagers.includes(villager);

    return <div class="tile" onClick={(e) => {
      e.preventDefault();

      const currentSelection = this.state.selectedVillagers;

      // Is this villager already selected?
      if (isSelected) {
        // Remove from selection!
        this.setState({
          selectedVillagers: currentSelection.filter((selected) => {
            return selected !== villager;
          }),
        });
      } else {
        // Not selected yet - select it now!
        this.setState({
          selectedVillagers: currentSelection.concat([villager]),
        });
      }
    }}>
      <img src={villager.Photo} class="picture"></img>
      <p class="nameTag" style={{
        backgroundColor: villager["Bubble Color"],
        color: villager["Name Color"],
      }}>{villager.Name}</p>
      {isSelected ? <div class={`blot ${this.state.selectedColor}`}></div> : null}
    </div>;
  }

  render() {
    return (
      <div className={styles.container}>
        <Head>
          <title>ACNH Villager Bingo</title>
          <link rel="icon" href="/favicon.ico" />
          <link href="https://fonts.googleapis.com/css2?family=Baloo+Tammudu+2:wght@400;500;600&display=swap" rel="stylesheet"></link>
        </Head>

        <main className={styles.main}>
          <h1>ACNH Villager Bingo</h1>

          <h2>Exclude current villagers:</h2>
          <div class="facesBox">
            {this.state.excludedVillagers.map((villager) => {
              return <div>
                <div class="faceIcon">
                  <p class="faceNumber" style={{
                    backgroundColor: villager["Name Color"],
                    backgroundImage: `url(${villager.Icon})`,
                    backgroundSize: 'contain',
                    width: '50px',
                    height: '50px',
                    borderRadius: '25px',
                    border: '5px solid magenta',
                  }}>
                  </p>
                </div>
                <p class="faceName">{villager.Name}</p>
              </div>;
            })}
          </div>

          <div class="buttons">
            <button class="create" type="button" onClick={(e) => this.handleCreateBoard(e)}>
              Create board
            </button>

            <button class="save" type="button" onClick={(e) => this.handleSaveClick(e)}>
              Save picture
            </button>
          </div>

          <div class="boardBox">
            <div class="boardTiles">
              {this.state.boardVillagers.slice(0, 12).map((villager) => {
                return this.renderBoardTile(villager);
              })}
              <div class="free">
                  <p class="overlap">Free plot</p>
                  <img src="https://uploads-ssl.webflow.com/5eec38013cb14bc83af8e976/5f6bafa4dc833eb1555aebef_BuildingIconWork%5Ez.png"
                  class="plot"></img>
              </div>
              {this.state.boardVillagers.slice(12).map((villager) => {
                return this.renderBoardTile(villager);
              })}
            </div>
          </div>

          <h2>Choose your blotter color:</h2>

          <div class="blotter">
            {ALL_COLORS.map((color) => {
              const style = color === this.state.selectedColor ? {
                border: '8px solid pink',
              } : {};
              return <div class={color} style={style} onClick={(e) => {
                e.preventDefault();
                this.setState({
                  selectedColor: color,
                });
              }}></div>;
            })}
          </div>


        </main>


      </div>
    )
  }
}

