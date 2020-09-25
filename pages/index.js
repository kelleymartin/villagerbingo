import Head from 'next/head'
import styles from '../styles/Home.module.css'
import pickRandom from 'pick-random'
import Downshift from 'downshift'
import HTML2Canvas from 'html2canvas'

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

export default class Home extends React.Component {
  state = {
    excludedVillagers: [],
    boardVillagers: [],
    selectedColor: pickRandom(ALL_COLORS)[0],
    selectedVillagers: [],
  };


  
  handleCreateBoard(event) {
    event.preventDefault();

    const possibleVillagers = villagers.filter((villager) => {
      return !this.state.excludedVillagers.includes(villager);
    });
    const boardVillagers = pickRandom(possibleVillagers, { count: 24 });

    this.setState({
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

  renderBoardTile(villager, index) {
    const isSelected =
      this.state.selectedVillagers.includes(villager);

    return <div class={`tile tile${index}`} onClick={(e) => {
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
      <img src={villager.Photo} class="picture" draggable="false"></img>
      <div class="nameTagWrap">
        <p class="nameTag" style={{
          backgroundColor: villager["Bubble Color"],
          color: villager["Name Color"],
        }}>{villager.Name}</p>
      </div>
      {isSelected ? <div class={`blot ${this.state.selectedColor}`}></div> : null}
    </div>;
  }

  renderVillagerSelector() {
    const comboboxStyles = {};
    const menuStyles = {};
    const items = villagers.filter(villager => {
      return !this.state.excludedVillagers.includes(villager);
    });

    const disabled = this.state.excludedVillagers.length === 9;

    return <Downshift
      onChange={selection => {
        if (disabled || !selection) { return; }

        this.setState(
          prevState => {
            return {
              excludedVillagers: prevState.excludedVillagers.concat([selection]),
            };
          },
          () => {
            // Reset the input to an empty string
            this.exclusionInput.value = '';
            this.exclusionDownshift.clearSelection();
          }
        );
      }}
      itemToString={item => (item ? item.Name : '')}
      ref={downshift => { this.exclusionDownshift = downshift; }}
    >
      {({
        getInputProps,
        getItemProps,
        getLabelProps,
        getMenuProps,
        getToggleButtonProps,
        isOpen,
        inputValue,
        highlightedIndex,
        selectedItem,
        getRootProps,
      }) => (
          <div>
            <label {...getLabelProps()}>Exclude a current villager:</label>
            <div
              style={comboboxStyles}
              {...getRootProps({}, { suppressRefError: true })}
            >
              <input {...getInputProps({ disabled })} ref={exclusionInput => {
                this.exclusionInput = exclusionInput;
              }}
              placeholder="Type a name..."/>
              <button class="toggle" {...getToggleButtonProps({ disabled })} aria-label={'toggle menu'}>
                &#8595;
              </button>
            </div>
            <ul {...getMenuProps()} style={menuStyles}>
              {isOpen
                ? items
                  .map(
                    item => {
                      const matchIndex = item.Name.toLowerCase().indexOf(inputValue.toLowerCase());
                      return { item, matchIndex };
                    }
                  )
                  .filter(
                    ({ item, matchIndex }) => {
                      const matchesInput = matchIndex >= 0;
                      const isAlreadyExcluded = this.state.excludedVillagers.includes(item);
                      return matchesInput && !isAlreadyExcluded;
                    }
                  )
                  .sort((a, b) => {
                    if (a.matchIndex === b.matchIndex) {
                      return a.item.Name.localeCompare(b.item.Name);
                    }
                    return a.matchIndex - b.matchIndex;
                  })
                  .map(({ item }, index) => (
                    <li
                      {...getItemProps({
                        key: item.Name,
                        index,
                        item,
                        style: {
                          backgroundColor:
                            highlightedIndex === index
                              ? 'white'
                              : 'green',
                          fontWeight:
                            selectedItem === item ? 'bold' : 'normal',
                        },
                      })}
                    >
                      {item.Name}
                    </li>
                  ))
                : null}
            </ul>
            <button type="button" class="copy" onClick={(e) => {
              // Example value:
              // T-Bone,Camofrog,Biskit
              e.preventDefault();
              const excluded = this.state.excludedVillagers;
              const shareData = excluded
                .map(villager => villager.Name)
                .join(',');
              navigator.clipboard.writeText(shareData);
            }}>Copy Villagers</button>
            <br/>
            <button type="button" class="import" onClick={async (e) => {
              e.preventDefault();
              const shareData = await navigator.clipboard.readText();
              const excluded = shareData
                .split(',')
                .map(name => villagers.find(v => v.Name === name))
                .filter(v => v !== null)
                .slice(0, 9);
              this.setState({
                excludedVillagers: excluded,
              });
            }}>Paste Villagers</button>
          </div>
        )}
    </Downshift>
  }

  renderBlank() {
    return (
      <div class="boardBox" id="capture">
        <div class="boardTiles">
          {Array.from({ length: 12 }, () => <div class="tileBlank"></div>)}

          <div class="free">
            <p class="overlap">Free plot</p>
            <img src="https://uploads-ssl.webflow.com/5eec38013cb14bc83af8e976/5f6bafa4dc833eb1555aebef_BuildingIconWork%5Ez.png"
              class="plot"></img>
          </div>

          {Array.from({ length: 12 }, () => <div class="tileBlank"></div>)}
        </div>
      </div>
    );
  }

  renderBoard() {
    const empty = this.state.boardVillagers.length === 0;
    if (empty) {
      return this.renderBlank();
    }
    return (
      <div class="boardBox">
        <div class="boardTiles">
          {this.state.boardVillagers.slice(0, 12).map((villager, index) => {
            return this.renderBoardTile(villager, index);
          })}
          <div class="free">
            <p class="overlap">Free plot</p>
            <img src="https://uploads-ssl.webflow.com/5eec38013cb14bc83af8e976/5f6bafa4dc833eb1555aebef_BuildingIconWork%5Ez.png"
              class="plot"></img>
          </div>
          {this.state.boardVillagers.slice(12).map((villager, index) => {
            return this.renderBoardTile(villager, index + 12);
          })}
        </div>
      </div>
    );
  }
  
//   render downloadimage() {
//     //var container = document.getElementById("image-wrap"); //specific element on page
//     var container = document.getElementById("capture");; // full page 
//     html2canvas(container, { allowTaint: true }).then(function (canvas) {

//         var link = document.createElement("a");
//         document.body.appendChild(link);
//         link.download = "villagerbingo.jpg";
//         link.href = canvas.toDataURL();
//         link.target = '_blank';
//         link.click();
//     });
// }

// function getRandomArbitrary(min, max) {
//   return Math.random() * (max - min) + min;
// }

// function Random(props) {
//   var maxTopNumber = 25;
//   var randomNumber = Math.floor((Math.random() * maxTopNumber) + 0);
//   return <div>{randomTopNumber}</div>;
// }

  render() {
    return (
      <div className={styles.container}>
        <Head>
          <title>ACNH Villager Bingo</title>
          <link rel="icon" href="/favicon.ico" />
          <link rel="stylesheet" href="https://use.typekit.net/pmt6aez.css"></link>
        </Head>

        <main className={styles.main}>
          <div class="container">
          <h1>ACNH Villager Bingo</h1>

          {this.renderVillagerSelector()}
          <div class="facesBox">
            {this.state.excludedVillagers.map((villager) => {
              return <div class="faceWrap" onClick={(e) => {
                e.preventDefault();
                this.setState({
                  excludedVillagers: this.state.excludedVillagers.filter(v => v !== villager),
                });
              }}>
                <div class="faceIcon">
                  <p class="faceNumber" style={{
                    backgroundColor: villager["Name Color"],
                    backgroundImage: `url(${villager.Icon})`,
                    backgroundSize: 'contain',
                    width: '50px',
                    height: '50px',
                    borderRadius: '25px',
                    // borderWidth: '1px',
                    // borderStyle: 'solid',
                    // borderColor: villager["Name Color"],
                  }}>
                  </p>
                </div>
                <p class="faceName" style={{
                  backgroundColor: villager["Bubble Color"],
                  color: villager["Name Color"],
                }}>{villager.Name}</p>
              </div>;
            })}
          </div>

          <div class="buttons">

            <button class="save" type="button" onclick={(e) => this.downloadimage()}>
              Save picture
              </button>

            <button class="create" type="button" onClick={(e) => this.handleCreateBoard(e)}>
              Create board
              </button>
          </div>

          {this.renderBoard()}

          <h2>Choose your marker color:</h2>

          <div class="blotter">
            {ALL_COLORS.map((color) => {
              const style = color === this.state.selectedColor ? {
                opacity: '100%',
              } : {};
              return <div class={color} style={style} onClick={(e) => {
                e.preventDefault();
                this.setState({
                  selectedColor: color,
                });
              }}></div>;
            })}
          </div>

        </div>
        </main>


      </div>
    )
  }
}

