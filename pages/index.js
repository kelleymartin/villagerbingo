import Head from "next/head";
import pickRandom from "pick-random";
import html2canvas from "html2canvas";

import villagers from "../data/villagers.json";
import urlFormat, { encodeState } from "../lib/url-encode";
import { BLOTTER_BY_ID, BLOTTER_SETS, OPACITIES } from "../lib/blotters";
import { VillagerDropdown } from "../components/villager-dropdown";

const ALL_THEMES = [
  {
    id: "light",
    label: "Light",
  },
  {
    id: "dark",
    label: "Dark",
  },
  {
    id: "gray",
    label: "Gray",
  },
];

const SETTING_BLOTTER_ROTATION = "blotterRotationEnabled";
const SETTING_BLOTTER_OUTLINE = "blotterOutlineEnabled";
const SETTING_TILE_BLUR = "tileBlurEnabled";

// "Random" angles between -50 and 49
const ANGLES_BY_INDEX = [
  19,
  -12,
  -43,
  26,
  -5,
  -36,
  33,
  2,
  -29,
  40,
  9,
  -22,
  47,
  16,
  -15,
  -46,
  23,
  -8,
  -39,
  30,
  -1,
  -32,
  37,
  6,
  -25,
];

function pickRandomColor() {
  const colors = Array.from(BLOTTER_SETS.get("color").items.keys());
  return pickRandom(colors)[0];
}

/**
 * @param {import('next').GetServerSidePropsContext} context
 */
export const getServerSideProps = (context) => {
  return {
    props: {
      initialURL: `https://villager.bingo${context.req.url}`,
    },
  };
};

export default class Home extends React.Component {
  state = {
    gameState: urlFormat.decodeState(this.props.initialURL),
    settingsExpanded: false,
    howToExpanded: false,
    optionsExpanded: false,
    settings: {
      theme: "light",
      blotter: "red",
      opacity: "100%",
      [SETTING_BLOTTER_ROTATION]: false,
      [SETTING_BLOTTER_OUTLINE]: false,
      [SETTING_TILE_BLUR]: false,
    },
    blotterSetId: "color",
  };

  setSettings(newSettings) {
    this.setState(
      (prevState) => {
        return {
          settings: Object.assign(prevState.settings, newSettings),
        };
      },
      () => {
        for (const [key, value] of Object.entries(newSettings)) {
          localStorage.setItem(key, value);
        }
      }
    );
  }

  setGameState(updateGameState, onStateApplied) {
    this.setState(
      (prevState) => {
        const newGameState = Object.assign({}, prevState.gameState);
        if (typeof updateGameState === "function") {
          Object.assign(newGameState, updateGameState(prevState.gameState));
        } else {
          Object.assign(newGameState, updateGameState);
        }
        return {
          gameState: newGameState,
        };
      },
      () => {
        const url = urlFormat.encodeState(location.href, this.gameState);
        history.pushState(this.gameState, null, url);

        if (typeof onStateApplied === "function") {
          onStateApplied();
        }
      }
    );
  }

  get gameState() {
    return this.state.gameState;
  }

  componentDidMount() {
    history.replaceState(this.gameState, null);
    window.addEventListener("popstate", (e) => {
      this.setState({ gameState: e.state });
    });

    let blotterId = localStorage.getItem("blotter");
    if (!BLOTTER_BY_ID.has(blotterId)) {
      blotterId = pickRandomColor();
      localStorage.setItem("blotter", blotterId);
    }
    const blotter = BLOTTER_BY_ID.get(blotterId);

    const blotOpacity = OPACITIES;

    this.setState({
      blotterSetId: blotter.setId,
      settings: {
        theme: localStorage.getItem("theme") || "light",
        blotter: blotterId,
        opacity: blotOpacity,
        [SETTING_BLOTTER_ROTATION]:
          localStorage.getItem(SETTING_BLOTTER_ROTATION) === "true",
        [SETTING_BLOTTER_OUTLINE]:
          localStorage.getItem(SETTING_BLOTTER_OUTLINE) === "true",
        [SETTING_TILE_BLUR]:
        localStorage.getItem(SETTING_TILE_BLUR) === "true",
      },
    });
  }

  pickBoardVillagers(mode, possibleVillagers) {
    if (mode === "hard") {
      return Array.from({ length: 24 }, () => possibleVillagers[0]);
    }

    return pickRandom(possibleVillagers, { count: 24 });
  }

  handleCreateBoard(event) {
    event.preventDefault();

    const possibleVillagers = villagers.filter((villager) => {
      return !this.gameState.excludedVillagers.includes(villager);
    });
    const boardVillagers = this.pickBoardVillagers(
      this.gameState.villagerSet,
      possibleVillagers
    );

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

  renderBlotter(index) {
    const topMax = 10;
    let top = ((index + 1) * 17) % topMax;
    const leftMax = 30;
    let left = ((index + 1) * 23) % leftMax;

    if (index === 12) {
      // Free plot (position 13 / index 12):
      top = 25;
      left = 10;
    }

    const blotStyle = {
      top: `${top}px`,
      left: `${left}px`,
      opacity: `100%`,
    };

    if (this.state.settings.blotterRotationEnabled) {
      const angle = ANGLES_BY_INDEX[index];
      blotStyle.transform = `rotate(${angle}deg)`;
    }

    if (this.state.settings.blotterOutlineEnabled) {
      // if (blotter.SetId = "color") {
      //   blotStyle.border = `4px solid white`;
      // }
      // else {
      blotStyle.filter = `drop-shadow(2px 2px 0 #FFF) drop-shadow(-2px -2px 0 #FFF) drop-shadow(2px -2px 0 #FFF) drop-shadow(-2px 2px 0 #FFF)`;
      // }
    }

    const blotterId = this.state.settings.blotter;
    const blotter = BLOTTER_BY_ID.get(blotterId);
    if (blotter.icon) {
      blotStyle.backgroundImage = `url(${blotter.icon})`;
    }

    return (
      <div
        className={`blot ${blotterId} blot-${blotter.setId}`}
        style={blotStyle}
      ></div>
    );
  }

  renderBoardTile(villager, index) {
    const isSelected = this.gameState.selectedVillagers.includes(villager);

    const title = isSelected
      ? `Unmark ${villager.name}`
      : `Mark ${villager.name} as seen`;

      const tileStyle = {
        filter: `blur(0px)`
      }

      if (this.state.settings.tileBlurEnabled) {
        tileStyle.filter = `blur(3px)`;
      }

    return (
      <a
        href="#"
        key={villager.name}
        className={`tile tile${index}`}
        title={title}
        onClick={(e) => {
          e.preventDefault();

          const currentSelection = this.gameState.selectedVillagers;

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
        }}
      >
        <img
          src={villager.imageUrl}
          style={tileStyle}
          className="picture"
          crossOrigin="anonymous"
          draggable="false"
          alt={`${villager.name}, the ${villager.personality} ${villager.species}`}
        />
        {/* <img className="starIndicator" src="/StarPieceRareCropped.png"></img> */}
        <div className="nameTagWrap">
          <p
            className="nameTag"
            style={{
              backgroundColor: villager.bubbleColor,
              color: villager.contrastColor,
            }}
          >
            {villager.name}
          </p>
        </div>
        {isSelected ? this.renderBlotter(index) : null}
      </a>
    );
  }

  renderVillagerSelector() {
    return (
      <VillagerDropdown
        id="excluded-villagers-autocomplete"
        labelText="Exclude a current villager:"
        disabled={this.gameState.excludedVillagers.length === 9}
        excludedVillagers={this.gameState.excludedVillagers}
        onSelection={(selection, afterSelectionApplied) => {
          this.setGameState((prevState) => {
            return {
              excludedVillagers: prevState.excludedVillagers.concat([
                selection,
              ]),
            };
          }, afterSelectionApplied);
        }}
        onCopyClick={(e) => {
          e.preventDefault();
          const cleanedState = Object.assign({}, this.gameState, {
            // Reset values we don't want in the shared URL:
            boardLabel: "",
            boardVillagers: [],
            selectedVillagers: [],
            selectedColor: null,
            selectedFreePlot: "",
            villagerSet: "standard",
          });
          const shareData = encodeState(location.href, cleanedState);
          navigator.clipboard.writeText(`${shareData}&cs=copyasurl`);
        }}
      />
    );
  }

  renderVillagerPreselector() {
    const excluded = this.gameState.excludedVillagers.concat(
      this.gameState.preselectedVillagers
    );

    return (
      <VillagerDropdown
        id="preselected-villagers-autocomplete"
        labelText="Preselect villagers:"
        excludedVillagers={excluded}
        onSelection={(selection, afterSelectionApplied) => {
          this.setGameState((prevState) => {
            return {
              preselectedVillagers: prevState.preselectedVillagers.concat([
                selection,
              ]),
            };
          }, afterSelectionApplied);
        }}
      />
    );
  }

  renderVillagerSetSelector() {
    const villagerSets = [
      {
        value: "easy",
        label: "Easy",
      },
      {
        value: "standard",
        label: "Standard",
      },
      {
        value: "hard",
        label: "Hard",
      },
      {
        value: "species-only",
        label: "Species per Tile",
      },
      {
        value: "personality-species",
        label: "Species + Personality",
      },
    ];

    return (
      <fieldset>
        <legend>Villager Set:</legend>

        {villagerSets.map((set) => (
          <React.Fragment key={set.value}>
            <label style={{ display: "block" }}>
              <input
                type="radio"
                name="villagerset"
                value={set.value}
                checked={set.value === this.gameState.villagerSet}
                onChange={(e) => {
                  this.setGameState({
                    villagerSet: set.value,
                  });
                }}
              />{" "}
              {set.label}
            </label>
          </React.Fragment>
        ))}
      </fieldset>
    );
  }

  renderBlank() {
    return (
      <div className="boardBox" id="capture">
        <div className="boardTiles">
          {Array.from({ length: 12 }, (value, idx) => (
            <div key={idx} className="tileBlank"></div>
          ))}

          {this.renderFreePlot()}

          {Array.from({ length: 12 }, (value, idx) => (
            <div key={idx} className="tileBlank"></div>
          ))}
        </div>
      </div>
    );
  }

  renderBoard() {
    const empty = this.gameState.boardVillagers.length === 0;
    if (empty) {
      return this.renderBlank();
    }
    return (
      <div className="boardBox" id="capture">
        <div className="boardTiles">
          {this.gameState.boardVillagers.slice(0, 12).map((villager, index) => {
            return this.renderBoardTile(villager, index);
          })}
          {this.renderFreePlot()}
          {this.gameState.boardVillagers.slice(12).map((villager, index) => {
            return this.renderBoardTile(villager, index + 13);
          })}
        </div>
      </div>
    );
  }

  renderFreePlot() {
    const selectedFreePlot = this.gameState.selectedFreePlot;

    return (
      <a href="#" className="free">
        <input
          className="overlap"
          type="text"
          value={this.gameState.boardLabel}
          placeholder="Free plot"
          onClick={(e) => {
            e.preventDefault();
          }}
          onChange={(e) => {
            e.preventDefault();
            this.setGameState({
              boardLabel: e.target.value,
            });
          }}
        />
        <div
          onClick={(e) => {
            e.preventDefault();
            this.setGameState({
              selectedFreePlot: !this.gameState.selectedFreePlot,
            });
          }}
        >
          <img
            src="/FreePlot.png"
            crossOrigin="anonymous"
            className="plot"
            alt=""
            draggable="false"
          />
          {selectedFreePlot ? this.renderBlotter(12) : null}
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
      link.target = "_blank";
      link.click();
    });
  }

  /**
   * @param {'dark'|'gray'|'light'} theme
   */
  setTheme(theme = "light") {
    document.body.classList.remove("dark-mode", "gray-mode");
    if (theme !== "light") {
      document.body.classList.add(`${theme}-mode`);
    }
    this.setSettings({ theme });
  }

  renderModeSelection() {
    return ALL_THEMES.map((theme) => {
      const isSelected = this.state.settings.theme === theme.id;
      const marker = isSelected ? "✓" : "";
      const markerClass = isSelected ? "selected-theme" : "";
      return (
        <button
          type="button"
          key={theme.id}
          className={`${theme.id} ${markerClass}`}
          onClick={(e) => {
            e.preventDefault();
            this.setTheme(theme.id);
          }}
        >
          {marker} {theme.label}
        </button>
      );
    });
  }

  renderHowTo() {
    if (!this.state.howToExpanded) {
      return <></>;
    }

    return (
      <>
        <div className="howToBoxBorder"></div>
        <div className="howToBox">Coming soon!</div>
      </>
    );
  }

  renderSettings() {
    if (!this.state.settingsExpanded) {
      return <></>;
    }

    return (
      <>
        <div className="settingsBoxBorder"></div>
        <div className="settingsBox">
          <label className="themeLabel">Mode:</label>
          <div className="flexButtons">{this.renderModeSelection()}</div>
          {/* <div className="divider"></div>
        <label className="languageLabel">Villager names:</label>
        <div className="divider"></div>
        <label className="alphabetLabel">Alphabetize:</label>
        {this.renderVillagerSetSelector()} */}
        </div>
      </>
    );
  }

  renderOptions() {
    if (!this.state.optionsExpanded) {
      return <></>;
    }

    return (
      <div className="optionsBox">
        <label className="opacityLabel">Opacity:</label>
        <select className="opacityDropdown">
          <option>100%</option>
        </select>
        <div className="divider"></div>
        <label className="rotationLabel">Rotation:</label>
        {this.renderOnOffSwitch({ id: SETTING_BLOTTER_ROTATION })}
        <div className="divider"></div>
        <label className="outlineLabel">Outline:</label>
        {this.renderOnOffSwitch({ id: SETTING_BLOTTER_OUTLINE })}
        <div className="divider"></div>
        <label className="blurLabel">Blur tile:</label>
        {this.renderOnOffSwitch({ id: SETTING_TILE_BLUR })}
        <div className="divider"></div>
        <label className="randomLabel">Random:</label>
      </div>
    );
  }

  // const blotOpacity = OPACITIES.get(this.state.settings.opacity);

  renderOnOffSwitch({ id, settingsKey = id, name = id }) {
    return (
      <div className="onoffswitch">
        <input
          type="checkbox"
          name={name}
          className="onoffswitch-checkbox"
          id={id}
          tabIndex="0"
          checked={!!this.state.settings[settingsKey]}
          onChange={(e) => {
            this.setSettings({
              [settingsKey]: e.currentTarget.checked,
            });
          }}
        ></input>
        <label className="onoffswitch-label" htmlFor={id}>
          <span className="onoffswitch-inner"></span>
          <span className="onoffswitch-switch"></span>
        </label>
      </div>
    );
  }

  renderBlotterSelector() {
    const blotterSet = BLOTTER_SETS.get(this.state.blotterSetId);

    const optionsClass = ["blotterSelectorBox"];
    if (this.state.optionsExpanded) {
      optionsClass.push("options-expanded");
    }

    return (
      <>
        <h2>Choose your marker:</h2>
        <div className={optionsClass.join(" ")}>
          <select
            className="setDropdown"
            value={this.state.blotterSetId}
            onChange={(e) => {
              e.preventDefault();
              this.setState({
                blotterSetId: e.currentTarget.value,
              });
            }}
          >
            {Array.from(BLOTTER_SETS.values(), (blotterSet) => {
              return (
                <option value={blotterSet.id} key={blotterSet.id}>
                  {blotterSet.name}
                </option>
              );
            })}
          </select>

          <div className="optionsButtonBorder"></div>
          <button
            className="optionsButton"
            onClick={(e) => {
              e.preventDefault();
              this.setState((prevState) => ({
                optionsExpanded: !prevState.optionsExpanded,
              }));
            }}
          >
            Options
          </button>
          {this.renderOptions()}

          {/* <select
        value={this.state.settings.opacity}>

        {Array.from(OPACITIES.values(), => {
          return (
            <option value={OPACITIES} ></option>
          );
        })}
        
        </select> */}
        </div>

        <div className="blotter">
          {Array.from(blotterSet.items.values(), (blotter) => {
            const style =
              blotter.id === this.state.settings.blotter
                ? {
                    opacity: "1",
                  }
                : {};
            if (blotter.icon) {
              style.backgroundImage = `url(${blotter.icon})`;
            }

            return (
              <a
                href="#"
                className={`${blotter.id} blotter-${blotter.setId}`}
                key={blotter.id}
                style={style}
                title={`${blotter.name} marker`}
                onClick={(e) => {
                  e.preventDefault();
                  this.setSettings({
                    blotter: blotter.id,
                  });
                }}
              >
                {blotter.id === this.state.settings.blotter ? (
                  <img src="/CursorCropped.png" className="cursor" alt="" />
                ) : null}
              </a>
            );
          })}
        </div>
      </>
    );
  }

  getLogoColor() {
    const blotter = BLOTTER_BY_ID.get(this.state.settings.blotter);
    if (blotter.setId !== "color") {
      return "teal";
    }
    return blotter.id;
  }

  render() {
    const navbarClasses = ["navbar"];
    if (this.state.howToExpanded) {
      navbarClasses.push("how-to-expanded");
    } else if (this.state.settingsExpanded) {
      navbarClasses.push("settings-expanded");
    }

    return (
      <div className={`${this.state.settings.theme}-mode`}>
        <Head>
          <title>ACNH Villager Bingo</title>
          <link rel="icon" href={`/favicon${this.getLogoColor()}.png`} />
          <link
            rel="stylesheet"
            href="https://use.typekit.net/pmt6aez.css"
          ></link>
        </Head>

        <main>
          <div className="container">
            <img src="/Dodo.svg" className="dodo" alt="" />
            <h1>
              <a className="logo" href="/">
                ACNH Villager Bing
                <span className="logo-o" href="/">
                  o
                </span>
                <img
                  src={`/titleglass${this.state.settings.theme}.svg`}
                  className={`glass ${this.getLogoColor()}`}
                  alt=""
                />
              </a>
            </h1>

            {/* <div className="separatorBig"></div> */}

            <div className={navbarClasses.join(" ")}>
              <div className="howToButtonBorder">How to play</div>
              <button
                className="howToButton"
                onClick={(e) => {
                  e.preventDefault();
                  this.setState((prevState) => ({
                    howToExpanded: !prevState.howToExpanded,
                    settingsExpanded: false,
                  }));
                }}
              >
                How to play
              </button>

              <div className="settingsButtonBorder"></div>
              <button
                className="settingsButton"
                onClick={(e) => {
                  e.preventDefault();
                  this.setState((prevState) => ({
                    howToExpanded: false,
                    settingsExpanded: !prevState.settingsExpanded,
                  }));
                }}
              >
                Settings
              </button>
              {this.renderHowTo()}
              {this.renderSettings()}
            </div>
            {this.renderVillagerSelector()}
            <div className="facesBox">
              {this.gameState.excludedVillagers.map((villager) => {
                return (
                  <a
                    href="#"
                    key={villager.name}
                    title={`Deselect ${villager.name}`}
                    className="faceWrap"
                    onClick={(e) => {
                      e.preventDefault();
                      this.setGameState({
                        excludedVillagers: this.gameState.excludedVillagers.filter(
                          (v) => v !== villager
                        ),
                      });
                    }}
                  >
                    <div
                      className="faceIcon"
                      style={{
                        backgroundColor: villager.textColor,
                        backgroundImage: `url(${villager.iconUrl})`,
                        backgroundSize: "contain",
                        border: `2px solid ${villager.bubbleColor}`,
                      }}
                    ></div>
                    <p
                      className="faceName"
                      style={{
                        backgroundColor: villager.bubbleColor,
                        color: villager.textColor,
                      }}
                    >
                      {villager.name}
                    </p>
                  </a>
                );
              })}
            </div>

            {/* <div className="separator"></div>

            {this.renderVillagerPreselector()}

            <div className="namesBox">
              {this.gameState.preselectedVillagers.map((villager) => {
                return (
                  <a
                    href="#"
                    key={villager.name}
                    title={`Remove ${villager.name}`}
                    className="namesName"
                    onClick={(e) => {
                      e.preventDefault();
                      this.setGameState({
                        preselectedVillagers: this.gameState.preselectedVillagers.filter(
                          (v) => v !== villager
                        ),
                      });
                    }}
                    style={{
                      backgroundColor: villager.bubbleColor,
                      color: villager.textColor,
                      border: `2px solid ${this.state.settings.blotter}`,
                    }}
                  >
                    {villager.name} X
                  </a>
                );
              })}
            </div> */}

            {/* <div className="separator"></div>

            <div className="setSelection">
              <label className="selectionLabel">Select a villager set:</label>
              <div className="easyBorder"></div>
              <button className="easyButton">{'<14 species'}</button>
              <div className="standardBorder"></div>
              <button className="standardButton">All villagers</button>
              <div className="hardBorder"></div>
              <button className="hardButton">Hard</button>
              <div className="speciesBorder"></div>
              <button className="speciesButton">Per species</button>
              <div className="personalitiesBorder"></div>
              <button className="personalitiesButton">Personality</button>
            </div>

            <div className="separator"></div> */}

            <div className="buttons">
              <button
                className="save"
                type="button"
                onClick={(e) => this.handleDownloadImage(e)}
              >
                Save picture
              </button>

              <button
                className="create"
                type="button"
                onClick={(e) => this.handleCreateBoard(e)}
              >
                Create board
              </button>
            </div>

            {this.renderBoard()}

            {this.renderBlotterSelector()}

            <div className="footer">
              <div className="separator"></div>
              <p className="credit">
                <b>
                  Created by:{" "}
                  <a
                    href="https://twitter.com/fromLappice"
                    className="footerLink"
                  >
                    Kelley from Lappice
                  </a>
                </b>
              </p>
              <p className="credit">
                Special thanks to: Jan, Nathaniel,{" "}
                <a
                  href="https://twitter.com/starrynite_acnh"
                  className="footerLink"
                >
                  Savannah
                </a>
                , and{" "}
                <a href="https://discord.gg/acnhoasis" className="footerLink">
                  The Oasis
                </a>
                .
              </p>
              <p className="disclaimer">
                Villager Bingo is a fan-made website that claims no ownership of
                any intellectual property associated with Nintendo or Animal
                Crossing.
              </p>
            </div>
          </div>
          <div className="bottomBar"></div>
        </main>
      </div>
    );
  }
}
