import Head from "next/head";
import pickRandom from "pick-random";
import html2canvas from "html2canvas";

import amiibo from "../data/amiibo.json";
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

const SERIES_OPTIONS = [
  {
    seriesId: 1,
    label: "Series 1",
  },
  {
    seriesId: 2,
    label: "Series 2",
  },
  {
    seriesId: 3,
    label: "Series 3",
  },
  {
    seriesId: 4,
    label: "Series 4",
  },
  {
    seriesId: 5,
    label: "Welcome",
  },
];

const SETTING_BLOTTER_ROTATION = "blotterRotationEnabled";
const SETTING_BLOTTER_OUTLINE = "blotterOutlineEnabled";
const SETTING_BLOTTER_OPACITY = "blotterOpacity";
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
    gameState: urlFormat.decodeState(this.props.initialURL, amiibo),
    settingsExpanded: false,
    howToExpanded: false,
    optionsExpanded: false,
    settings: {
      theme: "light",
      blotter: "red",
      [SETTING_BLOTTER_OPACITY]: "100%",
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

    const storedOpacity = localStorage.getItem(SETTING_BLOTTER_OPACITY);
    const blotterOpacity = OPACITIES.includes(storedOpacity)
      ? storedOpacity
      : "100%";

    this.setState({
      blotterSetId: blotter.setId,
      settings: {
        theme: localStorage.getItem("theme") || "light",
        blotter: blotterId,
        [SETTING_BLOTTER_OPACITY]: blotterOpacity,
        [SETTING_BLOTTER_ROTATION]:
          localStorage.getItem(SETTING_BLOTTER_ROTATION) === "true",
        [SETTING_BLOTTER_OUTLINE]:
          localStorage.getItem(SETTING_BLOTTER_OUTLINE) === "true",
        [SETTING_TILE_BLUR]: localStorage.getItem(SETTING_TILE_BLUR) === "true",
      },
    });
  }

  pickBoardVillagers(possibleVillagers, npcCount) {
    return [
      ...pickRandom(
        possibleVillagers.filter((villager) => villager.type === "NPC"),
        { count: npcCount }
      ),
      ...pickRandom(
        possibleVillagers.filter((villager) => villager.type === "Villager"),
        { count: 24 - npcCount }
      ),
    ];
  }

  handleCreateBoard(event) {
    event.preventDefault();

    const selectedSeriesId = this.gameState.amiiboSeriesId;

    const possibleVillagers = amiibo.filter((villager) => {
      return (
        !this.gameState.excludedVillagers.includes(villager) &&
        villager.series === selectedSeriesId
      );
    });
    const npcFraction = this.gameState.amiiboNPCFraction;
    const npcCount = selectedSeriesId === 5 ? 0 : 24 / npcFraction; // a third is NPCs
    const boardVillagers = this.pickBoardVillagers(possibleVillagers, npcCount);

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
      opacity: this.state.settings[SETTING_BLOTTER_OPACITY],
    };

    if (this.state.settings.blotterRotationEnabled) {
      const angle = ANGLES_BY_INDEX[index];
      blotStyle.transform = `rotate(${angle}deg)`;
    }

    const blotter = BLOTTER_BY_ID.get(this.state.settings.blotter).forIndex(
      index
    );
    const blotterId = blotter.id;
    if (blotter.icon) {
      blotStyle.backgroundImage = `url(${blotter.icon})`;
    }

    if (this.state.settings.blotterOutlineEnabled) {
      if (blotter.setId === "color") {
        blotStyle.border = `4px solid white`;
      } else if (blotter.setId !== "reactions") {
        blotStyle.filter = `drop-shadow(2px 2px 0 #FFF) drop-shadow(-2px -2px 0 #FFF) drop-shadow(2px -2px 0 #FFF) drop-shadow(-2px 2px 0 #FFF)`;
      }
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
      filter: `blur(0px)`,
    };

    if (this.state.settings.tileBlurEnabled && isSelected) {
      tileStyle.filter = `blur(4px)`;
    }
    //djhnghvewbnref
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
          className={`amiibo amiibo-${villager.series}`}
          crossOrigin="anonymous"
          draggable="false"
          alt={villager.name}
        />
        {/* <img className="starIndicator" src="/StarPieceRareCropped.png"></img> */}
        <div className="nameTagWrap">
          <p
            className="nameTag"
            style={{
              backgroundColor: villager.darkerColor,
              color: `#ffffff`,
            }}
          >
            {villager.name}
          </p>
        </div>
        {isSelected ? this.renderBlotter(index) : null}
      </a>
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

    const tileStyle = {
      filter: `blur(0px)`,
    };

    if (this.state.settings.tileBlurEnabled && selectedFreePlot) {
      tileStyle.filter = `blur(4px)`;
    }

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
            style={tileStyle}
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
        <select
          className="opacityDropdown"
          value={this.state.settings[SETTING_BLOTTER_OPACITY]}
          onChange={(e) => {
            e.preventDefault();
            this.setSettings({
              [SETTING_BLOTTER_OPACITY]: e.currentTarget.value,
            });
          }}
        >
          {Array.from(OPACITIES, (opacityPct) => {
            return (
              <option key={opacityPct} value={opacityPct}>
                {opacityPct}
              </option>
            );
          })}
        </select>
        <div className="box-divider"></div>
        <label className="rotationLabel">Rotation:</label>
        {this.renderOnOffSwitch({ id: SETTING_BLOTTER_ROTATION })}
        <div className="box-divider"></div>
        <label className="outlineLabel">White outline:</label>
        {this.renderOnOffSwitch({ id: SETTING_BLOTTER_OUTLINE })}
        <div className="box-divider"></div>
        <label className="blurLabel">Blur marked tiles:</label>
        {this.renderOnOffSwitch({ id: SETTING_TILE_BLUR })}
      </div>
    );
  }

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

              <select onChange="">
                <option value="https://villager.bingo/">NMT</option>
                <option value="https://villager.bingo/amiibo/">Amiibo</option>
              </select>

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

            {/* <div className="separator"></div> */}

            <div className="setSelection">
              <label className="selectionLabel">Select amiibo series:</label>
              {SERIES_OPTIONS.map((seriesOption) => {
                const isActive =
                  seriesOption.seriesId === this.gameState.amiiboSeriesId;
                return (
                  <button
                    key={seriesOption.seriesId}
                    className={`amiibo-series amiibo-series-${
                      seriesOption.seriesId
                    } ${isActive ? "amiibo-series-active" : ""}`}
                    onClick={(e) => {
                      e.preventDefault();
                      this.setGameState({
                        amiiboSeriesId: seriesOption.seriesId,
                      });
                    }}
                  >
                    {seriesOption.label}
                  </button>
                );
              })}
            </div>

            <div className="fractionSelection">
              <label>
                <input
                  type="radio"
                  disabled={this.state.gameState.amiiboSeriesId === 5}
                  checked={
                    this.state.gameState.amiiboSeriesId !== 5 &&
                    this.state.gameState.amiiboNPCFraction === 3
                  }
                  onClick={(e) => {
                    this.setGameState({
                      amiiboNPCFraction: 3,
                    });
                  }}
                />
                One in three are NPCs
              </label>
              <label>
                <input
                  type="radio"
                  disabled={this.state.gameState.amiiboSeriesId === 5}
                  checked={
                    this.state.gameState.amiiboSeriesId !== 5 &&
                    this.state.gameState.amiiboNPCFraction === 6
                  }
                  onClick={(e) => {
                    this.setGameState({
                      amiiboNPCFraction: 6,
                    });
                  }}
                />
                One in six are NPCs
              </label>
            </div>

            {/* <div className="separator"></div> */}

            <div className="buttons">
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
