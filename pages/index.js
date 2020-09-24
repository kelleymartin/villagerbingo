import Head from 'next/head'
import styles from '../styles/Home.module.css'


import villagers from '../data/villager-names.json'

export default class Home extends React.Component {
  state = {
    clickCount: 0,
    excludedVillagers: villagers.slice(0, 9),
  };

  /**
   * @param {Event} event 
   */
  handleSaveClick(event) {
    event.preventDefault();

    const nextCount = this.state.clickCount + 1;
    this.setState({
      clickCount: nextCount,
      excludedVillagers: this.state.excludedVillagers.concat([
        `Creative Name #${nextCount}`,
      ]),
    });
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
            <div>
              <div class="faceIcon">
                <p class="faceNumber">1</p>
              </div>
              <p class="faceName">Cashmere</p>
            </div>
            <div>
              <div class="faceIcon">
                <p class="faceNumber">2</p>
              </div>
              <p class="faceName">Cashmere</p>
            </div>
            <div>
              <div class="faceIcon">
                <p class="faceNumber">3</p>
              </div>
              <p class="faceName">Cashmere</p>
            </div>
            <div>
              <div class="faceIcon">
                <p class="faceNumber">4</p>
              </div>
              <p class="faceName">Cashmere</p>
            </div>
            <div>
              <div class="faceIcon">
                <p class="faceNumber">5</p>
              </div>
              <p class="faceName">Cashmere</p>
            </div>
            <div>
              <div class="faceIcon">
                <p class="faceNumber">6</p>
              </div>
              <p class="faceName">Cashmere</p>
            </div>
            <div>
              <div class="faceIcon">
                <p class="faceNumber">7</p>
              </div>
              <p class="faceName">Cashmere</p>
            </div>
            <div>
              <div class="faceIcon">
                <p class="faceNumber">8</p>
              </div>
              <p class="faceName">Cashmere</p>
            </div>
            <div>
              <div class="faceIcon">
                <p class="faceNumber">9</p>
              </div>
              <p class="faceName">Cashmere</p>
            </div>
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
            <button class="create" type="button">
              Create board
            </button>

            <button class="save" type="button" onClick={(e) => this.handleSaveClick(e)}>
              Save picture
            </button>
          </div>

          <div class="boardBox">
            <div class="boardTiles">
              <div class="tile">
                <img src="https://acnhcdn.com/latest/NpcBromide/NpcNmlShp04.png"
                class="picture"></img>
                <p class="nameTag">Cash</p>
                <div class="blot"></div>
              </div>
              <div class="tile"></div>
              <div class="tile"></div>
              <div class="tile"></div>
              <div class="tile"></div>
              <div class="tile"></div>
              <div class="tile"></div>
              <div class="tile"></div>
              <div class="tile"></div>
              <div class="tile"></div>
              <div class="tile"></div>
              <div class="tile"></div>
              <div class="free">
                  <p class="overlap">Free plot</p>
                  <img src="https://uploads-ssl.webflow.com/5eec38013cb14bc83af8e976/5f6bafa4dc833eb1555aebef_BuildingIconWork%5Ez.png"
                  class="plot"></img>
              </div>
              <div class="tile"></div>
              <div class="tile"></div>
              <div class="tile"></div>
              <div class="tile"></div>
              <div class="tile"></div>
              <div class="tile"></div>
              <div class="tile"></div>
              <div class="tile"></div>
              <div class="tile"></div>
              <div class="tile"></div>
              <div class="tile"></div>
              <div class="tile"></div>
            </div>
          </div>

          <h2>Choose your blotter color:</h2>

          <div class="blotter">
            <div class="red"></div>
            <div class="orange"></div>
            <div class="yellow"></div>
            <div class="green"></div>
            <div class="teal"></div>
            <div class="blue"></div>
            <div class="purple"></div>
            <div class="pink"></div>
            <div class="gold"></div>
          </div>


        </main>


      </div>
    )
  }
}

