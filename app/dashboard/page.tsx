"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { demoGardens, GardenAssessment, getMainReasons, getPriority, STORAGE_KEY } from "@/lib/data";

const icons = { trees: "🌳", alert: "⚠️", trend: "📈", chart: "📊", gauge: "🎯", wrench: "🛠️" };

function StatCard({ title, value, subtitle, icon, active, onClick }: any) {
  return (
    <button className={`stat ${active ? "active" : ""}`} onClick={onClick}>
      <div className="stat-top"><span className="stat-icon">{icon}</span><small>عرض المؤشر</small></div>
      <div className="stat-title">{title}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-sub">{subtitle}</div>
    </button>
  );
}

function IndicatorPanel({ activeMetric, gardens, stats }: any) {
  const metricData: any = {
    total: { title: "إجمالي الحدائق المقيمة", description: "كل الحدائق التي تم تقييمها داخل النظام.", list: gardens },
    critical: { title: "حدائق ذات أولوية قصوى", description: "الحدائق التي حصلت على نتيجة بين 90 و 100 وتحتاج تدخل عاجل.", list: gardens.filter((g: GardenAssessment) => getPriority(g.score).label === "قصوى") },
    high: { title: "حدائق ذات أولوية عالية", description: "الحدائق التي حصلت على نتيجة بين 75 و 89 وتحتاج صيانة قريبة.", list: gardens.filter((g: GardenAssessment) => getPriority(g.score).label === "عالية") },
    medium: { title: "حدائق ذات أولوية متوسطة", description: "الحدائق التي حصلت على نتيجة بين 65 و 74 وتدخل ضمن الخطة.", list: gardens.filter((g: GardenAssessment) => getPriority(g.score).label === "متوسطة") },
    low: { title: "حدائق ذات أولوية منخفضة", description: "الحدائق التي حصلت على نتيجة بين 50 و 64 وتحتاج متابعة دورية.", list: gardens.filter((g: GardenAssessment) => getPriority(g.score).label === "منخفضة") },
    average: { title: "متوسط مؤشر الأولوية", description: `متوسط نتائج جميع الحدائق المقيمة هو ${stats.average}%.`, list: gardens },
  };

  const data = metricData[activeMetric];
  if (!activeMetric || !data) {
    return (
      <section className="panel empty">
        <div className="panel-kicker">ابدأ من المؤشرات بالأعلى</div>
        <h2>اختر أي مؤشر لعرض بياناته</h2>
        <p>لن يتم فتح أي بيانات تلقائيًا حتى يختار المستخدم المؤشر المناسب.</p>
      </section>
    );
  }

  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <div className="panel-kicker">بيانات المؤشر المحدد</div>
          <h2>{data.title}</h2>
          <p className="panel-desc">{data.description}</p>
        </div>
        <div className="count-box"><small>العدد</small><b>{data.list.length}</b></div>
      </div>

      <div className="grid">
        {data.list.map((garden: GardenAssessment) => {
          const priority = getPriority(garden.score);
          return (
            <details key={garden.id} className="garden-card">
              <summary>
                <div className="card-top">
                  <span className={`badge ${priority.tone}`}>أولوية {priority.label}</span>
                  <div className="score"><b>{garden.score}%</b><small>{priority.text}</small></div>
                </div>
                <h3>{garden.name}</h3>
                <div className="meta">{garden.project} · {garden.district}</div>
                <div className="bar"><div className={priority.tone} style={{ width: `${garden.score}%` }} /></div>
                <div className="open-card">اضغط لعرض أسباب هذه الحديقة</div>
              </summary>

              <div className="reasons">
                <b>أبرز الأسباب</b>
                {getMainReasons(garden).map((reason) => (
                  <div className="reason-row" key={reason.name}>
                    <span>{reason.name}</span>
                    <b>{reason.value}/{reason.weight}</b>
                  </div>
                ))}

                <details className="criteria-box">
                  <summary className="details-btn">تفاصيل المعايير</summary>
                  {garden.criteria.map((item) => {
                    const percentage = Math.min((item.value / item.weight) * 100, 100);
                    return (
                      <div className="criterion" key={item.name}>
                        <div className="criterion-title"><span>{item.name}</span><span>{item.value}/{item.weight}</span></div>
                        <p>{item.selected}</p>
                        {item.photos && item.photos.length > 0 && (
                          <details>
                            <summary className="open-card">عرض الصور ({item.photos.length})</summary>
                            <div className="photo-grid">
                              {item.photos.map((photo, idx) => (
                                <div className="photo" key={idx}>
                                  <img src={photo} alt={`إثبات ${idx + 1}`} />
                                  <span>إثبات حالة المعيار #{idx + 1}</span>
                                </div>
                              ))}
                            </div>
                          </details>
                        )}
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
  const [gardens, setGardens] = useState<GardenAssessment[]>(demoGardens);
  const [activeMetric, setActiveMetric] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setGardens(JSON.parse(saved));
  }, []);

  const orderedGardens = useMemo(() => [...gardens].sort((a, b) => b.score - a.score), [gardens]);

  const stats = useMemo(() => {
    const average = gardens.length ? Math.round(gardens.reduce((sum, g) => sum + g.score, 0) / gardens.length) : 0;
    return {
      total: gardens.length,
      critical: gardens.filter((g) => getPriority(g.score).label === "قصوى").length,
      high: gardens.filter((g) => getPriority(g.score).label === "عالية").length,
      medium: gardens.filter((g) => getPriority(g.score).label === "متوسطة").length,
      low: gardens.filter((g) => getPriority(g.score).label === "منخفضة").length,
      average,
    };
  }, [gardens]);

  const toggle = (key: string) => setActiveMetric(activeMetric === key ? null : key);

  return (
    <main className="page">
      <section className="container">
        <header className="header">
          <div>
            <div className="pill">🌳 مركز القرار التشغيلي لصيانة الحدائق</div>
            <h1>مؤشر أولوية صيانة الحدائق</h1>
            <p>واجهة نتائج تعرض المؤشرات فقط. عند الضغط على أي مؤشر تظهر البيانات الخاصة به فقط، وتبقى تفاصيل التقييم والصور مخفية داخل كل حديقة.</p>
            <div className="nav-actions">
              <Link className="action" href="/assessment">+ تقييم حديقة جديدة</Link>
              <button className="action secondary" onClick={() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(demoGardens)); setGardens(demoGardens); }}>استعادة البيانات التجريبية</button>
            </div>
          </div>
          <div className="legend">
            <p className="legend-title">تصنيف الأولوية المعتمد</p>
            {[["أولوية قصوى", "90 - 100"], ["أولوية عالية", "75 - 89"], ["أولوية متوسطة", "65 - 74"], ["أولوية منخفضة", "50 - 64"]].map(([label, range]) => (
              <div key={label} className="legend-row"><b>{label}</b><span>{range}</span></div>
            ))}
          </div>
        </header>

        <section className="stats">
          <StatCard title="إجمالي الحدائق" value={stats.total} subtitle="حدائق تم تقييمها" icon={icons.trees} active={activeMetric === "total"} onClick={() => toggle("total")} />
          <StatCard title="أولوية قصوى" value={stats.critical} subtitle="تدخل عاجل" icon={icons.alert} active={activeMetric === "critical"} onClick={() => toggle("critical")} />
          <StatCard title="أولوية عالية" value={stats.high} subtitle="صيانة قريبة" icon={icons.trend} active={activeMetric === "high"} onClick={() => toggle("high")} />
          <StatCard title="أولوية متوسطة" value={stats.medium} subtitle="ضمن الخطة" icon={icons.chart} active={activeMetric === "medium"} onClick={() => toggle("medium")} />
          <StatCard title="أولوية منخفضة" value={stats.low} subtitle="متابعة دورية" icon={icons.gauge} active={activeMetric === "low"} onClick={() => toggle("low")} />
          <StatCard title="متوسط المؤشر" value={`${stats.average}%`} subtitle="لكل الحدائق" icon={icons.wrench} active={activeMetric === "average"} onClick={() => toggle("average")} />
        </section>

        <IndicatorPanel activeMetric={activeMetric} gardens={orderedGardens} stats={stats} />
      </section>
    </main>
  );
}
