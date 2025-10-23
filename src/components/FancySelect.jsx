import { Fragment } from "react";
import { Listbox, Transition } from "@headlessui/react";
import { ChevronUpDownIcon, CheckIcon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import clsx from "clsx";

/**
 * props:
 * value        : القيمة المختارة
 * onChange     : (v)=>void
 * options      : [{value:'dark', label:'dark'}]
 * className    : إضافي للحاوية
 * width        : عرض القايمة (افتراضي w-40)
 * dir          : 'rtl' | 'ltr' (اختياري)
 */
export default function FancySelect({
  value,
  onChange,
  options,
  className = "",
  width = "w-40",
  dir = document?.documentElement?.getAttribute("dir") || "ltr",
}) {
  const isRTL = dir === "rtl";
  return (
    <div className={clsx("relative z-[60] isolate", className)} dir={dir}>
      <Listbox value={value} onChange={onChange}>
        <div className="relative">
          {/* Button */}
          <Listbox.Button
            className={clsx(
              "theme-select flex items-center justify-between gap-2",
              "min-h-[36px] px-3 py-2", width
            )}
          >
            <span className="truncate">{options.find(o=>o.value===value)?.label ?? value}</span>
            <ChevronUpDownIcon className="h-4 w-4 opacity-70" />
          </Listbox.Button>

          {/* Options */}
          <Transition
            as={Fragment}
            enter="transition ease-out duration-150"
            enterFrom="opacity-0 translate-y-1"
            enterTo="opacity-100 translate-y-0"
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 translate-y-1"
          >
            <Listbox.Options
            className={clsx(
            "absolute z-[70] mt-2 max-h-60 overflow-auto rounded-xl shadow-lg ring-1 ring-black/5",
                "bg-[var(--card-bg)] text-[var(--text)] border border-[var(--card-border)]",
                width,
                isRTL ? "right-0" : "left-0"
              )}
            >
              {options.map((opt, idx) => (
                <Listbox.Option
                  key={opt.value}
                  value={opt.value}
                  className={({ active }) =>
                    clsx(
                      "cursor-pointer select-none px-3 py-2 flex items-center gap-2",
                      active ? "bg-[var(--bg-to)]" : ""
                    )
                  }
                >
                  {({ selected }) => (
                    <motion.div
                      initial={{ opacity: 0, x: isRTL ? 6 : -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.15, delay: idx * 0.02 }}
                      className="flex w-full items-center justify-between"
                    >
                      <span className={clsx("truncate", selected ? "font-semibold" : "font-normal")}>
                        {opt.label}
                      </span>
                      {selected && <CheckIcon className="h-4 w-4 opacity-80" />}
                    </motion.div>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>
    </div>
  );
}
