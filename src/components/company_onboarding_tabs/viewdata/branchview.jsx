import React, { useEffect, useState } from "react";
import UniversalTable from "../../../ui/universal_table";
import { getBranchData } from "../../../service/companyService";
import MapModal from "../../../utils/mapmodel";

/* ---------- REVERSE GEO LOCATION ---------- */
const getPlaceName = async (latitude, longitude) => {
  if (!latitude || !longitude) return "-";
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=en`,
      { headers: { "User-Agent": "BranchViewApp" } },
    );
    const data = await response.json();
    return data.display_name || "-";
  } catch (error) {
    console.error("Error fetching location:", error);
    return "-";
  }
};

const BranchView = () => {
  const [branchData, setBranchData] = useState([]);
  const [loading, setLoading] = useState(false);

  const [locations, setLocations] = useState({});
  const [revealed, setRevealed] = useState({});
  const [loadingLocations, setLoadingLocations] = useState({});
  const [mapModal, setMapModal] = useState(null);

  /* ---------- FETCH BRANCH DATA ---------- */
  useEffect(() => {
    const fetchBranches = async () => {
      setLoading(true);
      try {
        const data = await getBranchData();
        setBranchData(data || []);
      } catch (error) {
        console.error("Error fetching branch data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBranches();
  }, []);

  /* ---------- LOCATION HANDLERS ---------- */
  const handleSeeLocation = async (branchId, latitude, longitude) => {
    if (!locations[branchId]) {
      setLoadingLocations((p) => ({ ...p, [branchId]: true }));
      const place = await getPlaceName(latitude, longitude);
      setLocations((p) => ({ ...p, [branchId]: place }));
      setLoadingLocations((p) => ({ ...p, [branchId]: false }));
    }
    setRevealed((p) => ({ ...p, [branchId]: true }));
  };

  const handleViewMap = (latitude, longitude, name) => {
    setMapModal({
      latitude,
      longitude,
      branchName: name,
    });
  };

  /* ---------- TABLE DATA ---------- */
  const tableData = branchData.map((branch) => ({
    ...branch,
    locationData: {
      latitude: branch.latitude,
      longitude: branch.longitude,
      revealed: revealed[branch.id],
      loading: loadingLocations[branch.id],
      text: locations[branch.id],
      id: branch.id,
      name: branch.name,
    },
  }));

  /* ---------- TABLE COLUMNS ---------- */
  const columns = [
    {
      key: "name",
      label: "Branch Name",
      render: (value) => (
        <div title={value}>
          {value.length > 19 ? value.slice(0, 19) + "..." : value}
        </div>
      ),
    },
    {
      key: "locationData",
      label: "Location",
      render: (val) => {
        if (!val.latitude || !val.longitude) return "-";

        if (val.revealed) {
          if (val.loading)
            return (
              <span className="text-gray-400 animate-pulse">Loading...</span>
            );

          return (
            <div className="flex flex-col">
              <div className="overflow-hidden max-w-[200px]">
                <div className="whitespace-nowrap hover:animate-marquee">
                  {val.text || "-"}
                </div>
              </div>

              <button
                className="text-blue-600 underline mt-1"
                onClick={() =>
                  handleViewMap(val.latitude, val.longitude, val.name)
                }
              >
                View Map
              </button>
            </div>
          );
        }

        return (
          <button
            className="text-blue-600 underline"
            onClick={() =>
              handleSeeLocation(val.id, val.latitude, val.longitude)
            }
          >
            See Location
          </button>
        );
      },
    },
    {
      key: "code",
      label: "Branch Code",
    },
    {
      key: "address",
      label: "Address",
      render: (value) => (
        <div className="relative group max-w-[150px]">
          <span>{value.length > 10 ? value.slice(0, 10) + "..." : value}</span>
          {value.length > 10 && (
            <div
              className="absolute left-0 bottom-full mb-1 hidden group-hover:block 
                            bg-gray-700 text-white text-xs px-2 py-1 rounded shadow-lg 
                            max-w-xs break-words z-10"
            >
              {value}
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="min-h-screen bg-[#f9fafb] p-6 mt-5">
        <h2 className="text-lg font-medium text-gray-800 mb-4">Branches</h2>

        {loading ? (
          <div className="text-gray-500 text-center py-10">Loading...</div>
        ) : (
          <UniversalTable columns={columns} data={tableData} rowsPerPage={6} />
        )}
      </div>

      {/* ---------- MAP MODAL ---------- */}
      {mapModal && (
        <MapModal
          latitude={mapModal.latitude}
          longitude={mapModal.longitude}
          employeeName={mapModal.branchName}
          onClose={() => setMapModal(null)}
        />
      )}

      {/* ---------- MARQUEE STYLE ---------- */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-100%); }
        }
        .hover\\:animate-marquee:hover {
          animation: marquee 5s linear infinite;
        }
      `}</style>
    </>
  );
};

export default BranchView;
