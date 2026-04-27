export type Tone = "red" | "orange" | "yellow" | "emerald";
export type Criterion = { name: string; weight: number; selected: string; value: number; photos?: string[] };
export type GardenAssessment = { id: string; name: string; project: string; district: string; score: number; lastEvaluation: string; criteria: Criterion[] };

export const samplePhotos = [
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?auto=format&fit=crop&w=1200&q=80",
];

export const criterionDefinitions = [
  { name: "تصنيف الحديقة", weight: 15, options: [{ label: "مساحة كبيرة أكبر من 5000 م²", value: 15 },{ label: "مساحة متوسطة أكبر من 2500 م²", value: 10 },{ label: "مساحة منخفضة أقل من 1500 م²", value: 5 }] },
  { name: "البنية التحتية", weight: 20, multi: true, options: [{ label: "خزان", value: 5 },{ label: "شبكة ري", value: 3 },{ label: "تربة زراعية", value: 3 },{ label: "أشجار", value: 4 },{ label: "عداد كهرباء", value: 5 }] },
  { name: "وجود حدائق بالقرب من الموقع", weight: 15, options: [{ label: "بعيد عن الموقع 1000 م.ط", value: 15 },{ label: "متوسط عن الموقع 800 م.ط", value: 10 },{ label: "قريب عن الموقع 500 م.ط", value: 5 }] },
  { name: "الأرصفة أو الممرات", weight: 10, options: [{ label: "متهالكة", value: 3 },{ label: "متوسطة", value: 7 },{ label: "جيدة", value: 10 }] },
  { name: "الكثافة السكانية", weight: 15, options: [{ label: "عالية", value: 15 },{ label: "متوسطة", value: 10 },{ label: "منخفضة", value: 5 }] },
  { name: "تكلفة أعمال التطوير والتحسين", weight: 10, options: [{ label: "عالية", value: 3 },{ label: "متوسطة", value: 7 },{ label: "منخفضة", value: 10 }] },
  { name: "كثرة البلاغات والشكاوي", weight: 15, options: [{ label: "عالية", value: 15 },{ label: "متوسطة", value: 10 },{ label: "منخفضة", value: 5 }] },
];

export const demoGardens: GardenAssessment[] = [
  { id:"demo-1", name:"حديقة الربيع", project:"مشروع بريمان وطيبة", district:"حي الربيع", score:94, lastEvaluation:"27 أبريل 2026", criteria:[
    { name:"تصنيف الحديقة", weight:15, selected:"مساحة كبيرة أكبر من 5000 م²", value:15, photos:samplePhotos },
    { name:"البنية التحتية", weight:20, selected:"خزان + شبكة ري + أشجار + عداد كهرباء", value:18, photos:samplePhotos.slice(0,2) },
    { name:"وجود حدائق بالقرب من الموقع", weight:15, selected:"بعيد عن الموقع 1000 م.ط", value:15 },
    { name:"الأرصفة أو الممرات", weight:10, selected:"متهالكة", value:9, photos:samplePhotos },
    { name:"الكثافة السكانية", weight:15, selected:"عالية", value:15 },
    { name:"تكلفة أعمال التطوير والتحسين", weight:10, selected:"منخفضة", value:8 },
    { name:"كثرة البلاغات والشكاوي", weight:15, selected:"عالية", value:14, photos:samplePhotos.slice(1) },
  ]},
  { id:"demo-2", name:"حديقة النخيل", project:"مشروع بريمان وطيبة", district:"حي النخيل", score:82, lastEvaluation:"26 أبريل 2026", criteria:[
    { name:"تصنيف الحديقة", weight:15, selected:"مساحة متوسطة أكبر من 2500 م²", value:10 },
    { name:"البنية التحتية", weight:20, selected:"خزان + شبكة ري + تربة زراعية", value:14, photos:samplePhotos.slice(0,2) },
    { name:"وجود حدائق بالقرب من الموقع", weight:15, selected:"متوسط عن الموقع 800 م.ط", value:10 },
    { name:"الأرصفة أو الممرات", weight:10, selected:"متوسطة", value:7, photos:samplePhotos.slice(0,1) },
    { name:"الكثافة السكانية", weight:15, selected:"عالية", value:15 },
    { name:"تكلفة أعمال التطوير والتحسين", weight:10, selected:"متوسطة", value:7 },
    { name:"كثرة البلاغات والشكاوي", weight:15, selected:"عالية", value:9 },
  ]},
  { id:"demo-3", name:"حديقة السلام", project:"مشروع الحمدانية", district:"حي السلام", score:69, lastEvaluation:"25 أبريل 2026", criteria:[
    { name:"تصنيف الحديقة", weight:15, selected:"مساحة منخفضة أقل من 1500 م²", value:5 },
    { name:"البنية التحتية", weight:20, selected:"شبكة ري + أشجار", value:10, photos:samplePhotos.slice(1) },
    { name:"وجود حدائق بالقرب من الموقع", weight:15, selected:"قريب عن الموقع 500 م.ط", value:5 },
    { name:"الأرصفة أو الممرات", weight:10, selected:"متوسطة", value:7 },
    { name:"الكثافة السكانية", weight:15, selected:"متوسطة", value:10 },
    { name:"تكلفة أعمال التطوير والتحسين", weight:10, selected:"عالية", value:3 },
    { name:"كثرة البلاغات والشكاوي", weight:15, selected:"عالية", value:15, photos:samplePhotos.slice(0,2) },
  ]},
  { id:"demo-4", name:"حديقة الأندلس", project:"مشروع التحلية", district:"حي الأندلس", score:58, lastEvaluation:"24 أبريل 2026", criteria:[
    { name:"تصنيف الحديقة", weight:15, selected:"مساحة منخفضة أقل من 1500 م²", value:5 },
    { name:"البنية التحتية", weight:20, selected:"تربة زراعية + أشجار", value:7 },
    { name:"وجود حدائق بالقرب من الموقع", weight:15, selected:"قريب عن الموقع 500 م.ط", value:5 },
    { name:"الأرصفة أو الممرات", weight:10, selected:"جيدة", value:10, photos:samplePhotos.slice(0,1) },
    { name:"الكثافة السكانية", weight:15, selected:"منخفضة", value:5 },
    { name:"تكلفة أعمال التطوير والتحسين", weight:10, selected:"عالية", value:3 },
    { name:"كثرة البلاغات والشكاوي", weight:15, selected:"متوسطة", value:10 },
  ]},
];

export function getPriority(score: number) {
  if (score >= 90) return { label: "قصوى", range: "90 - 100", tone: "red" as Tone, text: "تدخل عاجل" };
  if (score >= 75) return { label: "عالية", range: "75 - 89", tone: "orange" as Tone, text: "صيانة قريبة" };
  if (score >= 65) return { label: "متوسطة", range: "65 - 74", tone: "yellow" as Tone, text: "ضمن الخطة" };
  return { label: "منخفضة", range: "50 - 64", tone: "emerald" as Tone, text: "متابعة دورية" };
}
export function getMainReasons(garden: GardenAssessment) {
  return [...garden.criteria].sort((a,b)=>b.value-a.value).slice(0,3);
}