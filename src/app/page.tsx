"use client";

import {
  ArrowRight,
  Trash2,
  PlusCircle,
  Menu,
  X,
  Copy,
  Check,
  Home,
  History,
  Heart,
  Info,
  Send,
  Upload,
  Download,
  Search,
  Sparkles,
  Instagram,
  Linkedin,
  Twitter,
  ExternalLink,
  Code2,
  Cpu,
  Globe,
} from "lucide-react";
import { useState, useEffect, useRef, useMemo } from "react";
import { useApiStore } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";
import JsonEditor from "@/components/JsonEditor";
import clsx from "clsx";
import axios from "axios";

export default function VeloxApiPage() {
  const store = useApiStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<"headers" | "body">("headers");
  const [activeResTab, setActiveResTab] = useState("Body");
  const [mounted, setMounted] = useState(false);
  const [currentView, setCurrentView] = useState<"home" | "about" | "donate">(
    "home",
  );
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [historySearch, setHistorySearch] = useState("");
  const [shouldBeautify, setShouldBeautify] = useState(true);

  const [jsonBody, setJsonBody] = useState(
    '{\n  "name": "Velox API",\n  "status": "ready"\n}',
  );
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const methods = ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD"];

  const socials = [
    {
      icon: <Twitter size={20} />,
      url: "https://x.com/baroi_ai",
      color: "hover:text-sky-400",
    },
    {
      icon: <Linkedin size={20} />,
      url: "https://www.linkedin.com/in/subhodeepbaroi/",
      color: "hover:text-blue-500",
    },
    {
      icon: <Instagram size={20} />,
      url: "https://www.instagram.com/baroi.ai/",
      color: "hover:text-pink-500",
    },
  ];

  useEffect(() => {
    setMounted(true);
  }, []);

  // --- MOBILE SWIPE LOGIC ---
  const touchStart = useRef(0);
  const touchEnd = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStart.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEnd.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStart.current || !touchEnd.current) return;
    const distance = touchStart.current - touchEnd.current;
    const isSwipeRight = distance < -70; // Swipe right to open
    const isSwipeLeft = distance > 70; // Swipe left to close

    if (isSwipeRight && !isMobileMenuOpen) setIsMobileMenuOpen(true);
    if (isSwipeLeft && isMobileMenuOpen) setIsMobileMenuOpen(false);

    touchStart.current = 0;
    touchEnd.current = 0;
  };

  // Improved Copy Function (Fix for mobile browsers)
  const handleCopy = async (text: string) => {
    if (!text) return;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for older mobile browsers or non-secure contexts
        const textArea = document.createElement("textarea");
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy!", err);
    }
  };

  const filteredHistory = useMemo(() => {
    return store.history.filter(
      (item) =>
        item.url.toLowerCase().includes(historySearch.toLowerCase()) ||
        item.method.toLowerCase().includes(historySearch.toLowerCase()),
    );
  }, [store.history, historySearch]);

  const handleExportHistory = () => {
    if (store.history.length === 0) return alert("History is empty!");
    const dataStr = JSON.stringify(store.history, null, 2);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute(
      "download",
      `velox-history-${new Date().toISOString().split("T")[0]}.json`,
    );
    linkElement.click();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = JSON.parse(event.target?.result as string);
        let importedCount = 0;
        if (content.openapi || content.swagger || content.paths) {
          const baseUrl = content.servers?.[0]?.url || "";
          Object.keys(content.paths).forEach((path) => {
            Object.keys(content.paths[path]).forEach((method) => {
              store.addToHistory({
                id: `swag-${Date.now()}-${Math.random()}`,
                method: method.toUpperCase(),
                url: baseUrl + path,
                headers: [],
                body: "",
                savedResponse: null,
                status: 0,
                time: 0,
                timestamp: Date.now(),
              });
              importedCount++;
            });
          });
        } else if (Array.isArray(content) || content.item) {
          const items = Array.isArray(content) ? content : content.item;
          items.forEach((entry: any) => {
            store.addToHistory({
              id: `imp-${Date.now()}-${Math.random()}`,
              method: entry.method || entry.request?.method || "GET",
              url:
                entry.url ||
                (typeof entry.request?.url === "string"
                  ? entry.request.url
                  : entry.request?.url?.raw) ||
                "",
              headers: entry.headers || [],
              body: entry.body || "",
              savedResponse: entry.savedResponse || null,
              status: entry.status || 0,
              time: entry.time || 0,
              timestamp: Date.now(),
            });
            importedCount++;
          });
        }
        alert(`Imported ${importedCount} items!`);
      } catch (err) {
        alert("Invalid file.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleSendRequest = async () => {
    if (!store.url) return;
    setLoading(true);
    setResponse(null);
    const currentHeaders = [...store.headers];
    const reqHeaders = currentHeaders
      .filter((h) => h.check && h.key)
      .reduce((acc, h) => ({ ...acc, [h.key]: h.value }), {});
    let data = null;
    if (store.method !== "GET") {
      try {
        data = JSON.parse(jsonBody);
      } catch (e) {
        setResponse({
          status: "Error",
          statusText: "Invalid JSON",
          data: "Format JSON.",
          headers: {},
          time: 0,
        });
        setLoading(false);
        return;
      }
    }
    const startTime = Date.now();
    try {
      const res = await axios({
        method: store.method,
        url: store.url,
        headers: reqHeaders,
        data,
        validateStatus: () => true,
      });
      const duration = Date.now() - startTime;
      const responseData = {
        status: res.status,
        statusText: res.statusText || "OK",
        data: res.data,
        headers: res.headers,
        time: duration,
      };
      setResponse(responseData);
      store.addToHistory({
        id: Date.now().toString(),
        method: store.method,
        url: store.url,
        headers: currentHeaders,
        body: jsonBody,
        savedResponse: responseData,
        status: res.status,
        time: duration,
        timestamp: Date.now(),
      });
    } catch (error: any) {
      setResponse({
        status: error.response?.status || "Error",
        statusText: error.response?.statusText || error.message,
        data: error.response?.data || error.message,
        headers: error.response?.headers || {},
        time: Date.now() - startTime,
      });
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return <div className="min-h-screen bg-[#0f172a]" />;

  return (
    <div
      className="flex flex-col h-screen w-screen bg-[#0f172a] text-slate-100 overflow-hidden font-sans"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".json"
        className="hidden"
      />

      {/* TOP NAVBAR */}
      <nav className="h-[64px] border-b border-slate-700/50 flex items-center justify-between px-4 lg:px-6 bg-velox-dark-panel z-[120] shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 hover:bg-slate-800 rounded-full text-slate-300 transition-colors"
          >
            <Menu size={22} />
          </button>
          <div
            className="flex items-center gap-2.5 cursor-pointer"
            onClick={() => setCurrentView("home")}
          >
            <img
              src="/velox-api/logo.png"
              alt="Logo"
              className="h-7 w-7 object-contain"
            />
            <h1 className="text-lg font-black tracking-tighter uppercase italic leading-none hidden sm:block">
              Velox API
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 text-[10px] font-bold text-slate-400 hover:text-velox-teal transition-all border border-slate-700 rounded-lg px-3 py-1.5 bg-slate-800/50 mr-2"
          >
            <Upload size={14} /> IMPORT
          </button>
          <div className="hidden lg:flex items-center gap-1 border-l border-slate-700/50 pl-3">
            <DesktopNavLink
              label="Home"
              active={currentView === "home"}
              onClick={() => setCurrentView("home")}
            />
            <DesktopNavLink
              label="Donate"
              active={currentView === "donate"}
              onClick={() => {
                window.open("https://ko-fi.com/baroi", "_blank");
                setCurrentView("home");
              }}
            />
            <DesktopNavLink
              label="About"
              active={currentView === "about"}
              onClick={() => setCurrentView("about")}
            />
          </div>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden relative">
        {/* SIDEBAR */}
        <AnimatePresence mode="wait">
          {(isMobileMenuOpen || window.innerWidth > 1024) && (
            <>
              <motion.aside
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className={clsx(
                  "bg-velox-dark-panel border-r border-slate-700/50 flex flex-col shrink-0 z-[110] shadow-2xl",
                  "fixed inset-y-0 left-0 pt-[64px] w-80 lg:relative lg:pt-0 lg:shadow-none",
                )}
              >
                <div className="p-4 space-y-4 shrink-0">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
                    <input
                      type="text"
                      placeholder="Search history..."
                      value={historySearch}
                      onChange={(e) => setHistorySearch(e.target.value)}
                      className="w-full bg-slate-800/50 border border-slate-700 rounded-lg py-2 pl-9 pr-3 text-xs focus:outline-none focus:border-velox-teal/40 transition-all placeholder:text-slate-600"
                    />
                  </div>
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      History
                    </span>
                    <div className="flex items-center gap-3">
                      {store.history.length > 0 && (
                        <>
                          <button
                            onClick={handleExportHistory}
                            title="Export All"
                            className="text-slate-500 hover:text-velox-teal transition-colors"
                          >
                            <Download size={15} />
                          </button>
                          <button
                            onClick={store.clearHistory}
                            className="text-[10px] font-bold text-slate-500 hover:text-red-400 uppercase"
                          >
                            Clear
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-20 space-y-1.5">
                  {filteredHistory.length === 0 ? (
                    <div className="text-center py-20 text-slate-700 text-[10px] font-bold uppercase tracking-widest opacity-40">
                      Empty
                    </div>
                  ) : (
                    filteredHistory.map((item) => (
                      <div
                        key={item.id}
                        className="relative group p-2.5 bg-slate-800/20 border border-transparent hover:border-velox-teal/30 hover:bg-slate-800/40 rounded-lg cursor-pointer transition-all active:scale-[0.98]"
                      >
                        <div
                          onClick={() => {
                            store.setFullState(item);
                            if (item.body) setJsonBody(item.body);
                            if (item.savedResponse)
                              setResponse(item.savedResponse);
                            else setResponse(null);
                            setCurrentView("home");
                            if (window.innerWidth < 1024)
                              setIsMobileMenuOpen(false);
                          }}
                          className="pr-6"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={clsx(
                                "text-[8px] font-black px-1.5 py-0.5 rounded border leading-none",
                                item.status === 0
                                  ? "text-velox-teal border-velox-teal/20"
                                  : item.status < 400
                                    ? "text-green-400 border-green-500/20"
                                    : "text-red-400 border-red-500/20",
                              )}
                            >
                              {item.method}
                            </span>
                            <span className="text-[9px] text-slate-400 truncate font-mono opacity-80">
                              {item.url}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            store.removeHistoryItem(item.id);
                          }}
                          className="absolute top-1/2 -translate-y-1/2 right-2 p-1.5 text-slate-700 hover:text-red-500 lg:opacity-0 lg:group-hover:opacity-100 transition-all"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </motion.aside>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileMenuOpen(false)}
                className="fixed inset-0 bg-black/60 z-[105] lg:hidden"
              />
            </>
          )}
        </AnimatePresence>

        {/* CONTENT AREA */}
        <section className="flex-1 overflow-y-auto no-scrollbar p-4 md:p-6 space-y-6 w-full max-w-6xl mx-auto pb-40">
          {currentView === "home" ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div className="bg-velox-dark-panel p-4 rounded-xl border border-slate-700/30 shadow-xl">
                <div className="flex flex-col sm:flex-row gap-3">
                  <select
                    value={store.method}
                    onChange={(e) => store.setMethod(e.target.value)}
                    className="w-full sm:w-32 bg-slate-700 border border-slate-600/50 rounded-lg px-3 py-2.5 font-mono text-sm outline-none focus:ring-1 focus:ring-velox-teal"
                  >
                    {methods.map((m) => (
                      <option key={m}>{m}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="https://api.example.com"
                    value={store.url}
                    onChange={(e) => store.setUrl(e.target.value)}
                    className="flex-1 bg-slate-700 border border-slate-600/50 rounded-lg px-4 py-2.5 focus:ring-1 focus:ring-velox-teal outline-none font-mono text-sm"
                  />
                  <button
                    onClick={handleSendRequest}
                    disabled={loading}
                    className="bg-velox-teal hover:bg-velox-teal-hover font-bold rounded-lg px-6 py-2.5 flex items-center justify-center gap-2 transition-all disabled:opacity-50 active:scale-95 shadow-md"
                  >
                    {loading ? "..." : "SEND"} <Send size={16} />
                  </button>
                </div>
              </div>

              <div className="bg-velox-dark-panel p-4 rounded-xl border border-slate-700/30">
                <div className="flex gap-1 border-b border-slate-700/50 mb-4 shrink-0">
                  {(["headers", "body"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={clsx(
                        "px-5 py-2.5 capitalize text-sm relative transition-colors font-medium",
                        activeTab === tab
                          ? "text-velox-teal"
                          : "text-slate-400",
                      )}
                    >
                      {tab}{" "}
                      {activeTab === tab && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-velox-teal" />
                      )}
                    </button>
                  ))}
                </div>
                {activeTab === "headers" && (
                  <div className="space-y-3">
                    <div className="max-h-[200px] overflow-y-auto custom-scrollbar space-y-2 pr-1">
                      {store.headers.map((header) => (
                        <div
                          key={header.id}
                          className="flex items-center gap-2 p-2 bg-slate-900/40 border border-slate-700/50 rounded-lg group"
                        >
                          <input
                            type="checkbox"
                            checked={header.check}
                            onChange={(e) =>
                              store.updateHeader(
                                header.id,
                                "check",
                                e.target.checked,
                              )
                            }
                            className="h-4 w-4 accent-velox-teal"
                          />
                          <input
                            type="text"
                            placeholder="Key"
                            value={header.key}
                            onChange={(e) =>
                              store.updateHeader(
                                header.id,
                                "key",
                                e.target.value,
                              )
                            }
                            className="w-1/2 bg-slate-800/50 border border-slate-700/50 rounded px-3 py-1.5 text-xs font-mono outline-none focus:border-velox-teal"
                          />
                          <input
                            type="text"
                            placeholder="Value"
                            value={header.value}
                            onChange={(e) =>
                              store.updateHeader(
                                header.id,
                                "value",
                                e.target.value,
                              )
                            }
                            className="w-1/2 bg-slate-800/50 border border-slate-700/50 rounded px-3 py-1.5 text-xs font-mono outline-none focus:border-velox-teal"
                          />
                          <button
                            onClick={() => store.deleteHeader(header.id)}
                            className="text-slate-500 hover:text-red-400 px-1"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={store.addHeader}
                      className="text-[10px] text-velox-teal font-bold uppercase hover:text-white"
                    >
                      <PlusCircle size={14} className="inline mr-1" /> Add
                      Header
                    </button>
                  </div>
                )}
                {activeTab === "body" && (
                  <div className="h-[250px] overflow-hidden rounded-lg border border-slate-700/50">
                    <JsonEditor value={jsonBody} onChange={setJsonBody} />
                  </div>
                )}
              </div>

              <div className="bg-velox-dark-panel p-4 rounded-xl border border-slate-700/30 h-[450px] flex flex-col shadow-2xl">
                <div className="flex items-center justify-between mb-4 border-b border-slate-700/50 pb-3 shrink-0">
                  <div className="flex items-center gap-3">
                    <h2 className="text-sm font-semibold opacity-70 uppercase tracking-widest">
                      Response
                    </h2>
                    {response && (
                      <span
                        className={clsx(
                          "px-2 py-0.5 rounded text-[10px] font-bold border",
                          response.status < 400
                            ? "bg-green-500/10 text-green-400 border-green-500/20"
                            : "bg-red-500/10 text-red-400 border-red-500/20",
                        )}
                      >
                        {response.status} {response.statusText}
                      </span>
                    )}
                  </div>
                  {response && (
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-mono text-slate-500 hidden sm:inline">
                        {response.time}ms
                      </span>
                      <button
                        onClick={() => setShouldBeautify(!shouldBeautify)}
                        className={clsx(
                          "flex items-center gap-1.5 text-[10px] font-bold uppercase px-2 py-1 rounded border transition-all",
                          shouldBeautify
                            ? "text-velox-teal border-velox-teal/20 bg-velox-teal/5"
                            : "text-slate-500 border-slate-700",
                        )}
                      >
                        <Sparkles size={12} />{" "}
                        {shouldBeautify ? "Formatted" : "Raw"}
                      </button>
                      <button
                        onClick={() =>
                          handleCopy(
                            JSON.stringify(
                              activeResTab === "Body"
                                ? response.data
                                : response.headers,
                              null,
                              shouldBeautify ? 2 : 0,
                            ),
                          )
                        }
                        className="flex items-center gap-1.5 text-[10px] text-slate-400 hover:text-velox-teal transition-colors font-bold uppercase px-2 py-1 active:bg-velox-teal/10 rounded"
                      >
                        {copied ? (
                          <Check size={12} className="text-green-400" />
                        ) : (
                          <Copy size={12} />
                        )}{" "}
                        {copied ? "Copied" : "Copy"}
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex gap-1 border-b border-slate-700/50 mb-4 shrink-0">
                  {["Body", "Headers"].map((resTab) => (
                    <button
                      key={resTab}
                      onClick={() => setActiveResTab(resTab)}
                      className={clsx(
                        "px-5 py-2.5 text-sm relative transition-colors font-medium",
                        activeResTab === resTab
                          ? "text-velox-teal"
                          : "text-slate-400",
                      )}
                    >
                      {resTab}
                    </button>
                  ))}
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-2 bg-slate-900/20 rounded-lg">
                  {!response && !loading ? (
                    <div className="h-full flex flex-col items-center justify-center opacity-10 font-black text-2xl uppercase tracking-tighter italic">
                      Velox API
                    </div>
                  ) : loading ? (
                    <div className="h-full flex items-center justify-center animate-pulse text-velox-teal font-mono text-xs tracking-widest uppercase">
                      Fetching...
                    </div>
                  ) : (
                    <pre
                      className={clsx(
                        "text-xs p-2 font-mono whitespace-pre-wrap break-all",
                        response.status < 400
                          ? "text-green-300"
                          : "text-red-300",
                      )}
                    >
                      {JSON.stringify(
                        activeResTab === "Body"
                          ? response.data
                          : response.headers,
                        null,
                        shouldBeautify ? 2 : 0,
                      )}
                    </pre>
                  )}
                </div>
              </div>
            </motion.div>
          ) : currentView === "about" ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-4xl mx-auto py-4 space-y-8"
            >
              {/* Hero Section */}
              <div className="text-center space-y-4">
                <div className="inline-flex p-3 rounded-2xl bg-velox-teal/10 border border-velox-teal/20 text-velox-teal mb-2">
                  <Sparkles size={32} />
                </div>
                <h1 className="text-4xl font-black tracking-tight italic uppercase">
                  About Velox API
                </h1>
                <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                  A fast, lightweight, and localized API testing suite designed
                  for developers who value performance and simplicity.
                </p>
              </div>

              {/* Feature Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-6 rounded-2xl bg-slate-800/30 border border-slate-700/50 space-y-3">
                  <div className="text-velox-teal">
                    <Cpu size={24} />
                  </div>
                  <h3 className="font-bold text-white">Native Performance</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    Built with Next.js and optimized for zero-lag interactions
                    even with large JSON payloads.
                  </p>
                </div>
                <div className="p-6 rounded-2xl bg-slate-800/30 border border-slate-700/50 space-y-3">
                  <div className="text-pink-500">
                    <Globe size={24} />
                  </div>
                  <h3 className="font-bold text-white">Offline First</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    Your data stays in your browser. All history and collections
                    are stored locally via indexed storage.
                  </p>
                </div>
                <div className="p-6 rounded-2xl bg-slate-800/30 border border-slate-700/50 space-y-3">
                  <div className="text-blue-400">
                    <Code2 size={24} />
                  </div>
                  <h3 className="font-bold text-white">Smart Import</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    Seamlessly transition from other tools by importing Swagger,
                    OpenAPI, or Postman collections.
                  </p>
                </div>
              </div>

              {/* Developer Section */}
              <div className="bg-velox-dark-panel p-8 rounded-3xl border border-slate-700/50 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:rotate-12 transition-transform">
                  <img src="/logo.png" className="w-40 h-40" alt="" />
                </div>
                <div className="relative z-10 space-y-6">
                  <h2 className="text-2xl font-black uppercase italic">
                    Meet the Creator
                  </h2>
                  <p className="text-slate-300 max-w-xl leading-relaxed">
                    Velox API was created by{" "}
                    <span className="text-velox-teal font-bold">
                      Subhodeep Baroi
                    </span>
                    . The goal was to build a tool that removes the clutter of
                    modern API clients while retaining the power of professional
                    testing suites.
                  </p>
                  <div className="flex items-center gap-4">
                    {socials.map((s, idx) => (
                      <a
                        key={idx}
                        href={s.url}
                        target="_blank"
                        className={clsx(
                          "p-3 bg-slate-800 rounded-xl transition-all hover:-translate-y-1",
                          s.color,
                        )}
                      >
                        {s.icon}
                      </a>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer text */}
              <p className="text-center text-slate-600 text-[10px] font-bold uppercase tracking-[0.2em]">
                Velox API v1.0.0 &copy; 2026 Crafted with Passion
              </p>
            </motion.div>
          ) : (
            <div className="max-w-2xl mx-auto py-10">
              {/* This section is handled by the nav link redirect logic above */}
              Redirecting to Ko-fi...
            </div>
          )}
        </section>

        {/* MOBILE BOTTOM NAVBAR */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-velox-dark-panel/95 backdrop-blur-xl border-t border-slate-700/50 flex justify-around items-center py-4 z-[100] shadow-[0_-5px_15px_rgba(0,0,0,0.5)]">
          <MobileNavItem
            icon={<Home size={22} />}
            label="Home"
            active={currentView === "home"}
            onClick={() => setCurrentView("home")}
          />
          <MobileNavItem
            icon={<History size={22} />}
            label="History"
            onClick={() => setIsMobileMenuOpen(true)}
          />
          <MobileNavItem
            icon={<Heart size={22} />}
            label="Donate"
            active={currentView === "donate"}
            onClick={() => {
              window.open("https://ko-fi.com/baroi", "_blank");
            }}
          />
          <MobileNavItem
            icon={<Info size={22} />}
            label="About"
            active={currentView === "about"}
            onClick={() => setCurrentView("about")}
          />
        </nav>
      </div>
    </div>
  );
}

function DesktopNavLink({ label, active, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "px-4 py-2 rounded-lg text-sm transition-all font-medium",
        active
          ? "bg-velox-teal/10 text-velox-teal border border-velox-teal/20"
          : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/50",
      )}
    >
      {label}
    </button>
  );
}

function MobileNavItem({ icon, label, active, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1 active:scale-90 transition-transform outline-none px-2"
    >
      <div className={active ? "text-velox-teal" : "text-slate-500"}>
        {icon}
      </div>
      <span
        className={clsx(
          "text-[10px] uppercase font-black tracking-tighter leading-none",
          active ? "text-velox-teal" : "text-slate-600",
        )}
      >
        {label}
      </span>
    </button>
  );
}
