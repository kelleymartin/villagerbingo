import Head from 'next/head'
import styles from '../styles/Home.module.css'
import pickRandom from 'pick-random'
import Downshift from 'downshift'
import html2canvas from 'html2canvas'

import villagers from '../data/villagers.json'

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
    boardVillagers: [], // pickRandom(villagers, { count: 24 }),
    selectedColor: this.props.randomBlotterColor,
    selectedVillagers: [],
  };

  static getInitialProps() {
    return {
      randomBlotterColor: pickRandom(ALL_COLORS)[0],
    };
  }

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
      <img src={villager.imageUrl} class="picture" crossorigin="anonymous" draggable="false"></img>
      <div class="nameTagWrap">
        <p class="nameTag" style={{
          backgroundColor: villager.bubbleColor,
          color: villager.textColor,
        }}>{villager.name}</p>
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
      itemToString={item => (item ? item.name : '')}
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
          <div class="exclusionBox">
            <label {...getLabelProps()}>Exclude a current villager:</label>
            <div class="inputBox">
              <div
                style={comboboxStyles}
                {...getRootProps({}, { suppressRefError: true })}
              >
                <input {...getInputProps({ disabled })} ref={exclusionInput => {
                  this.exclusionInput = exclusionInput;
                }}
                  placeholder="Type a name..." />
                <button class="toggle" {...getToggleButtonProps({ disabled })} aria-label={'toggle menu'}>
                  &#8595;
              </button>
              </div>
              <ul {...getMenuProps()} style={menuStyles}>
                {isOpen
                  ? items
                    .map(
                      item => {
                        const matchIndex = item.name.toLowerCase().indexOf(inputValue.toLowerCase());
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
                        return a.item.name.localeCompare(b.item.name);
                      }
                      return a.matchIndex - b.matchIndex;
                    })
                    .map(({ item }, index) => (
                      <li
                        {...getItemProps({

                          key: item.name,
                          index,
                          item,
                          style: {
                            backgroundColor:
                              highlightedIndex === index
                                ? 'aqua'
                                : 'violet',
                            fontWeight:
                              selectedItem === item ? 'bold' : 'normal',
                          },
                        })}
                      >
                        {item.name}
                      </li>
                    ))
                  : null}
              </ul>
            </div>
            <button type="button" class="copy" onClick={(e) => {
              // Example value:
              // T-Bone,Camofrog,Biskit
              e.preventDefault();
              const excluded = this.state.excludedVillagers;
              const shareData = excluded
                .map(villager => villager.name)
                .join(',');
              navigator.clipboard.writeText(shareData);
            }}>Copy Villagers</button>
            <br />
            <button type="button" class="import" onClick={async (e) => {
              e.preventDefault();
              const shareData = await navigator.clipboard.readText();
              const excluded = shareData
                .split(',')
                .map(name => villagers.find(v => v.name === name))
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

          {this.renderFreePlot()}

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
      <div class="boardBox" id="capture">
        <div class="boardTiles">
          {this.state.boardVillagers.slice(0, 12).map((villager, index) => {
            return this.renderBoardTile(villager, index);
          })}
          {this.renderFreePlot()}
          {this.state.boardVillagers.slice(12).map((villager, index) => {
            return this.renderBoardTile(villager, index + 12);
          })}
        </div>
      </div>
    );
  }

  renderFreePlot() {
    return (
      <div class="free">
        <p class="overlap">Free plot</p>
        <img src="https://uploads-ssl.webflow.com/5eec38013cb14bc83af8e976/5f6bafa4dc833eb1555aebef_BuildingIconWork%5Ez.png"
          crossorigin="anonymous"
          class="plot"></img>
      </div>
    );
  }

  handleDownloadImage(event) {
    event.preventDefault();

    var container = document.getElementById("capture");
    html2canvas(container, {
      allowTaint: false,
      useCORS: true,
    }).then((canvas) => {
      var link = document.createElement("a");
      document.body.appendChild(link);
      link.download = "villagerbingo.jpg";
      link.href = canvas.toDataURL();
      link.target = '_blank';
      link.click();
    });
  }

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
                  <img src="https://uploads-ssl.webflow.com/5eec38013cb14bc83af8e976/5f6e7084a3319408e7ef23fa_FaceX.svg"
                    class="faceX"></img>
                  <div class="faceIcon">
                    <p class="faceNumber" style={{
                      backgroundColor: villager.textColor,
                      backgroundImage: `url(${villager.iconUrl})`,
                      backgroundSize: 'contain',
                      width: '54px',
                      height: '54px',
                      borderRadius: '27px',
                      border: `2px solid ${villager.bubbleColor}80`
                      // borderWidth: '1px',
                      // borderStyle: 'solid',
                      // borderColor: villager.textColor,
                    }}>
                    </p>
                  </div>
                  <p class="faceName" style={{
                    backgroundColor: villager.bubbleColor,
                    color: villager.textColor,
                  }}>{villager.name}</p>
                </div>;
              })}
            </div>

            <div class="buttons">

              <button class="save" type="button" onClick={(e) => this.handleDownloadImage(e)}>
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
                  opacity: '1',
                } : {};
                return <div class={color} key={color} style={style} onClick={(e) => {
                  e.preventDefault();
                  this.setState({
                    selectedColor: color,
                  });
                }}>
                  <img src="https://uploads-ssl.webflow.com/5eec38013cb14bc83af8e976/5f6e65e4b05a42da1f3da905_CursorCropped.png" class="cursor"></img>
                </div>;
              })}
            </div>

          </div>
        </main>


      </div>
    )
  }
}

