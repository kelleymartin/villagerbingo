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
    boardVillagers: [], //villagers.slice(10, 10 + 24),
    selectedColor: this.props.randomBlotterColor,
    selectedVillagers: [], //villagers.slice(10, 10 + 24),
    selectedFreePlot: false,
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

    const topMax = 15;
    const top = ((index + 1) * 17) % topMax;
    const leftMax = 30;
    const left = ((index + 1) * 23) % leftMax;
    // const angleRange = 60;
    // // angle between -30 and 29
    // const angle = -30 + ((index + 1) * 83) % angleRange;

    const blotStyle = {
      top: `${top}px`,
      left: `${left}px`,
      // transform: `rotate(${angle}deg)`,
    };

    const title = isSelected ? `Unmark ${villager.name}` : `Mark ${villager.name} as seen`;

    return <a href="#" class={`tile tile${index}`} title={title} onClick={(e) => {
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
      <img src={villager.imageUrl} class="picture" crossorigin="anonymous" draggable="false"
      alt={`${villager.name}, the ${villager.personality} ${villager.species}`}/>
      <div class="nameTagWrap">
        <p class="nameTag" style={{
          backgroundColor: villager.bubbleColor,
          color: villager.textColor,
        }}>{villager.name}</p>
      </div>
      {isSelected ? <div class={`blot ${this.state.selectedColor}`} style={blotStyle}></div> : null}
    </a>;
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
      defaultHighlightedIndex={0}
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
                    .filter(
                      ( item ) => {
                        /**
                         * @param {string} name 
                         */
                        function simplify(name) {
                          return name.toLowerCase().replace(/[^a-z]+/g, '');
                        }

                        const matchesInput = simplify(item.name).startsWith(simplify(inputValue));
                        const isAlreadyExcluded = this.state.excludedVillagers.includes(item);
                        return matchesInput && !isAlreadyExcluded;
                      }
                    )
                    .map(( item , index) => (
                      <li
                        {...getItemProps({

                          key: item.name,
                          index,
                          item,
                          style: {
                            backgroundColor:
                              highlightedIndex === index
                                ? '#3FD8E0'
                                : '#b0ecef',
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
    const selectedFreePlot = this.state.selectedFreePlot;
      
    return (
      <a href="#" class="free" onClick={(e) => {
        e.preventDefault();
          this.setState({
            selectedFreePlot: !this.state.selectedFreePlot,
          });
        }}>
        <p class="overlap">Free plot</p>
        <img src="https://uploads-ssl.webflow.com/5eec38013cb14bc83af8e976/5f6bafa4dc833eb1555aebef_BuildingIconWork%5Ez.png"
          crossorigin="anonymous" class="plot" alt="" draggable="false"/>
        {selectedFreePlot ? <div class={`blot ${this.state.selectedColor}`} style={{
          position: 'absolute',
          top: '25px',
          left: '5px',
        }}></div> : null}
      </a>
    );
  }

  handleDownloadImage(event) {
    event.preventDefault();

    var container = document.getElementById("capture");
    html2canvas(container, {
      allowTaint: false,
      useCORS: true,
      scrollX: -window.scrollX,
      scrollY: -window.scrollY,
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
            <img src="https://uploads-ssl.webflow.com/5eec38013cb14bc83af8e976/5f6f9061b867031d7214be9c_Dodo.svg"
              class="dodo" alt=""/>
            <h1>ACNH Villager Bingo<img src="https://uploads-ssl.webflow.com/5eec38013cb14bc83af8e976/5f6f898874254903e3d2a623_Looking%20Glass%20Rounded.svg"
              class="glass" alt=""/></h1>


            {this.renderVillagerSelector()}
            <div class="facesBox">
              {this.state.excludedVillagers.map((villager) => {
                return <a href="#" title={`Deselect ${villager.name}`} class="faceWrap" onClick={(e) => {
                  e.preventDefault();
                  this.setState({
                    excludedVillagers: this.state.excludedVillagers.filter(v => v !== villager),
                  });
                }}>
                  <img src="https://uploads-ssl.webflow.com/5eec38013cb14bc83af8e976/5f6e7084a3319408e7ef23fa_FaceX.svg"
                    class="faceX" alt=""/>
                  <div class="faceIcon" style={{
                    backgroundColor: villager.textColor,
                    backgroundImage: `url(${villager.iconUrl})`,
                    backgroundSize: 'contain',
                    border: `2px solid ${villager.bubbleColor}80`
                  }}>
                  </div>
                  <p class="faceName" style={{
                    backgroundColor: villager.bubbleColor,
                    color: villager.textColor,
                  }}>{villager.name}</p>
                </a>;
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
                return <a href="#" class={color} key={color} style={style} onClick={(e) => {
                  e.preventDefault();
                  this.setState({
                    selectedColor: color,
                  });
                }}>
                  {color === this.state.selectedColor ?
                    <img src="https://uploads-ssl.webflow.com/5eec38013cb14bc83af8e976/5f6e65e4b05a42da1f3da905_CursorCropped.png"
                    class="cursor" alt=""/>
                    : null}
                </a>;
              })}
            </div>

          </div>
        </main>


      </div>
    )
  }
}

