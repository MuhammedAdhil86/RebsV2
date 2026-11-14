import React, { useState } from "react";
import DashboardLayout from "../ui/pagelayout";
import HeaderGlobal from "../ui/headerglobal";
import ExitProcessList from "../components/exitprocess/ExitProcessList";
import ExitProcessDetail from "../components/exitprocess/ExitProcessDetail";

/* ---------- page: list <-> detail ---------- */

function ExitProcess() {
  const [selectedId, setSelectedId] = useState(null);
  // bumped when coming back from a detail so the list shows fresh progress
  const [listKey, setListKey] = useState(0);

  const closeDetail = () => {
    setSelectedId(null);
    setListKey((k) => k + 1);
  };

  return (
    <DashboardLayout userName="Admin" onLogout={() => {}}>
      <div className="w-full space-y-4">
        <HeaderGlobal userName="Admin" />

        <div className="p-4 bg-white rounded-lg shadow-sm space-y-6 font-poppins font-normal">
          {selectedId ? (
            <ExitProcessDetail id={selectedId} onBack={closeDetail} />
          ) : (
            <ExitProcessList key={listKey} onOpen={setSelectedId} />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default ExitProcess;
