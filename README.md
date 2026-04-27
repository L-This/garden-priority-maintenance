# نظام مؤشر أولوية صيانة الحدائق - نسخة Supabase

الصفحات:
- `/dashboard` لوحة النتائج
- `/assessment` إدخال تقييم جديد

## خطوات التشغيل على Vercel

### 1) شغل SQL في Supabase
افتح:
Supabase > SQL Editor > New Query

انسخ محتوى الملف:
`supabase/schema.sql`

ثم اضغط Run.

### 2) أضف متغيرات البيئة في Vercel
Project Settings > Environment Variables

أضف:

```text
NEXT_PUBLIC_SUPABASE_URL=https://ydyrpkstkuhbaqwhlwdp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=ضع_anon_key_هنا
```

ثم Redeploy.

### 3) التجربة
افتح `/assessment` وأدخل تقييم جديد مع صور.
ثم افتح `/dashboard` واضغط تحديث البيانات.

## ملاحظة أمنية
السياسات الحالية مفتوحة للتجربة فقط. في النسخة الإنتاجية نضيف تسجيل دخول وصلاحيات للمشرفين.


## تحديث الأزرار

تم تعديل لوحة النتائج لتدعم:
- عرض البيانات الحقيقية من Supabase
- عرض البيانات التجريبية من الكود فقط بدون حفظها في القاعدة
- حذف البيانات التجريبية القديمة من القاعدة
- عدم خلط التجريبي مع الحقيقي

مهم: شغّل `supabase/schema.sql` مرة أخرى لإضافة عمود `is_demo`.
