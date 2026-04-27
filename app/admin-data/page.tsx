"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Employee = { id: string; name: string; job_title?: string | null; status?: string | null };
type Project = { id: string; employee_id: string; name: string; region?: string | null; status?: string | null };
type Garden = { id: string; project_id: string; name: string; district?: string | null; location_url?: string | null; status?: string | null };

export default function AdminDataPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [gardens, setGardens] = useState<Garden[]>([]);
  const [message, setMessage] = useState("");

  const [employeeName, setEmployeeName] = useState("");
  const [employeeTitle, setEmployeeTitle] = useState("مشرف مشاريع");

  const [projectName, setProjectName] = useState("");
  const [projectRegion, setProjectRegion] = useState("");
  const [projectEmployeeId, setProjectEmployeeId] = useState("");

  const [gardenName, setGardenName] = useState("");
  const [gardenDistrict, setGardenDistrict] = useState("");
  const [gardenProjectId, setGardenProjectId] = useState("");

  async function loadData() {
    const [employeesRes, projectsRes, gardensRes] = await Promise.all([
      supabase.from("employees").select("*").order("created_at", { ascending: false }),
      supabase.from("projects").select("*").order("created_at", { ascending: false }),
      supabase.from("gardens").select("*").order("created_at", { ascending: false }),
    ]);

    if (employeesRes.data) setEmployees(employeesRes.data);
    if (projectsRes.data) setProjects(projectsRes.data);
    if (gardensRes.data) setGardens(gardensRes.data);
  }

  useEffect(() => { loadData(); }, []);

  async function addEmployee() {
    if (!employeeName.trim()) return setMessage("اكتب اسم الموظف.");
    const { error } = await supabase.from("employees").insert({ name: employeeName.trim(), job_title: employeeTitle.trim() });
    if (error) return setMessage(error.message);
    setEmployeeName("");
    setMessage("تمت إضافة الموظف.");
    loadData();
  }

  async function addProject() {
    if (!projectName.trim() || !projectEmployeeId) return setMessage("اكتب اسم المشروع واختر الموظف.");
    const { error } = await supabase.from("projects").insert({
      name: projectName.trim(),
      region: projectRegion.trim(),
      employee_id: projectEmployeeId,
    });
    if (error) return setMessage(error.message);
    setProjectName("");
    setProjectRegion("");
    setMessage("تمت إضافة المشروع.");
    loadData();
  }

  async function addGarden() {
    if (!gardenName.trim() || !gardenProjectId) return setMessage("اكتب اسم الحديقة واختر المشروع.");
    const { error } = await supabase.from("gardens").insert({
      name: gardenName.trim(),
      district: gardenDistrict.trim(),
      project_id: gardenProjectId,
    });
    if (error) return setMessage(error.message);
    setGardenName("");
    setGardenDistrict("");
    setMessage("تمت إضافة الحديقة.");
    loadData();
  }

  async function deleteRow(table: "employees" | "projects" | "gardens", id: string) {
    const ok = confirm("هل تريد الحذف؟");
    if (!ok) return;
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) return setMessage(error.message);
    setMessage("تم الحذف.");
    loadData();
  }

  const employeeNameById = useMemo(() => Object.fromEntries(employees.map((e) => [e.id, e.name])), [employees]);
  const projectNameById = useMemo(() => Object.fromEntries(projects.map((p) => [p.id, p.name])), [projects]);

  return (
    <main className="page">
      <section className="container">
        <header className="header">
          <div>
            <div className="pill">⚙️ إدارة البيانات الأساسية</div>
            <h1>الموظفون والمشاريع والحدائق</h1>
            <p>هذه الصفحة لإدارة البيانات الأساسية التي تظهر تلقائيًا في لوحة النتائج وصفحة التقييم.</p>
            <div className="nav-actions">
              <Link className="action" href="/dashboard">لوحة النتائج</Link>
              <Link className="action secondary" href="/assessment">تقييم حديقة</Link>
            </div>
            {message && <p>{message}</p>}
          </div>
          <div className="legend">
            <p className="legend-title">الهيكل الإداري</p>
            <div className="legend-row"><b>الموظفون</b><span>{employees.length}</span></div>
            <div className="legend-row"><b>المشاريع</b><span>{projects.length}</span></div>
            <div className="legend-row"><b>الحدائق</b><span>{gardens.length}</span></div>
          </div>
        </header>

        <section className="admin-grid">
          <div className="form-card">
            <h2>إضافة موظف</h2>
            <div className="field"><label>اسم الموظف</label><input value={employeeName} onChange={(e) => setEmployeeName(e.target.value)} /></div>
            <div className="field"><label>المسمى</label><input value={employeeTitle} onChange={(e) => setEmployeeTitle(e.target.value)} /></div>
            <button className="submit" onClick={addEmployee}>إضافة الموظف</button>
          </div>

          <div className="form-card">
            <h2>إضافة مشروع</h2>
            <div className="field"><label>اسم المشروع</label><input value={projectName} onChange={(e) => setProjectName(e.target.value)} /></div>
            <div className="field"><label>النطاق / المنطقة</label><input value={projectRegion} onChange={(e) => setProjectRegion(e.target.value)} /></div>
            <div className="field">
              <label>الموظف المسؤول</label>
              <select value={projectEmployeeId} onChange={(e) => setProjectEmployeeId(e.target.value)}>
                <option value="">اختر موظف</option>
                {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
            <button className="submit" onClick={addProject}>إضافة المشروع</button>
          </div>

          <div className="form-card">
            <h2>إضافة حديقة</h2>
            <div className="field"><label>اسم الحديقة</label><input value={gardenName} onChange={(e) => setGardenName(e.target.value)} /></div>
            <div className="field"><label>الحي</label><input value={gardenDistrict} onChange={(e) => setGardenDistrict(e.target.value)} /></div>
            <div className="field">
              <label>المشروع</label>
              <select value={gardenProjectId} onChange={(e) => setGardenProjectId(e.target.value)}>
                <option value="">اختر مشروع</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name} - {employeeNameById[p.employee_id]}</option>)}
              </select>
            </div>
            <button className="submit" onClick={addGarden}>إضافة الحديقة</button>
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <div><div className="panel-kicker">سجل البيانات الأساسية</div><h2>الموظفون والمشاريع والحدائق</h2></div>
          </div>

          <div className="admin-lists">
            <div>
              <h3>الموظفون</h3>
              {employees.map((e) => (
                <div className="admin-row" key={e.id}><span>{e.name}<small>{e.job_title}</small></span><button onClick={() => deleteRow("employees", e.id)}>حذف</button></div>
              ))}
            </div>
            <div>
              <h3>المشاريع</h3>
              {projects.map((p) => (
                <div className="admin-row" key={p.id}><span>{p.name}<small>{employeeNameById[p.employee_id]} · {p.region}</small></span><button onClick={() => deleteRow("projects", p.id)}>حذف</button></div>
              ))}
            </div>
            <div>
              <h3>الحدائق</h3>
              {gardens.map((g) => (
                <div className="admin-row" key={g.id}><span>{g.name}<small>{projectNameById[g.project_id]} · {g.district}</small></span><button onClick={() => deleteRow("gardens", g.id)}>حذف</button></div>
              ))}
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
