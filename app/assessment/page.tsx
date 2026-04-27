"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { criterionDefinitions, getPriority } from "@/lib/data";
import { supabase } from "@/lib/supabase";

type Selections = Record<number, number[]>;
type FilesByCriterion = Record<number, File[]>;
type Employee = { id: string; name: string };
type Project = { id: string; employee_id: string; name: string };
type Garden = { id: string; project_id: string; name: string; district?: string | null };

export default function AssessmentPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [gardens, setGardens] = useState<Garden[]>([]);

  const [employeeId, setEmployeeId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [gardenId, setGardenId] = useState("");

  const [selections, setSelections] = useState<Selections>({});
  const [files, setFiles] = useState<FilesByCriterion>({});
  const [previews, setPreviews] = useState<Record<number, string[]>>({});
  const [savedMessage, setSavedMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function loadMasterData() {
    const [e, p, g] = await Promise.all([
      supabase.from("employees").select("id,name").order("name"),
      supabase.from("projects").select("id,employee_id,name").order("name"),
      supabase.from("gardens").select("id,project_id,name,district").order("name"),
    ]);
    if (e.data) setEmployees(e.data);
    if (p.data) setProjects(p.data);
    if (g.data) setGardens(g.data);
  }

  useEffect(() => { loadMasterData(); }, []);

  const employeeProjects = projects.filter((p) => !employeeId || p.employee_id === employeeId);
  const projectGardens = gardens.filter((g) => !projectId || g.project_id === projectId);

  const selectedEmployee = employees.find((e) => e.id === employeeId);
  const selectedProject = projects.find((p) => p.id === projectId);
  const selectedGarden = gardens.find((g) => g.id === gardenId);

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
      };
    });
  }, [selections]);

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

  const handlePhotos = (criterionIndex: number, fileList: FileList | null) => {
    if (!fileList) return;
    const selectedFiles = Array.from(fileList).slice(0, 4);
    setFiles((prev) => ({ ...prev, [criterionIndex]: [...(prev[criterionIndex] || []), ...selectedFiles] }));
    setPreviews((prev) => ({
      ...prev,
      [criterionIndex]: [...(prev[criterionIndex] || []), ...selectedFiles.map((file) => URL.createObjectURL(file))],
    }));
  };

  async function uploadCriterionPhotos(assessmentId: string, criterionId: string, criterionIndex: number) {
    const criterionFiles = files[criterionIndex] || [];
    const uploadedUrls: string[] = [];

    for (const file of criterionFiles) {
      const safeName = file.name.replace(/[^\w.\-]+/g, "_");
      const path = `${assessmentId}/${criterionId}/${Date.now()}-${safeName}`;
      const { error: uploadError } = await supabase.storage.from("criterion-photos").upload(path, file);
      if (uploadError) continue;

      const { data } = supabase.storage.from("criterion-photos").getPublicUrl(path);
      if (data.publicUrl) uploadedUrls.push(data.publicUrl);
    }

    if (uploadedUrls.length) {
      await supabase.from("criterion_photos").insert(uploadedUrls.map((url) => ({
        criterion_id: criterionId,
        photo_url: url,
        note: "صورة إثبات من تقييم المشرف",
      })));
    }
  }

  const saveAssessment = async () => {
    if (!employeeId || !projectId || !gardenId) {
      setSavedMessage("اختر الموظف والمشروع والحديقة أولاً.");
      return;
    }

    setSaving(true);
    setSavedMessage("جاري الحفظ ورفع الصور...");

    const { data: assessment, error } = await supabase
      .from("garden_assessments")
      .insert({
        employee_id: employeeId,
        project_id: projectId,
        garden_id: gardenId,
        employee_name: selectedEmployee?.name,
        garden_name: selectedGarden?.name || "",
        project: selectedProject?.name || "",
        district: selectedGarden?.district || "غير محدد",
        score,
        priority: priority.label,
      })
      .select("id")
      .single();

    if (error || !assessment) {
      setSavedMessage(`تعذر حفظ التقييم: ${error?.message || "خطأ غير معروف"}`);
      setSaving(false);
      return;
    }

    for (let index = 0; index < criteria.length; index++) {
      const criterion = criteria[index];
      const { data: insertedCriterion, error: criterionError } = await supabase
        .from("assessment_criteria")
        .insert({
          assessment_id: assessment.id,
          criterion_name: criterion.name,
          weight: criterion.weight,
          selected_label: criterion.selected,
          value: criterion.value,
        })
        .select("id")
        .single();

      if (!criterionError && insertedCriterion) {
        await uploadCriterionPhotos(assessment.id, insertedCriterion.id, index);
      }
    }

    setSavedMessage(`تم حفظ التقييم بنجاح. التصنيف: أولوية ${priority.label} (${score}%).`);
    setSaving(false);
  };

  return (
    <main className="page">
      <section className="container">
        <header className="header">
          <div>
            <div className="pill">📝 صفحة إدخال التقييم</div>
            <h1>تقييم حديقة جديدة</h1>
            <p>اختر الموظف ثم المشروع ثم الحديقة من البيانات الأساسية، وبعدها أدخل درجات المعايير وارفع صور الإثبات.</p>
            <div className="nav-actions">
              <Link className="action" href="/dashboard">عرض لوحة النتائج</Link>
              <Link className="action secondary" href="/admin-data">إدارة البيانات الأساسية</Link>
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
            <h2>بيانات التقييم</h2>
            <div className="field">
              <label>الموظف المسؤول</label>
              <select value={employeeId} onChange={(e) => { setEmployeeId(e.target.value); setProjectId(""); setGardenId(""); }}>
                <option value="">اختر موظف</option>
                {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
            <div className="field">
              <label>المشروع</label>
              <select value={projectId} onChange={(e) => { setProjectId(e.target.value); setGardenId(""); }}>
                <option value="">اختر مشروع</option>
                {employeeProjects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="field">
              <label>الحديقة</label>
              <select value={gardenId} onChange={(e) => setGardenId(e.target.value)}>
                <option value="">اختر حديقة</option>
                {projectGardens.map((g) => <option key={g.id} value={g.id}>{g.name} - {g.district || "بدون حي"}</option>)}
              </select>
            </div>

            <button className="submit" onClick={saveAssessment} disabled={saving}>
              {saving ? "جاري الحفظ..." : "حفظ التقييم وإظهار النتيجة"}
            </button>
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
                        <button key={option.label} className={`option ${active ? "active" : ""}`} onClick={() => toggleOption(criterionIndex, optionIndex, criterion.multi)}>
                          <b>{option.label}</b><br /><small>{option.value} درجات</small>
                        </button>
                      );
                    })}
                  </div>

                  <div className="filebox">
                    <label>صور إثبات الحالة لهذا المعيار</label>
                    <input type="file" accept="image/*" multiple onChange={(e) => handlePhotos(criterionIndex, e.target.files)} />
                    {!!previews[criterionIndex]?.length && (
                      <div className="preview">
                        {previews[criterionIndex].map((photo, idx) => <img key={idx} src={photo} alt={`صورة ${idx + 1}`} />)}
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
