import Downshift from "downshift";
import { useRef } from "react";

import villagers from "../data/villagers.json";

export function VillagerDropdown(props) {
  const {
    id,
    excludedVillagers,
    disabled,
    onSelection,
    onCopyClick,
    labelText,
    // wrapperClassName,
  } = props;

  const exclusionInput = useRef();
  const exclusionDownshift = useRef();

  const comboboxStyles = {};
  const menuStyles = {};
  const items = villagers.filter((villager) => {
    return !excludedVillagers.includes(villager);
  });

  // const disabled = excludedVillagers.length === 9;

  return (
    <Downshift
      onChange={(selection) => {
        if (disabled || !selection) {
          return;
        }

        onSelection(selection, () => {
          // Reset the input to an empty string
          exclusionInput.current.value = "";
          exclusionDownshift.current.clearSelection();
        });
      }}
      itemToString={(item) => (item ? item.name : "")}
      defaultHighlightedIndex={0}
      ref={exclusionDownshift}
      id={id}
      labelId={`${id}-label`}
      inputId={`${id}-input`}
      menuId={`${id}-menu`}
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
          <label {...getLabelProps()}>{labelText}</label>
          <div className="inputBox">
            <div
              style={comboboxStyles}
              {...getRootProps({}, { suppressRefError: true })}
            >
              <input
                className="typeAName"
                {...getInputProps({ disabled })}
                ref={exclusionInput}
                placeholder={disabled ? "" : "Type a name..."}
              />
              <button
                className="toggle"
                {...getToggleButtonProps({ disabled })}
                aria-label={"toggle menu"}
              >
                &#9660;
              </button>
            </div>
            <ul
              {...getMenuProps()}
              style={menuStyles}
              className="downshift-options"
            >
              {isOpen
                ? items
                    .filter((item) => {
                      /**
                       * @param {string} name
                       */
                      function simplify(name) {
                        return name.toLowerCase().replace(/[^a-z]+/g, "");
                      }

                      const matchesInput = simplify(item.name).startsWith(
                        simplify(inputValue)
                      );
                      const isAlreadyExcluded = excludedVillagers.includes(
                        item
                      );
                      return matchesInput && !isAlreadyExcluded;
                    })
                    .map((item, index) => {
                      const classNames = [];
                      if (highlightedIndex === index) {
                        classNames.push("downshift-highlight");
                      }
                      if (selectedItem === item) {
                        classNames.push("downshift-selected");
                      }

                      return (
                        <li
                          {...getItemProps({
                            key: item.name,
                            index,
                            item,
                            className: classNames.join(" "),
                          })}
                        >
                          {item.name}
                        </li>
                      );
                    })
                : null}
            </ul>
          </div>
          {onCopyClick && (
            <button type="button" className="copy" onClick={onCopyClick}>
              Copy as url
            </button>
          )}
        </div>
      )}
    </Downshift>
  );
}
