import AppTopBarHeader from "./AppTopBarHeader";
import AppTopBarMenuButton from "./AppTopBarMenuButton";

export default function AppTopbar() {
  return (
    <div
      className="flex items-stretch w-full overflow-x-auto overflow-y-hidden bg-slate-100 p-0.5"
    >
      <AppTopBarMenuButton
        label="File"
        onClick={() => {}}
      />

      <AppTopBarMenuButton
        label="Options"
        onClick={() => {}}
      />

      <AppTopBarMenuButton
        label="Tools"
        onClick={() => {}}
      />

      <AppTopBarMenuButton
        label="Help"
        onClick={() => {}}
      />

      <div className="grow flex justify-end">
        <AppTopBarHeader label="GAF Studio v0.0.0" />
      </div>
    </div>
  );
}
