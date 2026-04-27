"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { criterionDefinitions, demoGardens, GardenAssessment, STORAGE_KEY, getPriority } from "@/lib/data";

type Selections = Record<number, number[]>;
type Photos = Record<number, string[]>;

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}

export default function AssessmentPage() {
  const [gardenName, setGardenName] = useState("");
  const [project, setProject] = useState("مشروع بريمان وطيبة");
  const [district, setDistrict] = useState("");
  const [selections, setSelections] = useState<Selections>({});
  const [photos, setPhotos] = useState<Photos>({});
  const [savedMessage, setSavedMessage] = useState("");

  const criteria = useMemo(() => {
    return criterionDefinitions.map((criterion, index) => {
      const selectedIndexes = selections[index] || [];
      const selectedOptions = selectedIndexes.map((i) => criterion.options[i]).filter(Boolean);
      const value = selectedOptions.reduce((sum, option) => sum + option.value, 0);
      return {
        name: criterion.name,
        weight: criterion.weight,
        selected: selectedOptions.length ? selectedOptions.map((o) => o.label).join(" + ") : "لم يتم الاختيار",
        value: Math.min(value, criterion.weight),
        photos: photos[index] || [],
      };
    });
  }, [selections, photos]);

  const score = criteria.reduce((sum, item) => sum + item.value, 0);
  const priority = getPriority(score);

  const toggleOption = (criterionIndex: number, optionIndex: number, multi?: boolean) => {
    setSelections((prev) => {
      const current = prev[criterionIndex] || [];
      if (!multi) return { ...prev, [criterionIndex]: [optionIndex] };
      const exists = current.includes(optionIndex);
      return { ...prev, [criterionIndex]: exists ? current.filter((i) => i !== optionIndex) : [...current, optionIndex] };
    });
  };

  const handlePhotos = async (criterionIndex: number, files: FileList | null) => {
    if (!files) return;
    const urls = await Promise.all(Array.from(files).slice(0, 4).map(fileToDataUrl));
    setPhotos((prev) => ({ ...prev, [criterionIndex]: [...(prev[criterionIndex] || []), ...urls] }));
  };

  const saveAssessment = () => {
    if (!gardenName.trim()) {
      setSavedMessage("اكتب اسم الحديقة أولاً.");
      return;
    }

    const newAssessment: GardenAssessment = {
      id: `assessment-${Date.now()}`,
      name: gardenName.trim(),
      project,
      district: district.trim() || "غير محدد",
      score,
      lastEvaluation: new Date().toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" }),
      criteria,
    };

    const existing = localStorage.getItem(STORAGE_KEY);
    const current = existing ? JSON.parse(existing) : demoGardens;
    const updated = [newAssessment, ...current];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setSavedMessage(`تم حفظ التقييم بنجاح. التصنيف: أولوية ${priority.label} (${score}%).`);
  };

  return (
    <main className="page">
      <section className="container">
        <header className="header">
          <div>
            <div className="pill">📝 صفحة إدخال التقييم</div>
            <h1>تقييم حديقة جديدة</h1>
            <p>يدخل المشرف درجات المعايير ويرفع صور إثبات الحالة. بعد الحفظ تُحسب النتيجة تلقائيًا وتظهر في لوحة المؤشرات.</p>
            <div className="nav-actions">
              <Link className="action" href="/dashboard">عرض لوحة النتائج</Link>
            </div>
          </div>
          <div className="legend">
            <p className="legend-title">النتيجة الحالية</p>
            <div className="result-box">
              <div className="result-score">{score}%</div>
              <div>أولوية {priority.label}</div>
              <small>{priority.range} · {priority.text}</small>
            </div>
          </div>
        </header>

        <section className="form-shell">
          <aside className="form-card">
            <h2>بيانات الحديقة</h2>
            <div className="field">
              <label>اسم الحديقة</label>
              <input value={gardenName} onChange={(e) => setGardenName(e.target.value)} placeholder="مثال: حديقة الربيع" />
            </div>
            <div className="field">
              <label>المشروع</label>
              <select value={project} onChange={(e) => setProject(e.target.value)}>
                <option>مشروع بريمان وطيبة</option>
                <option>مشروع الحمدانية</option>
                <option>مشروع التحلية</option>
                <option>مشروع الشروق</option>
              </select>
            </div>
            <div className="field">
              <label>الحي / الموقع</label>
              <input value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="مثال: حي الربيع" />
            </div>

            <button className="submit" onClick={saveAssessment}>حفظ التقييم وإظهار النتيجة</button>
            {savedMessage && <p className="panel-desc">{savedMessage}</p>}
          </aside>

          <section className="form-card">
            <h2>المعايير السبعة</h2>
            <div className="criteria-form">
              {criterionDefinitions.map((criterion, criterionIndex) => (
                <div className="criterion-form" key={criterion.name}>
                  <div className="criterion-form-head">
                    <h3>{criterion.name}</h3>
                    <b>{criteria[criterionIndex]?.value || 0}/{criterion.weight}</b>
                  </div>

                  <div className="options">
                    {criterion.options.map((option, optionIndex) => {
                      const active = (selections[criterionIndex] || []).includes(optionIndex);
                      return (
                        <button
                          key={option.label}
                          className={`option ${active ? "active" : ""}`}
                          onClick={() => toggleOption(criterionIndex, optionIndex, criterion.multi)}
                        >
                          <b>{option.label}</b>
                          <br />
                          <small>{option.value} درجات</small>
                        </button>
                      );
                    })}
                  </div>

                  <div className="filebox">
                    <label>صور إثبات الحالة لهذا المعيار</label>
                    <input type="file" accept="image/*" multiple onChange={(e) => handlePhotos(criterionIndex, e.target.files)} />
                    {!!photos[criterionIndex]?.length && (
                      <div className="preview">
                        {photos[criterionIndex].map((photo, idx) => <img key={idx} src={photo} alt={`صورة ${idx + 1}`} />)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </section>
      </section>
    </main>
  );
}
