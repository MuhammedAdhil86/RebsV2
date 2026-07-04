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
  // Added try/catch to all fetchers to prevent silent failures

  const fetchEPF = useCallback(async () => {
    setEpfLoading(true);
    try {
      const data = await payrollService.getEPF();
      setEpfData(data);
      setEpfEnabled(Boolean(data?.enabled));
      setEpfRowExists(Boolean(data?.row_exists));
      setEpfEditMode(false);
    } catch (error) {
      console.error("EPF Fetch Error:", error);
      toast.error("Failed to load EPF data.");
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
    } catch (error) {
      console.error("ESI Fetch Error:", error);
      toast.error("Failed to load ESI data.");
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
    } catch (error) {
      console.error("PT Fetch Error:", error);
      toast.error("Failed to load PT data.");
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
    } catch (error) {
      console.error("LWF Fetch Error:", error);
      toast.error("Failed to load LWF data.");
    } finally {
      setLwfLoading(false);
    }
  }, []);

  const fetchTDS = useCallback(async () => {
    setTdsLoading(true);
    try {
      const data = await payrollService.getTDS();
      setTdsData(data);
    } catch (error) {
      console.error("TDS Fetch Error:", error);
      toast.error("Failed to load TDS data.");
    } finally {
      setTdsLoading(false);
    }
  }, []);

  // ================= INITIAL LOAD =================

  useEffect(() => {
    let isMounted = true; // Cleanup flag for Strict Mode/Routing

    const fetchAll = async () => {
      setLoading(true);
      // Use allSettled so if one module (e.g., PT) fails, EPF and ESI still load perfectly
      await Promise.allSettled([fetchEPF(), fetchESI(), fetchPT(), fetchLWF()]);

      if (isMounted) {
        setLoading(false);
      }
    };

    fetchAll();

    return () => {
      isMounted = false;
    };
  }, [fetchEPF, fetchESI, fetchPT, fetchLWF, fetchTDS]);

  // ================= HANDLERS =================

  const handleEnableEpf = async () => {
    setEpfLoading(true);
    try {
      await payrollService.enableEPF();
      toast.success("EPF Enabled");
      await fetchEPF();
    } catch (error) {
      toast.error("Failed to enable EPF");
    } finally {
      setEpfLoading(false);
    }
  };

  const handleDisableEpf = async () => {
    setEpfLoading(true);
    try {
      await payrollService.disableEPF();
      toast.success("EPF Disabled");
      await fetchEPF();
    } catch (error) {
      toast.error("Failed to disable EPF");
    } finally {
      setEpfLoading(false);
    }
  };

  const handleEnableEsi = async () => {
    setEsiLoading(true);
    try {
      await payrollService.enableESI();
      toast.success("ESI Enabled");
      await fetchESI();
    } catch (error) {
      toast.error("Failed to enable ESI");
    } finally {
      setEsiLoading(false);
    }
  };

  const handleDisableEsi = async () => {
    setEsiLoading(true);
    try {
      await payrollService.disableESI();
      toast.success("ESI Disabled");
      await fetchESI();
    } catch (error) {
      toast.error("Failed to disable ESI");
    } finally {
      setEsiLoading(false);
    }
  };

  const handleEnableLWF = async ({ state, deduction_cycle }) => {
    setLwfLoading(true);
    try {
      await payrollService.enableLWF({ state, deduction_cycle });
      toast.success("LWF Enabled");
      await fetchLWF();
    } catch (error) {
      toast.error("Failed to enable LWF");
    } finally {
      setLwfLoading(false);
    }
  };

  const handleDisableLWF = async () => {
    setLwfLoading(true);
    try {
      await payrollService.disableLWF();
      toast.success("LWF Disabled");
      await fetchLWF();
    } catch (error) {
      toast.error("Failed to disable LWF");
    } finally {
      setLwfLoading(false);
    }
  };

  const handleUpdateTDS = async (payload) => {
    setTdsLoading(true);
    try {
      const response = await payrollService.upsertTDS(payload);
      toast.success(response?.message || "TDS Settings updated successfully!");
      await fetchTDS();
      return true;
    } catch (err) {
      console.error("UI Caught exception track:", err);

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
      <div className="text-center py-10">Loading EPF...</div>
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
      <div className="text-center py-10">Loading ESI...</div>
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
      <div className="text-center py-10">Loading PT...</div>
    ) : ptEditMode ? (
      <UpsertPT data={ptData} onSuccess={fetchPT} />
    ) : (
      <ProfessionalTaxTab data={ptData} onEdit={() => setPtEditMode(true)} />
    ),

    LWF: lwfLoading ? (
      <div className="text-center py-10">Loading LWF...</div>
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
        <div className="text-center py-10">Loading TDS...</div>
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
            className={`pb-2 transition-colors ${
              activeTab === tab
                ? "border-b-2 border-black font-medium text-black"
                : "text-gray-400 hover:text-gray-700"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
      {loading ? (
        <div className="py-10 text-center text-gray-500">
          Loading statutory components...
        </div>
      ) : (
        tabComponents[activeTab]
      )}
    </div>
  );
};

export default StatutoryComponents;
