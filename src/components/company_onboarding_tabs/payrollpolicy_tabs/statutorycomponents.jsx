import React, { useState, useEffect, useCallback } from "react";
import payrollService from "../../../service/payrollService";
import { toast } from "react-hot-toast";

// Tab Layout Components
import EpfTab from "./statutory_component_tabs/Epf_tab";
import EnableEPF from "./statutory_component_tabs/epf_enable";
import UpsertEPF from "./statutory_component_tabs/upsertepf";

import EsiTab from "./statutory_component_tabs/Esi_tab";
import EnableESI from "./statutory_component_tabs/esi_enable";
import UpsertESI from "./statutory_component_tabs/upsertesi";

import ProfessionalTaxTab from "./statutory_component_tabs/pt_tab";
import UpsertPT from "./statutory_component_tabs/upsertpt";

import LabourWelfareFundTab from "./statutory_component_tabs/lw_fund_tab";
import UpsertLWF from "./statutory_component_tabs/upsertlwf";

import TdsTab from "./statutory_component_tabs/tds_tab";

const StatutoryComponents = () => {
  const tabs = ["EPF", "ESI", "PT", "LWF", "TDS"];
  const [activeTab, setActiveTab] = useState("EPF");

  // ---------------- EPF States ----------------
  const [epfData, setEpfData] = useState(null);
  const [epfEnabled, setEpfEnabled] = useState(false);
  const [epfLoading, setEpfLoading] = useState(false);
  const [epfRowExists, setEpfRowExists] = useState(true);
  const [epfEditMode, setEpfEditMode] = useState(false);

  // ---------------- ESI States ----------------
  const [esiData, setEsiData] = useState(null);
  const [esiEnabled, setEsiEnabled] = useState(false);
  const [esiLoading, setEsiLoading] = useState(false);
  const [esiRowExists, setEsiRowExists] = useState(true);

  // ---------------- PT States ----------------
  const [ptData, setPtData] = useState(null);
  const [ptLoading, setPtLoading] = useState(false);
  const [ptEditMode, setPtEditMode] = useState(false);

  // ---------------- LWF States ----------------
  const [lwfData, setLwfData] = useState(null);
  const [lwfEnabled, setLwfEnabled] = useState(false);
  const [lwfLoading, setLwfLoading] = useState(false);
  const [lwfEditMode, setLwfEditMode] = useState(false);

  // ---------------- TDS States ----------------
  const [tdsData, setTdsData] = useState(null);
  const [tdsLoading, setTdsLoading] = useState(false);

  // ---------------- Global Loading ----------------
  const [loading, setLoading] = useState(true);

  // ================= FETCHERS =================

  const fetchEPF = useCallback(async () => {
    setEpfLoading(true);
    try {
      const data = await payrollService.getEPF();
      setEpfData(data);
      setEpfEnabled(Boolean(data?.enabled));
      setEpfRowExists(Boolean(data?.row_exists));
      setEpfEditMode(false);
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
      setLwfEditMode(false);
    } finally {
      setLwfLoading(false);
    }
  }, []);

  const fetchTDS = useCallback(async () => {
    setTdsLoading(true);
    try {
      const data = await payrollService.getTDS();
      setTdsData(data);
    } finally {
      setTdsLoading(false);
    }
  }, []);

  // ================= INITIAL LOAD =================

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      await Promise.all([
        fetchEPF(),
        fetchESI(),
        fetchPT(),
        fetchLWF(),
        fetchTDS(),
      ]);
      setLoading(false);
    };
    fetchAll();
  }, [fetchEPF, fetchESI, fetchPT, fetchLWF, fetchTDS]);

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

  // ✅ HANDLES THE MANUALLY FORCED FAKE-200 ERROR RESPONSE
  const handleUpdateTDS = async (payload) => {
    setTdsLoading(true);
    try {
      const response = await payrollService.upsertTDS(payload);
      toast.success(response?.message || "TDS Settings updated successfully!");
      await fetchTDS();
      return true;
    } catch (err) {
      console.error("UI Caught exception track:", err);

      // Now catches the native string error flawlessly from our forced throw block
      if (err?.backendError && typeof err.backendError === "string") {
        toast.error(err.backendError);
      } else if (err?.errors && typeof err.errors === "object") {
        Object.entries(err.errors).forEach(([field, messages]) => {
          const msg = Array.isArray(messages) ? messages[0] : messages;
          toast.error(`${field}: ${msg}`);
        });
      } else {
        toast.error(err?.message || "Failed to update TDS settings.");
      }
      return false;
    } finally {
      setTdsLoading(false);
    }
  };

  // ================= ROUTING VIEWS =================

  const tabComponents = {
    EPF: epfLoading ? (
      <div className="text-center py-10">Loading...</div>
    ) : epfEditMode ? (
      <UpsertEPF epfData={epfData} onSuccess={fetchEPF} />
    ) : !epfRowExists ? (
      <UpsertEPF onSuccess={fetchEPF} />
    ) : epfEnabled ? (
      <EpfTab
        epfData={epfData}
        onDisable={handleDisableEpf}
        onEdit={() => setEpfEditMode(true)}
      />
    ) : (
      <EnableEPF onEnable={handleEnableEpf} />
    ),

    ESI: esiLoading ? (
      <div className="text-center py-10">Loading...</div>
    ) : !esiRowExists ? (
      <UpsertESI onSuccess={fetchESI} />
    ) : esiEnabled ? (
      <EsiTab
        esiData={esiData}
        onDisable={handleDisableEsi}
        onEdit={() => {}}
      />
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
        onEdit={() => setLwfEditMode(true)}
      />
    ),

    TDS:
      tdsLoading && !tdsData ? (
        <div className="text-center py-10">Loading...</div>
      ) : (
        <TdsTab
          tdsData={tdsData}
          onUpdate={handleUpdateTDS}
          loading={tdsLoading}
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
            className={`pb-2 ${activeTab === tab ? "border-b-2 border-black font-medium" : "text-gray-400"}`}
          >
            {tab}
          </button>
        ))}
      </div>
      {loading ? (
        <div className="py-10">Loading...</div>
      ) : (
        tabComponents[activeTab]
      )}
    </div>
  );
};

export default StatutoryComponents;
