"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { demoGardens, GardenAssessment, getMainReasons, getPriority } from "@/lib/data";
import { supabase } from "@/lib/supabase";

const icons = { trees: "🌳", alert: "⚠️", trend: "📈", chart: "📊", gauge: "🎯", wrench: "🛠️" };

function StatCard({ title, value, subtitle, icon, active, onClick }: any) {
  return (
    <button className={`stat ${active ? "active" : ""}`} onClick={onClick}>
      <div className="stat-top"><span className="stat-icon">{icon}</span><small>عرض المؤشر</small></div>
      <div className="stat-title">{title}</div><div className="stat-value">{value}</div><div className="stat-sub">{subtitle}</div>
    </button>
  );
}

function mapRowsToGardens(rows: any[]): GardenAssessment[] {
  return rows.map((row) => ({
    id: row.id,
    name: row.garden_name,
    project: row.project,
    district: row.district || "غير محدد",
    score: row.score,
    lastEvaluation: new Date(row.evaluated_at || row.created_at).toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" }),
    criteria: (row.assessment_criteria || []).map((criterion: any) => ({
      name: criterion.criterion_name,
      weight: criterion.weight,
      selected: criterion.selected_label,
      value: criterion.value,
      photos: (criterion.criterion_photos || []).map((p: any) => p.photo_url),
    })),
  }));
}

function IndicatorPanel({ activeMetric, gardens, stats, mode, onDelete }: any) {
  const metricData: any = {
    total: { title: "إجمالي الحدائق المقيمة", description: "كل الحدائق التي تم تقييمها داخل النطاق المختار.", list: gardens },
    critical: { title: "حدائق ذات أولوية قصوى", description: "الحدائق التي حصلت على نتيجة بين 90 و 100 وتحتاج تدخل عاجل.", list: gardens.filter((g: GardenAssessment) => getPriority(g.score).label === "قصوى") },
    high: { title: "حدائق ذات أولوية عالية", description: "الحدائق التي حصلت على نتيجة بين 75 و 89 وتحتاج صيانة قريبة.", list: gardens.filter((g: GardenAssessment) => getPriority(g.score).label === "عالية") },
    medium: { title: "حدائق ذات أولوية متوسطة", description: "الحدائق التي حصلت على نتيجة بين 65 و 74 وتدخل ضمن الخطة.", list: gardens.filter((g: GardenAssessment) => getPriority(g.score).label === "متوسطة") },
    low: { title: "حدائق ذات أولوية منخفضة", description: "الحدائق التي حصلت على نتيجة بين 50 و 64 وتحتاج متابعة دورية.", list: gardens.filter((g: GardenAssessment) => getPriority(g.score).label === "منخفضة") },
    average: { title: "متوسط مؤشر الأولوية", description: `متوسط نتائج الحدائق في النطاق المختار هو ${stats.average}%.`, list: gardens },
  };
  const data = metricData[activeMetric];
  if (!activeMetric || !data) return <section className="panel empty"><div className="panel-kicker">اختر مؤشرًا</div><h2>اضغط على أحد المؤشرات لعرض بياناته</h2><p>بيانات الحدائق لا تظهر إلا بعد اختيار المؤشر.</p></section>;

  return (
    <section className="panel">
      <div className="panel-head"><div><div className="panel-kicker">بيانات المؤشر المحدد</div><h2>{data.title}</h2><p className="panel-desc">{data.description}</p></div><div className="count-box"><small>العدد</small><b>{data.list.length}</b></div></div>
      <div className="grid">
        {data.list.map((garden: GardenAssessment) => {
          const priority = getPriority(garden.score);
          return (
            <details key={garden.id} className="garden-card">
              <summary>
                <div className="card-top"><span className={`badge ${priority.tone}`}>أولوية {priority.label}</span><div className="score"><b>{garden.score}%</b><small>{priority.text}</small></div></div>
                <h3>{garden.name}</h3><div className="meta">{garden.project} · {garden.district}</div>
                <div className="bar"><div className={priority.tone} style={{ width: `${garden.score}%` }} /></div>
                <div className="open-card">اضغط لعرض أسباب هذه الحديقة</div>
                {mode === "real" && <button className="delete-btn" onClick={(event) => { event.preventDefault(); event.stopPropagation(); onDelete(garden.id); }}>حذف التقييم</button>}
              </summary>
              <div className="reasons">
                <b>أبرز الأسباب</b>
                {getMainReasons(garden).map((reason) => <div className="reason-row" key={reason.name}><span>{reason.name}</span><b>{reason.value}/{reason.weight}</b></div>)}
                <details className="criteria-box">
                  <summary className="details-btn">تفاصيل المعايير</summary>
                  {garden.criteria.map((item) => {
                    const percentage = Math.min((item.value / item.weight) * 100, 100);
                    return (
                      <div className="criterion" key={item.name}>
                        <div className="criterion-title"><span>{item.name}</span><span>{item.value}/{item.weight}</span></div><p>{item.selected}</p>
                        {item.photos && item.photos.length > 0 && <details><summary className="open-card">عرض الصور ({item.photos.length})</summary><div className="photo-grid">{item.photos.map((photo, idx) => <div className="photo" key={idx}><img src={photo} alt={`إثبات ${idx + 1}`} /><span>إثبات حالة المعيار #{idx + 1}</span></div>)}</div></details>}
                        <div className="bar"><div className="emerald" style={{ width: `${percentage}%` }} /></div>
                      </div>
                    );
                  })}
                </details>
              </div>
            </details>
          );
        })}
      </div>
    </section>
  );
}

export default function DashboardPage() {
  const [gardens, setGardens] = useState<GardenAssessment[]>([]);
  const [activeMetric, setActiveMetric] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [mode, setMode] = useState<"real" | "demo">("real");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function loadRealData() {
    setMode("real"); setLoading(true); setActiveMetric(null); setSelectedProject(null); setMessage("");
    const { data, error } = await supabase.from("garden_assessments").select("*, assessment_criteria(*, criterion_photos(*))").or("is_demo.is.null,is_demo.eq.false").order("created_at", { ascending: false });
    if (error) { setMessage("تعذر تحميل البيانات الحقيقية من Supabase."); setGardens([]); } else setGardens(mapRowsToGardens(data || []));
    setLoading(false);
  }
  function showDemoData() { setMode("demo"); setActiveMetric(null); setSelectedProject(null); setMessage("أنت الآن تستعرض بيانات تجريبية من داخل الواجهة فقط."); setGardens(demoGardens); setLoading(false); }
  async function deleteAssessment(id: string) {
    if (mode !== "real") return setMessage("الحذف متاح للبيانات الحقيقية فقط.");
    if (!confirm("هل تريد حذف هذا التقييم نهائيًا؟")) return;
    setMessage("جاري حذف التقييم..."); setLoading(true);
    const { error, count } = await supabase.from("garden_assessments").delete({ count: "exact" }).eq("id", id);
    if (error) { setLoading(false); return setMessage(`تعذر حذف التقييم: ${error.message}`); }
    if (!count) { setLoading(false); return setMessage("لم يتم حذف أي سجل. تأكد من صلاحيات الحذف."); }
    setGardens((current) => current.filter((garden) => garden.id !== id)); setLoading(false); setMessage("تم حذف التقييم بنجاح.");
  }
  function exportCsv() {
    const rows = visibleGardens.map((garden) => ({ "اسم الحديقة": garden.name, "المشروع": garden.project, "الحي": garden.district, "الدرجة": garden.score, "الأولوية": getPriority(garden.score).label, "آخر تقييم": garden.lastEvaluation, "أبرز الأسباب": getMainReasons(garden).map((r) => `${r.name} ${r.value}/${r.weight}`).join(" | ") }));
    const header = Object.keys(rows[0] || { "اسم الحديقة": "", "المشروع": "", "الحي": "", "الدرجة": "", "الأولوية": "", "آخر تقييم": "", "أبرز الأسباب": "" });
    const csv = [header.join(","), ...rows.map((row: any) => header.map((key) => `"${String(row[key] ?? "").replaceAll('"', '""')}"`).join(","))].join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" }); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = `garden-priority-${selectedProject || "all"}-${mode}.csv`; link.click(); URL.revokeObjectURL(url);
  }
  useEffect(() => { loadRealData(); }, []);
  const orderedGardens = useMemo(() => [...gardens].sort((a,b)=>b.score-a.score), [gardens]);
  const projects = useMemo(() => Array.from(new Set(gardens.map((garden)=>garden.project))).sort(), [gardens]);
  const visibleGardens = useMemo(() => (!selectedProject || selectedProject === "all") ? orderedGardens : orderedGardens.filter((garden)=>garden.project === selectedProject), [orderedGardens, selectedProject]);
  const stats = useMemo(() => {
    const average = visibleGardens.length ? Math.round(visibleGardens.reduce((sum,g)=>sum+g.score,0)/visibleGardens.length) : 0;
    return { total: visibleGardens.length, critical: visibleGardens.filter((g)=>getPriority(g.score).label==="قصوى").length, high: visibleGardens.filter((g)=>getPriority(g.score).label==="عالية").length, medium: visibleGardens.filter((g)=>getPriority(g.score).label==="متوسطة").length, low: visibleGardens.filter((g)=>getPriority(g.score).label==="منخفضة").length, average };
  }, [visibleGardens]);
  const toggle = (key:string) => setActiveMetric(activeMetric === key ? null : key);
  const selectProject = (project:string) => { setSelectedProject(project); setActiveMetric(null); };
  const activeProjectTitle = selectedProject === "all" ? "كافة المشاريع" : selectedProject;

  return (
    <main className="page"><section className="container">
      <header className="header"><div><div className="pill">🌳 مركز القرار التشغيلي لصيانة الحدائق</div><h1>مؤشر أولوية صيانة الحدائق</h1><p>واجهة نتائج تبدأ ببوابات المشاريع. اختر كافة المشاريع أو مشروعًا محددًا لعرض مؤشراته، ثم اضغط على أي مؤشر لعرض حدائقه وتفاصيله.</p><div className="nav-actions"><Link className="action" href="/assessment">+ تقييم حديقة جديدة</Link><button className={`action ${mode === "real" ? "" : "secondary"}`} onClick={loadRealData}>عرض البيانات الحقيقية</button><button className={`action ${mode === "demo" ? "" : "secondary"}`} onClick={showDemoData}>عرض البيانات التجريبية</button></div>{message && <p>{message}</p>}</div><div className="legend"><p className="legend-title">تصنيف الأولوية المعتمد</p>{[["أولوية قصوى","90 - 100"],["أولوية عالية","75 - 89"],["أولوية متوسطة","65 - 74"],["أولوية منخفضة","50 - 64"]].map(([label,range])=><div key={label} className="legend-row"><b>{label}</b><span>{range}</span></div>)}</div></header>
      <div className="all-gate-wrap"><button className={`project-gate ${selectedProject === "all" ? "active" : ""}`} onClick={() => selectProject("all")}><div><span className="gate-kicker">بوابة عامة</span><h3>كافة المشاريع</h3><p>عرض مؤشرات جميع الحدائق المسجلة.</p></div><b>{gardens.length}</b></button></div>
      <section className="project-gates">{projects.map((project) => { const projectGardens = gardens.filter((garden)=>garden.project === project); const count = projectGardens.length; const avg = count ? Math.round(projectGardens.reduce((sum,g)=>sum+g.score,0)/count) : 0; return <button key={project} className={`project-gate ${selectedProject === project ? "active" : ""}`} onClick={() => selectProject(project)}><div><span className="gate-kicker">بوابة مشروع</span><h3>{project}</h3><p>{count} حديقة · متوسط المؤشر {avg}%</p></div><b>{count}</b></button>})}</section>
      {!selectedProject ? <section className="panel empty"><div className="panel-kicker">ابدأ من بوابات المشاريع</div><h2>اختر كافة المشاريع أو مشروعًا محددًا</h2><p>لن تظهر المؤشرات حتى يختار المستخدم نطاق العرض المناسب.</p></section> : <><div className="selected-project-bar"><div><span>النطاق الحالي</span><h2>{activeProjectTitle}</h2></div><button className="filter-btn" onClick={exportCsv}>تصدير CSV</button></div><section className="stats"><StatCard title="إجمالي الحدائق" value={stats.total} subtitle={mode === "demo" ? "بيانات تجريبية" : "بيانات حقيقية"} icon={icons.trees} active={activeMetric === "total"} onClick={() => toggle("total")} /><StatCard title="أولوية قصوى" value={stats.critical} subtitle="تدخل عاجل" icon={icons.alert} active={activeMetric === "critical"} onClick={() => toggle("critical")} /><StatCard title="أولوية عالية" value={stats.high} subtitle="صيانة قريبة" icon={icons.trend} active={activeMetric === "high"} onClick={() => toggle("high")} /><StatCard title="أولوية متوسطة" value={stats.medium} subtitle="ضمن الخطة" icon={icons.chart} active={activeMetric === "medium"} onClick={() => toggle("medium")} /><StatCard title="أولوية منخفضة" value={stats.low} subtitle="متابعة دورية" icon={icons.gauge} active={activeMetric === "low"} onClick={() => toggle("low")} /><StatCard title="متوسط المؤشر" value={`${stats.average}%`} subtitle={mode === "demo" ? "للتجربة فقط" : "للبيانات الحقيقية"} icon={icons.wrench} active={activeMetric === "average"} onClick={() => toggle("average")} /></section>{loading ? <section className="panel empty"><h2>جاري تحميل البيانات...</h2></section> : <IndicatorPanel activeMetric={activeMetric} gardens={visibleGardens} stats={stats} mode={mode} onDelete={deleteAssessment} />}</>}
    </section></main>
  );
}
