import React, { useState, useEffect, useCallback } from "react";
import payrollService from "../../../service/payrollService";

// Components
import EpfTab from "./statutory_component_tabs/Epf_tab";
import EnableEPF from "./statutory_component_tabs/epf_enable";
import UpsertEPF from "./statutory_component_tabs/upsertepf";

import EsiTab from "./statutory_component_tabs/Esi_tab";
import EnableESI from "./statutory_component_tabs/esi_enable";
import UpsertESI from "./statutory_component_tabs/upsertesi";

import ProfessionalTaxTab from "./statutory_component_tabs/pt_tab";
import UpsertPT from "./statutory_component_tabs/upsertpt";

import LabourWelfareFundTab from "./statutory_component_tabs/lw_fund_tab";
import UpsertLWF from "./statutory_component_tabs/upsertlwf"; // ✅ NEW

const StatutoryComponents = () => {
  const tabs = ["EPF", "ESI", "PT", "LWF"];
  const [activeTab, setActiveTab] = useState("EPF");

  // ---------------- EPF ----------------
  const [epfData, setEpfData] = useState(null);
  const [epfEnabled, setEpfEnabled] = useState(false);
  const [epfLoading, setEpfLoading] = useState(false);
  const [epfRowExists, setEpfRowExists] = useState(true);

  // ---------------- ESI ----------------
  const [esiData, setEsiData] = useState(null);
  const [esiEnabled, setEsiEnabled] = useState(false);
  const [esiLoading, setEsiLoading] = useState(false);
  const [esiRowExists, setEsiRowExists] = useState(true);

  // ---------------- PT ----------------
  const [ptData, setPtData] = useState(null);
  const [ptLoading, setPtLoading] = useState(false);
  const [ptEditMode, setPtEditMode] = useState(false);

  // ---------------- LWF ----------------
  const [lwfData, setLwfData] = useState(null);
  const [lwfEnabled, setLwfEnabled] = useState(false);
  const [lwfLoading, setLwfLoading] = useState(false);
  const [lwfEditMode, setLwfEditMode] = useState(false); // ✅ NEW

  // ---------------- Global ----------------
  const [loading, setLoading] = useState(true);

  // ================= FETCHERS =================

  const fetchEPF = useCallback(async () => {
    setEpfLoading(true);
    try {
      const data = await payrollService.getEPF();
      setEpfData(data);
      setEpfEnabled(Boolean(data?.enabled));
      setEpfRowExists(Boolean(data?.row_exists));
    } finally {
      setEpfLoading(false);
    }
  }, []);

  const fetchESI = useCallback(async () => {
    setEsiLoading(true);
    try {
      const data = await payrollService.getESI();
      setEsiData(data);
      setEsiEnabled(Boolean(data?.enabled));
      setEsiRowExists(Boolean(data?.row_exists));
    } finally {
      setEsiLoading(false);
    }
  }, []);

  const fetchPT = useCallback(async () => {
    setPtLoading(true);
    try {
      const data = await payrollService.getPT();
      setPtData(data);
      setPtEditMode(false);
    } finally {
      setPtLoading(false);
    }
  }, []);

  const fetchLWF = useCallback(async () => {
    setLwfLoading(true);
    try {
      const data = await payrollService.getLWF();
      setLwfData(data);
      setLwfEnabled(Boolean(data?.enabled));
      setLwfEditMode(false); // ✅ reset after fetch
    } finally {
      setLwfLoading(false);
    }
  }, []);

  // ================= INITIAL LOAD =================

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      await Promise.all([fetchEPF(), fetchESI(), fetchPT(), fetchLWF()]);
      setLoading(false);
    };
    fetchAll();
  }, [fetchEPF, fetchESI, fetchPT, fetchLWF]);

  // ================= HANDLERS =================

  const handleEnableEpf = async () => {
    setEpfLoading(true);
    try {
      await payrollService.enableEPF();
      await fetchEPF();
    } finally {
      setEpfLoading(false);
    }
  };

  const handleDisableEpf = async () => {
    setEpfLoading(true);
    try {
      await payrollService.disableEPF();
      await fetchEPF();
    } finally {
      setEpfLoading(false);
    }
  };

  const handleEnableEsi = async () => {
    setEsiLoading(true);
    try {
      await payrollService.enableESI();
      await fetchESI();
    } finally {
      setEsiLoading(false);
    }
  };

  const handleDisableEsi = async () => {
    setEsiLoading(true);
    try {
      await payrollService.disableESI();
      await fetchESI();
    } finally {
      setEsiLoading(false);
    }
  };

  // -------- LWF --------

  const handleEnableLWF = async ({ state, deduction_cycle }) => {
    setLwfLoading(true);
    try {
      await payrollService.enableLWF({ state, deduction_cycle });
      await fetchLWF();
    } finally {
      setLwfLoading(false);
    }
  };

  const handleDisableLWF = async () => {
    setLwfLoading(true);
    try {
      await payrollService.disableLWF();
      await fetchLWF();
    } finally {
      setLwfLoading(false);
    }
  };

  // ================= TAB CONTENT =================

  const tabComponents = {
    EPF: epfLoading ? (
      <div className="text-center py-10">Loading...</div>
    ) : !epfRowExists ? (
      <UpsertEPF onSuccess={fetchEPF} />
    ) : epfEnabled ? (
      <EpfTab epfData={epfData} onDisable={handleDisableEpf} />
    ) : (
      <EnableEPF onEnable={handleEnableEpf} />
    ),

    ESI: esiLoading ? (
      <div className="text-center py-10">Loading...</div>
    ) : !esiRowExists ? (
      <UpsertESI onSuccess={fetchESI} />
    ) : esiEnabled ? (
      <EsiTab esiData={esiData} onDisable={handleDisableEsi} />
    ) : (
      <EnableESI onEnable={handleEnableEsi} />
    ),

    PT: ptLoading ? (
      <div className="text-center py-10">Loading...</div>
    ) : ptEditMode ? (
      <UpsertPT data={ptData} onSuccess={fetchPT} />
    ) : (
      <ProfessionalTaxTab data={ptData} onEdit={() => setPtEditMode(true)} />
    ),

    // ✅ FIXED LWF FLOW
    LWF: lwfLoading ? (
      <div className="text-center py-10">Loading...</div>
    ) : lwfEditMode ? (
      <UpsertLWF lwfData={lwfData} onSuccess={fetchLWF} />
    ) : (
      <LabourWelfareFundTab
        lwfData={lwfData}
        enabled={lwfEnabled}
        loading={lwfLoading}
        onEnable={handleEnableLWF}
        onDisable={handleDisableLWF}
        onEdit={() => setLwfEditMode(true)} // ✅ Update button trigger
      />
    ),
  };

  return (
    <div className="bg-white rounded-lg p-6">
      <div className="flex gap-6 border-b mb-6">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-2 ${
              activeTab === tab
                ? "border-b-2 border-black font-medium"
                : "text-gray-400"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading ? <div className="py-10">Loading...</div> : tabComponents[activeTab]}
    </div>
  );
};

export default StatutoryComponents;
