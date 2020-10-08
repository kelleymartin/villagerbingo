import Head from 'next/head'
import styles from '../styles/Home.module.css'
import pickRandom from 'pick-random'
import Downshift from 'downshift'
import html2canvas from 'html2canvas'

import villagers from '../data/villagers.json'
import urlFormat from '../lib/url-encode'

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
  }

  handleCreateBoard(event) {
    event.preventDefault();

    const possibleVillagers = villagers.filter((villager) => {
      return !this.state.excludedVillagers.includes(villager);
    });
    const boardVillagers = pickRandom(possibleVillagers, { count: 24 });

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
      <img src={villager.imageUrl} class="picture" crossOrigin="anonymous" draggable="false"
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
                <input class="typeAName" {...getInputProps({ disabled })} ref={exclusionInput => {
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
              this.setGameState({
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
      
    return (
      <a href="#" class="free" onClick={(e) => {
        e.preventDefault();
          this.setGameState({
            selectedFreePlot: !this.state.selectedFreePlot,
          });
        }}>
        <input
          class="overlap"
          type="text"
          value={this.state.boardLabel}
          defaultValue="Free plot"
          onChange={this.handleChange}
        />
        <img src="/FreePLot.png"
          crossOrigin="anonymous" class="plot" alt="" draggable="false"/>
        {selectedFreePlot ? <div class={`blot ${this.state.selectedColor}`} style={{
          position: 'absolute',
          top: '30px',
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

  render() {
    return (
      <div className={styles.container}>
        <Head>
          <title>ACNH Villager Bingo</title>
          <link rel="icon" href={`/favicon${this.state.selectedColor}.png`} />
          <link rel="stylesheet" href="https://use.typekit.net/pmt6aez.css"></link>
        </Head>

        <main className={styles.main}>
          <div class="container">
            <img src="/Dodo.svg"
              class="dodo" alt=""/>
            <h1>
              <a class="logo" href="https://villager.bingo/">ACNH Villager Bingo<img src={`/titleglass${this.state.selectedColor}.svg`}
              class="glass" alt=""/>
              </a>
            </h1>


            {this.renderVillagerSelector()}
            <div class="facesBox">
              {this.state.excludedVillagers.map((villager) => {
                return <a href="#" title={`Deselect ${villager.name}`} class="faceWrap" onClick={(e) => {
                  e.preventDefault();
                  this.setGameState({
                    excludedVillagers: this.state.excludedVillagers.filter(v => v !== villager),
                  });
                }}>
                  <img src="/FaceX.svg"
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
                return <a href="#" class={color} key={color} style={style} alt={`${color} marker`} onClick={(e) => {
                  e.preventDefault();
                  this.setGameState({
                    selectedColor: color,
                  });
                }}>
                  {color === this.state.selectedColor ?
                    <img src="/CursorCropped.png"
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

