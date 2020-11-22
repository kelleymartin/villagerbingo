export function NavDropdown(props) {
  return (
    <select
      onChange={(e) => {
        e.preventDefault();
        location.href = e.currentTarget.value;
      }}
    >
      <option value="/" selected={props.value === "/"}>
        NMT
      </option>
      <option value="/amiibo" selected={props.value === "/amiibo"}>
        Amiibo
      </option>
    </select>
  );
}
