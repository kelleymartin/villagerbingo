import Head from 'next/head'
import styles from '../styles/Home.module.css'
import pickRandom from 'pick-random'
import Downshift from 'downshift'
import html2canvas from 'html2canvas'

import villagers from '../data/villagers.json'
import urlFormat, { encodeState } from '../lib/url-encode'

const ALL_COLORS = urlFormat.ALL_COLORS;

/**
 * @param {import('next').GetServerSidePropsContext} context
 */
export const getServerSideProps = (context) => {
  return {
    props: {
      initialURL: `https://villager.bingo${context.req.url}`,
      randomColor: pickRandom(ALL_COLORS)[0],
    },
  };
};

export default class Home extends React.Component {
  state =
    urlFormat.decodeState(this.props.initialURL, this.props.randomColor);

  setGameState(updateState, onStateApplied) {
    this.setState(updateState, () => {
      const url = urlFormat.encodeState(location.href, this.state);
      history.pushState(this.state, null, url);

      if (typeof onStateApplied === 'function') {
        onStateApplied();
      }
    });
  }

  componentDidMount() {
    history.replaceState(this.state, null);
    window.addEventListener('popstate', (e) => {
      this.setState(e.state);
    });

    const currentTheme = localStorage.getItem("theme");
    if (currentTheme == "dark") {
      document.body.classList.add("dark-mode");
    }
  }

  pickBoardVillagers(mode, possibleVillagers) {
    if (mode === 'hard') {
      return Array.from({ length: 24 }, () => possibleVillagers[0]);
    }

    return pickRandom(possibleVillagers, { count: 24 });
  }

  handleCreateBoard(event) {
    event.preventDefault();

    const possibleVillagers = villagers.filter((villager) => {
      return !this.state.excludedVillagers.includes(villager);
    });
    const boardVillagers = this.pickBoardVillagers(this.state.villagerSet, possibleVillagers);

    const sortedVillagers = boardVillagers.sort((a, b) => {
      return a.name.localeCompare(b.name);
    });

    this.setGameState({
      boardVillagers: sortedVillagers,
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

    const topMax = 10;
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

    return <a href="#" key={villager.name} className={`tile tile${index}`} title={title} onClick={(e) => {
      e.preventDefault();

      const currentSelection = this.state.selectedVillagers;

      // Is this villager already selected?
      if (isSelected) {
        // Remove from selection!
        this.setGameState({
          selectedVillagers: currentSelection.filter((selected) => {
            return selected !== villager;
          }),
        });
      } else {
        // Not selected yet - select it now!
        this.setGameState({
          selectedVillagers: currentSelection.concat([villager]),
        });
      }
    }}>
      <img src={villager.imageUrl} className="picture" crossOrigin="anonymous" draggable="false"
        alt={`${villager.name}, the ${villager.personality} ${villager.species}`} />
      <div className="nameTagWrap">
        <p className="nameTag" style={{
          backgroundColor: villager.bubbleColor,
          color: villager.textColor,
        }}>{villager.name}</p>
      </div>
      {isSelected ? <div className={`blot ${this.state.selectedColor}`} style={blotStyle}></div> : null}
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

        this.setGameState(
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
      id="excluded-villagers-autocomplete"
      labelId="excluded-villagers-autocomplete-label"
      inputId="excluded-villagers-autocomplete-input"
      menuId="excluded-villagers-autocomplete-menu"
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
          <div className="exclusionBox">
            <label {...getLabelProps()}>Exclude a current villager:</label>
            <div className="inputBox">
              <div
                style={comboboxStyles}
                {...getRootProps({}, { suppressRefError: true })}
              >
                <input className="typeAName" {...getInputProps({ disabled })} ref={exclusionInput => {
                  this.exclusionInput = exclusionInput;
                }}
                  placeholder={disabled ? "" : "Type a name..."}/>
                <button className="toggle" {...getToggleButtonProps({ disabled })} aria-label={'toggle menu'}>
                  &#11015;
              </button>
              </div>
              <ul {...getMenuProps()} style={menuStyles}>
                {isOpen
                  ? items
                    .filter(
                      (item) => {
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
                    .map((item, index) => (
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
            <button type="button" className="copy" onClick={(e) => {
              e.preventDefault();
              const cleanedState = Object.assign({}, this.state, {
                // Reset values we don't want in the shared URL:
                boardLabel: '',
                boardVillagers: [],
                selectedVillagers: [],
                selectedColor: null,
                selectedFreePlot: '',
                villagerSet: 'standard',
              });
              const shareData = encodeState(location.href, cleanedState);
              navigator.clipboard.writeText(shareData);
            }}>Copy as url</button>
            {/* <button type="button" className="import" onClick={async (e) => {
              e.preventDefault();
              const shareData = await navigator.clipboard.readText();
              const excluded = shareData
                .split(',')
                .map(name => villagers.find(v => v.name === name))
                .filter(v => v !== null)
                .slice(0, 9);
              this.setGameState({
                excludedVillagers: excluded,
              });
            }}>Paste Villagers</button> */}
          </div>
        )}
    </Downshift>
  }

  renderBlank() {
    return (
      <div className="boardBox" id="capture">
        <div className="boardTiles">
          {Array.from({ length: 12 }, (value, idx) => <div key={idx} className="tileBlank"></div>)}

          {this.renderFreePlot()}

          {Array.from({ length: 12 }, (value, idx) => <div key={idx} className="tileBlank"></div>)}
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
      <div className="boardBox" id="capture">
        <div className="boardTiles">
          {
            this.state.boardVillagers
              .slice(0, 12)
              .map((villager, index) => {
                return this.renderBoardTile(villager, index);
              })
          }
          {this.renderFreePlot()}
          {
            this.state.boardVillagers
              .slice(12)
              .map((villager, index) => {
                return this.renderBoardTile(villager, index + 12);
              })
          }
        </div>
      </div>
    );
  }

  renderFreePlot() {
    const selectedFreePlot = this.state.selectedFreePlot;
    const boardLabel = this.state.boardLabel;

    return (
      <a href="#" className="free">
        <input
          className="overlap"
          type="text"
          value={this.state.boardLabel}
          placeholder="Free plot"
          onClick={(e) => {
            e.preventDefault();
          }}
          onChange={(e) => {
            e.preventDefault();
            this.setGameState({
              boardLabel: e.target.value,
            });
          }} />
        <div onClick={(e) => {
          e.preventDefault();
          this.setGameState({
            selectedFreePlot: !this.state.selectedFreePlot,
          });
        }}>
          <img src="/FreePlot.png"
            crossOrigin="anonymous" className="plot" alt="" draggable="false" />
          {selectedFreePlot ? <div className={`blot ${this.state.selectedColor}`} style={{
            position: 'absolute',
            top: '30px',
            left: '5px',
          }}></div> : null}
        </div>
      </a>
    );
  }

  handleDownloadImage(event) {
    event.preventDefault();

    var container = document.getElementById("capture");
    html2canvas(container, {
      allowTaint: false,
      useCORS: true,
      scrollX: -8,
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

  renderVillagerSetSelector() {
    const villagerSets = [
      {
        value: 'easy',
        label: 'Easy',
      },
      {
        value: 'standard',
        label: 'Standard',
      },
      {
        value: 'hard',
        label: 'Hard',
      },
      {
        value: 'species-only',
        label: 'Species per Tile',
      },
      {
        value: 'personality-species',
        label: 'Species + Personality',
      },
    ];

    return (
      <fieldset>
        <legend>Villager Set:</legend>

        {villagerSets.map(set => (
          <React.Fragment key={set.value}>
            <label style={{ display: 'block' }}>
              <input type="radio"
                name="villagerset"
                value={set.value}
                checked={set.value === this.state.villagerSet}
                onChange={e => {
                  this.setGameState({
                    villagerSet: set.value,
                  });
                }} />
              {' '}{set.label}
            </label>
          </React.Fragment>
        ))}
      </fieldset>
    );
  }
  
  renderModeSelection() {
    return (
    <button type="button" className="dark" onClick={(e) => {
      e.preventDefault();
      const theme = document.body.classList.toggle("dark-mode") ? "dark" : "light";
      localStorage.setItem("theme", theme);
    } }>Toggle Dark Mode</button>)
  }

  render() {
    return (
      <div className={styles.container}>
        <Head>
          <title>ACNH Villager Bingo</title>
          <link rel="icon" href={`/favicon${this.state.selectedColor}.png`} />
          <link rel="stylesheet" href="https://use.typekit.net/pmt6aez.css"></link>
        </Head>

        <main className={styles.main}>
          <div className="container">
            <img src="/Dodo.svg"
              className="dodo" alt="" />
            <h1>
              <a className="logo" href="/">ACNH Villager Bingo<img src={`/titleglass${this.state.selectedColor}.svg`}
                className="glass" alt="" />
              </a>
            </h1>

            <div className="separatorBig"></div>

            <div className="navbar">
              <div className="howToButtonBorder"></div>
              <button className="howToButton">
                How to play
              </button>
              <div className="settingsButtonBorder"></div>
              <button className="settingsButton">
                Settings
              </button>
              <div className="howToBoxBorder"></div>
              <div className="howToBox">
                Coming soon!
              </div>
              <div className="settingsBoxBorder"></div>
              <div className="settingsBox">
                {this.renderVillagerSetSelector()}
              </div>
            </div>
            {this.renderModeSelection()}
            {this.renderVillagerSelector()}
            <div className="facesBox">
              {this.state.excludedVillagers.map((villager) => {
                return <a href="#" key={villager.name} title={`Deselect ${villager.name}`} className="faceWrap" onClick={(e) => {
                  e.preventDefault();
                  this.setGameState({
                    excludedVillagers: this.state.excludedVillagers.filter(v => v !== villager),
                  });
                }}>
                  <img src="/FaceX.svg"
                    className="faceX" alt="" />
                  <div className="faceIcon" style={{
                    backgroundColor: villager.textColor,
                    backgroundImage: `url(${villager.iconUrl})`,
                    backgroundSize: 'contain',
                    border: `2px solid ${villager.bubbleColor}80`
                  }}>
                  </div>
                  <p className="faceName" style={{
                    backgroundColor: villager.bubbleColor,
                    color: villager.textColor,
                  }}>{villager.name}</p>
                </a>;
              })}
            </div>

            <div className="separator"></div>

            <div className="setSelection">
              <label className="selectionLabel">Select a villager set:</label>
              <div className="easyBorder"></div>
              <button className="easyButton">{'<14 villagers'}</button>
              <div className="standardBorder"></div>
              <button className="standardButton">All villagers</button>
              <div className="hardBorder"></div>
              <button className="hardButton">Hard</button>
              <div className="speciesBorder"></div>
              <button className="speciesButton">Per species</button>
              <div className="personalitiesBorder"></div>
              <button className="personalitiesButton">Personality</button>
            </div>

            <div className="separator"></div>

            <div className="buttons">

              <button className="save" type="button" onClick={(e) => this.handleDownloadImage(e)}>
                Save picture
              </button>

              <button className="create" type="button" onClick={(e) => this.handleCreateBoard(e)}>
                Create board
              </button>
            </div>

            {this.renderBoard()}

            <h2>Choose your marker color:</h2>

            <div className="blotter">
              {ALL_COLORS.map((color) => {
                const style = color === this.state.selectedColor ? {
                  opacity: '1',
                } : {};
                return <a href="#" className={color} key={color} style={style} alt={`${color} marker`} onClick={(e) => {
                  e.preventDefault();
                  this.setGameState({
                    selectedColor: color,
                  });
                }}>
                  {color === this.state.selectedColor ?
                    <img src="/CursorCropped.png"
                      className="cursor" alt="" />
                    : null}
                </a>;
              })}
            </div>

            <div className="footer">
              <div className="separator"></div>
              <p className="credit"><b>Created by: <a href="https://twitter.com/fromLappice" className="footerLink">Kelley from Lappice</a></b></p>
              <p className="credit">Special thanks to: Jan, Nathaniel, <a href="https://twitter.com/starrynite_acnh" className="footerLink">Savannah</a>, and <a href="https://discord.gg/acnhoasis" className="footerLink">The Oasis</a>.</p>
              <p className="disclaimer">Villager Bingo is a fan-made website that claims no ownership of any intellectual property associated with Nintendo or Animal Crossing.</p>
            </div>
          </div>
          <div className="bottomBar" style={{
            height: '5px',
            backgroundImage: 'linear-gradient(to right, rgba(255, 64, 64, 0.3), rgba(255, 121, 31, 0.3), rgba(255, 208, 13, 0.3), rgba(120, 221, 98, 0.3), rgba(63, 216, 224, 0.3), rgba(9, 97, 246, 0.3), rgba(160, 111, 206, 0.3), rgba(249, 147, 206, 0.3), rgba(192, 171, 114, 0.3)'
          }}></div>
        </main>
      </div>
    )
  }
}

