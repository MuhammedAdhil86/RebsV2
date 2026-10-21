import React, { useMemo } from "react";
import { ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { Icon } from "@iconify/react";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const pad = (n) => String(n).padStart(2, "0");
// month is 0-based, returns "YYYY-MM-DD"
const toKey = (year, month, day) => `${year}-${pad(month + 1)}-${pad(day)}`;

const branchLabel = (names) =>
  names.length > 3 ? `${names.length} branches` : names.join(", ");

const HolidayCalendar = ({
  holidays,
  currentMonth,
  setCurrentMonth,
  getBranchName,
}) => {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const today = new Date();
  const todayKey = toKey(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  const isCurrentMonth =
    today.getFullYear() === year && today.getMonth() === month;

  const handleMonthChange = (offset) =>
    setCurrentMonth(new Date(year, month + offset, 1));

  const goToToday = () =>
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));

  // Group holidays by date. The same holiday saved for several branches
  // becomes ONE entry that lists its branches.
  const { byDate, monthList } = useMemo(() => {
    const monthPrefix = `${year}-${pad(month + 1)}`;
    const groups = new Map();

    (holidays || []).forEach((h) => {
      const date = String(h.date || "").slice(0, 10);
      if (!date.startsWith(monthPrefix)) return;

      const title = h.Reason || h.title || "Holiday";
      const key = `${date}|${title}`;
      const ids = Array.isArray(h.branch) ? h.branch : [h.branch];

      if (!groups.has(key)) {
        groups.set(key, {
          key,
          date,
          title,
          image: h.image || null,
          branches: new Set(),
        });
      }
      const group = groups.get(key);
      if (!group.image && h.image) group.image = h.image;
      ids.forEach((id) => group.branches.add(getBranchName(id)));
    });

    const list = [...groups.values()]
      .map((g) => ({ ...g, branches: [...g.branches] }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const map = {};
    list.forEach((g) => {
      if (!map[g.date]) map[g.date] = [];
      map[g.date].push(g);
    });

    return { byDate: map, monthList: list };
  }, [holidays, year, month, getBranchName]);

  // Build full weeks, with the neighbouring months' days shown muted
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;

  const cells = Array.from({ length: totalCells }, (_, i) => {
    const n = i - firstDay + 1;
    if (n < 1) return { day: daysInPrevMonth + n, inMonth: false };
    if (n > daysInMonth) return { day: n - daysInMonth, inMonth: false };
    return { day: n, inMonth: true, key: toKey(year, month, n) };
  });

  const monthName = currentMonth.toLocaleString("default", { month: "long" });

  return (
    <div className="animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="text-2xl font-semibold text-black tracking-tight">
            {monthName} <span className="text-black/30 font-light">{year}</span>
          </h2>
          <p className="text-xs text-black/40 mt-0.5">
            {monthList.length === 0
              ? "No holidays this month"
              : `${monthList.length} holiday${monthList.length > 1 ? "s" : ""} this month`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={goToToday}
            disabled={isCurrentMonth}
            className="px-3.5 py-2 text-xs font-medium text-black border border-black/10 rounded-lg hover:bg-black/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Today
          </button>
          <div className="flex items-center border border-black/10 rounded-lg overflow-hidden">
            <button
              aria-label="Previous month"
              onClick={() => handleMonthChange(-1)}
              className="p-2 text-black hover:bg-black/5 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="w-px h-5 bg-black/10" />
            <button
              aria-label="Next month"
              onClick={() => handleMonthChange(1)}
              className="p-2 text-black hover:bg-black/5 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6 items-start">
        {/* CALENDAR GRID */}
        <div className="border border-black/10 rounded-2xl overflow-hidden shadow-sm bg-white">
          <div className="grid grid-cols-7 bg-white border-b border-black/10">
            {WEEKDAYS.map((d) => (
              <div
                key={d}
                className="py-3 text-center text-[11px] font-semibold tracking-wider text-black/50 uppercase"
              >
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-px bg-black/10">
            {cells.map((cell, i) => {
              const items = cell.inMonth ? byDate[cell.key] || [] : [];
              const isToday = cell.inMonth && cell.key === todayKey;
              const isWeekend = i % 7 === 0 || i % 7 === 6;

              return (
                <div
                  key={i}
                  className={`min-h-[84px] sm:min-h-[120px] p-1.5 sm:p-2 flex flex-col ${
                    !cell.inMonth
                      ? "bg-zinc-50/70"
                      : isWeekend
                        ? "bg-zinc-50"
                        : "bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`inline-flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full text-xs sm:text-sm ${
                        isToday
                          ? "bg-black text-white font-semibold"
                          : !cell.inMonth
                            ? "text-black/25"
                            : items.length > 0
                              ? "text-black font-semibold"
                              : "text-black/70"
                      }`}
                    >
                      {cell.day}
                    </span>
                    {/* Small screens: just a dot, details are in the list below */}
                    {items.length > 0 && (
                      <span className="sm:hidden w-1.5 h-1.5 rounded-full bg-black" />
                    )}
                  </div>

                  <div className="hidden sm:flex flex-col gap-1 mt-1.5">
                    {items.slice(0, 2).map((g) => (
                      <div
                        key={g.key}
                        title={`${g.title} · ${branchLabel(g.branches)}`}
                        className="bg-black text-white rounded-md px-1.5 py-1 text-[10px] font-medium leading-tight"
                      >
                        <span className="block truncate">{g.title}</span>
                      </div>
                    ))}
                    {items.length > 2 && (
                      <span className="text-[10px] font-medium text-black/50 px-1">
                        +{items.length - 2} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* THIS MONTH LIST */}
        <aside className="border border-black/10 rounded-2xl bg-white shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-black/10">
            <div className="flex items-center gap-2">
              <Icon
                icon="solar:calendar-outline"
                className="w-4 h-4 text-black"
              />
              <h3 className="text-sm font-semibold text-black">This month</h3>
            </div>
            <span className="text-[11px] font-semibold text-white bg-black rounded-full px-2 py-0.5">
              {monthList.length}
            </span>
          </div>

          {monthList.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <div className="w-12 h-12 mx-auto rounded-full bg-black/[0.04] flex items-center justify-center mb-3">
                <Icon
                  icon="solar:calendar-outline"
                  className="w-5 h-5 text-black/40"
                />
              </div>
              <p className="text-sm font-medium text-black">No holidays</p>
              <p className="text-xs text-black/40 mt-1">
                Nothing scheduled for {monthName}.
              </p>
            </div>
          ) : (
            <ul className="max-h-[640px] overflow-y-auto divide-y divide-black/5">
              {monthList.map((g) => {
                const [y, m, d] = g.date.split("-").map(Number);
                const dateObj = new Date(y, m - 1, d);
                return (
                  <li
                    key={g.key}
                    className="flex items-center gap-3 px-5 py-3.5 hover:bg-black/[0.02] transition-colors"
                  >
                    <div className="flex flex-col items-center justify-center w-12 h-12 shrink-0 rounded-xl border border-black/10">
                      <span className="text-[9px] uppercase tracking-wider text-black/40 leading-none">
                        {dateObj.toLocaleDateString("en-US", {
                          weekday: "short",
                        })}
                      </span>
                      <span className="text-base font-bold text-black leading-none mt-1">
                        {d}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm font-medium text-black truncate"
                        title={g.title}
                      >
                        {g.title}
                      </p>
                      <div className="flex items-center gap-1 mt-1 text-black/50">
                        <MapPin size={12} className="text-black shrink-0" />
                        <span className="text-[11px] truncate">
                          {branchLabel(g.branches)}
                        </span>
                      </div>
                    </div>

                    {g.image && (
                      <img
                        src={g.image}
                        alt={g.title}
                        className="w-10 h-10 rounded-lg object-cover border border-black/10 shrink-0"
                      />
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </aside>
      </div>
    </div>
  );
};

export default HolidayCalendar;
