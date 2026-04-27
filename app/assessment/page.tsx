"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { criterionDefinitions, getPriority } from "@/lib/data";
import { supabase } from "@/lib/supabase";

type Project = { id: string; name: string; raw?: any };
type Garden = { id: string; project_id: string; name: string; district?: string | null; raw?: any };
type Scores = Record<string, number>;
type FilesMap = Record<string, File | null>;
type PreviewMap = Record<string, string>;

function getProjectName(row: any) {
  return String(row?.name || row?.project_name || row?.title || row?.slug || row?.id || "مشروع بدون اسم");
}

function getGardenName(row: any) {
  return String(row?.name || row?.garden_name || row?.title || row?.slug || row?.id || "حديقة بدون اسم");
}

function normalizeProject(row: any): Project {
  return {
    id: String(row?.id || row?.project_id || row?.slug || getProjectName(row)),
    name: getProjectName(row),
    raw: row,
  };
}

function normalizeGarden(row: any): Garden {
  return {
    id: String(row?.id || row?.garden_id || row?.slug || getGardenName(row)),
    project_id: String(row?.project_id || row?.projectId || row?.project || ""),
    name: getGardenName(row),
    district: row?.district || row?.neighborhood || row?.area || null,
    raw: row,
  };
}

export default function AssessmentPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [gardens, setGardens] = useState<Garden[]>([]);
  const [projectId, setProjectId] = useState("");
  const [gardenId, setGardenId] = useState("");
  const [scores, setScores] = useState<Scores>({});
  const [files, setFiles] = useState<FilesMap>({});
  const [previews, setPreviews] = useState<PreviewMap>({});
  const [msg, setMsg] = useState("");
  const [loadingMaster, setLoadingMaster] = useState(true);
  const [saving, setSaving] = useState(false);

  async function loadMaster() {
    setLoadingMaster(true);
    setMsg("جاري تحميل المشاريع والحدائق...");

    const [projectsRes, gardensRes] = await Promise.all([
      supabase.from("projects").select("*").order("name", { ascending: true }),
      supabase.from("gardens").select("*").order("name", { ascending: true }),
    ]);

    if (projectsRes.error) {
      setProjects([]);
      setMsg(`تعذر تحميل المشاريع: ${projectsRes.error.message}`);
      setLoadingMaster(false);
      return;
    }

    if (gardensRes.error) {
      setGardens([]);
      setMsg(`تم تحميل المشاريع، لكن تعذر تحميل الحدائق: ${gardensRes.error.message}`);
    } else {
      setGardens((gardensRes.data || []).map(normalizeGarden));
      setMsg("");
    }

    const normalizedProjects = (projectsRes.data || []).map(normalizeProject).filter((p) => p.name.trim());
    setProjects(normalizedProjects);
    setLoadingMaster(false);
  }

  useEffect(() => {
    loadMaster();
  }, []);

  const projectGardens = useMemo(() => gardens.filter((g) => g.project_id === projectId), [gardens, projectId]);
  const selectedProject = projects.find((p) => p.id === projectId);
  const selectedGarden = gardens.find((g) => g.id === gardenId);

  const criteria = useMemo(() => {
    return criterionDefinitions.map((criterion, ci) => {
      const itemLines = criterion.items
        .map((it, ii) => {
          const key = `${ci}-${ii}`;
          const val = Math.min(Number(scores[key] || 0), it.max);
          return val > 0 ? `${it.label}: ${val}/${it.max}` : "";
        })
        .filter(Boolean);

      const value = Math.min(
        criterion.items.reduce((sum, it, ii) => sum + Math.min(Number(scores[`${ci}-${ii}`] || 0), it.max), 0),
        criterion.weight
      );

      return {
        name: criterion.name,
        weight: criterion.weight,
        selected: itemLines.length ? itemLines.join(" + ") : "لم يتم إدخال درجات",
        value,
      };
    });
  }, [scores]);

  const score = criteria.reduce((s, i) => s + i.value, 0);
  const priority = getPriority(score);

  function setItemScore(ci: number, ii: number, max: number, value: string) {
    const num = Math.max(0, Math.min(Number(value || 0), max));
    setScores((prev) => ({ ...prev, [`${ci}-${ii}`]: num }));
  }

  function setItemFile(ci: number, ii: number, file: File | null) {
    const key = `${ci}-${ii}`;
    if (!file) return;
    setFiles((prev) => ({ ...prev, [key]: file }));
    setPreviews((prev) => ({ ...prev, [key]: URL.createObjectURL(file) }));
  }

  async function uploadPhoto(assessmentId: string, criterionId: string, key: string) {
    const file = files[key];
    if (!file) return null;
    const safe = file.name.replace(/[^\w.\-]+/g, "_");
    const path = `${assessmentId}/${criterionId}/${key}-${Date.now()}-${safe}`;
    const { error } = await supabase.storage.from("criterion-photos").upload(path, file, { upsert: true });
    if (error) return null;
    return supabase.storage.from("criterion-photos").getPublicUrl(path).data.publicUrl;
  }

  async function insertAssessmentRecord() {
    const payload: any = {
      garden_id: gardenId,
      garden_name: selectedGarden?.name || "",
      project: selectedProject?.name || "",
      district: selectedGarden?.district || "غير محدد",
      score,
      priority: priority.label,
    };

    let result = await supabase.from("garden_assessments").insert(payload).select("id").single();

    // توافق مع الجداول القديمة التي قد تستخدم total_score / project_name
    if (result.error) {
      const fallbackPayload: any = {
        garden_id: gardenId,
        garden_name: selectedGarden?.name || "",
        project_name: selectedProject?.name || "",
        district: selectedGarden?.district || "غير محدد",
        total_score: score,
        priority: priority.label,
      };
      result = await supabase.from("garden_assessments").insert(fallbackPayload).select("id").single();
    }

    return result;
  }

  async function saveAssessment() {
    if (!projectId || !gardenId) {
      setMsg("اختر المشروع والحديقة أولاً.");
      return;
    }

    setSaving(true);
    setMsg("جاري الحفظ ورفع الصور...");

    const { data: assessment, error } = await insertAssessmentRecord();
    if (error || !assessment) {
      setMsg(`تعذر حفظ التقييم: ${error?.message || "خطأ غير معروف"}`);
      setSaving(false);
      return;
    }

    for (let ci = 0; ci < criteria.length; ci++) {
      const c = criteria[ci];
      const { data: criterion, error: criterionError } = await supabase
        .from("assessment_criteria")
        .insert({ assessment_id: assessment.id, criterion_name: c.name, weight: c.weight, selected_label: c.selected, value: c.value })
        .select("id")
        .single();

      if (!criterionError && criterion) {
        for (let ii = 0; ii < criterionDefinitions[ci].items.length; ii++) {
          const key = `${ci}-${ii}`;
          const url = await uploadPhoto(assessment.id, criterion.id, key);
          if (url) {
            await supabase.from("criterion_photos").insert({
              criterion_id: criterion.id,
              photo_url: url,
              note: `صورة بند ${criterionDefinitions[ci].items[ii].label}`,
            });
          }
        }
      }
    }

    setMsg(`تم حفظ التقييم بنجاح. التصنيف: أولوية ${priority.label} (${score}%).`);
    setSaving(false);
  }

  return (
    <main className="page">
      <section className="container">
        <header className="header">
          <div>
            <div className="pill">📝 صفحة إدخال التقييم</div>
            <h1>تقييم حديقة جديدة</h1>
            <p>اختر المشروع والحديقة من القاعدة، ثم أدخل درجة كل بند وارفع صورة مستقلة لكل بند عند الحاجة.</p>
            <div className="nav-actions">
              <Link className="action" href="/dashboard">عرض لوحة النتائج</Link>
              <button className="action secondary" onClick={loadMaster} type="button">تحديث المشاريع والحدائق</button>
            </div>
          </div>
          <div className="legend">
            <p>النتيجة الحالية</p>
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

            {loadingMaster && <p className="panel-desc">جاري تحميل المشاريع...</p>}
            {msg && <p className="panel-desc">{msg}</p>}

            <div className="field">
              <label>المشروع</label>
              <div className="project-picker">
                {projects.length === 0 && !loadingMaster && <p className="panel-desc">لا توجد مشاريع مقروءة من القاعدة.</p>}
                {projects.map((project) => (
                  <button
                    type="button"
                    key={project.id}
                    className={`picker-card ${projectId === project.id ? "active" : ""}`}
                    onClick={() => { setProjectId(project.id); setGardenId(""); }}
                  >
                    <b>{project.name}</b>
                  </button>
                ))}
              </div>
            </div>

            <div className="field">
              <label>الحديقة</label>
              {!projectId && <p className="panel-desc">اختر مشروعًا أولاً لعرض حدائقه.</p>}
              {projectId && projectGardens.length === 0 && <p className="panel-desc">لا توجد حدائق مرتبطة بهذا المشروع.</p>}
              <div className="garden-picker">
                {projectGardens.map((garden) => (
                  <button
                    type="button"
                    key={garden.id}
                    className={`picker-card ${gardenId === garden.id ? "active" : ""}`}
                    onClick={() => setGardenId(garden.id)}
                  >
                    <b>{garden.name}</b>
                    <small>{garden.district || "بدون حي"}</small>
                  </button>
                ))}
              </div>
            </div>

            <button className="submit" onClick={saveAssessment} disabled={saving}>
              {saving ? "جاري الحفظ..." : "حفظ التقييم"}
            </button>
          </aside>

          <section className="form-card">
            <h2>المعايير والبنود</h2>
            <div className="criteria-form">
              {criterionDefinitions.map((criterion, ci) => (
                <div className="criterion-form" key={criterion.name}>
                  <div className="criterion-form-head">
                    <h3>{criterion.name}</h3>
                    <b>{criteria[ci]?.value || 0}/{criterion.weight}</b>
                  </div>
                  <div className="items-grid">
                    {criterion.items.map((item, ii) => {
                      const key = `${ci}-${ii}`;
                      return (
                        <div className="item-card" key={key}>
                          <h4>{item.label}</h4>
                          <div className="item-row">
                            <label>الدرجة / {item.max}</label>
                            <input type="number" min={0} max={item.max} value={scores[key] ?? ""} onChange={(e) => setItemScore(ci, ii, item.max, e.target.value)} placeholder="0" />
                          </div>
                          <div className="file-mini">
                            <label className="change-photo">{previews[key] ? "تغيير الصورة" : "رفع صورة للبند"}</label>
                            <input type="file" accept="image/*" onChange={(e) => setItemFile(ci, ii, e.target.files?.[0] || null)} />
                            {previews[key] && <div className="preview"><div className="preview-box"><img src={previews[key]} alt="معاينة" /></div></div>}
                          </div>
                        </div>
                      );
                    })}
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
