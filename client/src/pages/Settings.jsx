import { useEffect, useState } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { API } from '../utils/api';

const Settings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    theme: { mode: 'dark', primary: '#0ea5e9' },
    notifications: { inApp: true, email: false },
    communityDefaults: { privacy: 'public', batch: null, autoJoin: false },
    ownerPrivileges: { allowOwnerLeave: false },
    messageSettings: { showAvatars: true, bubbleStyle: 'rounded', showTimestamps: true },
    cloudinaryCleanup: false
  });

  const token = localStorage.getItem('token');
  const config = { headers: { Authorization: `Bearer ${token}` } };

  const currentUser = JSON.parse(localStorage.getItem('user'));
  const isAdmin = String(currentUser?.universityId).trim() === '0000';

  useEffect(() => { fetch(); }, []);

  const applyTheme = (s) => {
    const mode = s?.theme?.mode || 'dark';
    const primary = s?.theme?.primary || '#0ea5e9';
    if (mode === 'dark') document.documentElement.classList.add('dark'); else document.documentElement.classList.remove('dark');
    try {
      document.documentElement.style.setProperty('--najah-primary', primary);
      document.documentElement.style.setProperty('--najah-accent', primary);
      document.documentElement.style.setProperty('--accent', primary);
    } catch (e){}
  };

  const fetch = async () => {
    setLoading(true);
    try {
      if (!isAdmin) {
        const local = localStorage.getItem('userSettings');
        if (local) {
          const parsed = JSON.parse(local);
          setSettings(parsed);
          applyTheme(parsed);
        }
      } else {
        const res = await axios.get(`${API}/api/admin/settings`, config);
        if (res.data?.settings) {
          setSettings(res.data.settings);
          applyTheme(res.data.settings);
        }
      }
    } catch (err) {
      console.error('Failed to fetch settings', err);
      alert('فشل جلب الإعدادات');
    } finally { setLoading(false); }
  };

  const save = async () => {
    setSaving(true);
    try {
      if (!isAdmin) {
        localStorage.setItem('userSettings', JSON.stringify(settings));
        applyTheme(settings);
        alert('تم حفظ إعداداتك محليًا');
      } else {
        const res = await axios.put(`${API}/api/admin/settings`, settings, config);
        // show inline banner instead of alert
        setSavingMessage('تم حفظ الإعدادات بنجاح');
        if (res.data?.settings) {
          setSettings(res.data.settings);
          applyTheme(res.data.settings);
        }
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || err.message || 'فشل حفظ الإعدادات');
    } finally { setSaving(false); }
  };

  const [savingMessage, setSavingMessage] = useState(null);

  if (loading) return <div className="min-h-screen flex items-center justify-center">جارٍ التحميل...</div>;

  return (
    <div className="min-h-screen admin-surface font-sans">
      <Navbar user={JSON.parse(localStorage.getItem('user'))} />
      <div className="max-w-7xl mx-auto p-4 md:p-6 flex gap-8 lg:pr-[280px]">
        <div className="flex-1" dir="rtl">
          <h1 className="text-2xl font-black mb-4">إعدادات النظام</h1>

          <section className="card-bg p-6 rounded-2xl mb-4">
            <h3 className="font-bold mb-2">ثيم الموقع</h3>
            <div className="flex gap-3 items-center">
              <select value={settings.theme.mode} onChange={e=>setSettings(s=>({...s, theme: {...s.theme, mode: e.target.value}}))} className="p-2 border rounded">
                <option value="dark">داكن</option>
                <option value="light">فاتح</option>
              </select>
              <input type="color" value={settings.theme.primary} onChange={e=>setSettings(s=>({...s, theme: {...s.theme, primary: e.target.value}}))} title="Primary color" />
            </div>
          </section>

          <section className="card-bg p-6 rounded-2xl mb-4">
            <h3 className="font-bold mb-2">الإشعارات</h3>
            <label className="flex items-center gap-2"><input type="checkbox" checked={!!settings.notifications.inApp} onChange={e=>setSettings(s=>({...s, notifications: {...s.notifications, inApp: e.target.checked}}))} /> إشعارات داخل التطبيق</label>
            <label className="flex items-center gap-2 mt-2"><input type="checkbox" checked={!!settings.notifications.email} onChange={e=>setSettings(s=>({...s, notifications: {...s.notifications, email: e.target.checked}}))} /> إشعارات عبر البريد</label>
          </section>

          <section className="card-bg p-6 rounded-2xl mb-4">
            <h3 className="font-bold mb-2">إعدادات المجتمعات الافتراضية</h3>
            <label className="block mb-2">الخصوصية
              <select value={settings.communityDefaults.privacy} onChange={e=>setSettings(s=>({...s, communityDefaults: {...s.communityDefaults, privacy: e.target.value}}))} className="w-full p-2 border rounded mt-1">
                <option value="public">عام</option>
                <option value="private">خاص</option>
              </select>
            </label>
            <label className="block mb-2">الدفعة الافتراضية
              <input className="w-full p-2 border rounded mt-1" value={settings.communityDefaults.batch || ''} onChange={e=>setSettings(s=>({...s, communityDefaults: {...s.communityDefaults, batch: e.target.value}}))} placeholder="رقم الدفعة أو اترك فارغ" />
            </label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={!!settings.communityDefaults.autoJoin} onChange={e=>setSettings(s=>({...s, communityDefaults: {...s.communityDefaults, autoJoin: e.target.checked}}))} /> تفعيل الانضمام التلقائي للمجتمعات</label>
          </section>

          <section className="card-bg p-6 rounded-2xl mb-4">
            <h3 className="font-bold mb-2">صلاحيات المالك</h3>
            <label className="flex items-center gap-2"><input type="checkbox" checked={!!settings.ownerPrivileges.allowOwnerLeave} onChange={e=>setSettings(s=>({...s, ownerPrivileges: {...s.ownerPrivileges, allowOwnerLeave: e.target.checked}}))} /> السماح للمالك بمغادرة المجتمع</label>
          </section>

          <section className="card-bg p-6 rounded-2xl mb-4">
            <h3 className="font-bold mb-2">إعدادات المحادثة</h3>
            <label className="flex items-center gap-2"><input type="checkbox" checked={!!settings.messageSettings.showAvatars} onChange={e=>setSettings(s=>({...s, messageSettings: {...s.messageSettings, showAvatars: e.target.checked}}))} /> إظهار الصور الرمزية في المحادثة</label>
            <label className="block mt-2">نمط الفقاعة
              <select value={settings.messageSettings.bubbleStyle} onChange={e=>setSettings(s=>({...s, messageSettings: {...s.messageSettings, bubbleStyle: e.target.value}}))} className="w-full p-2 border rounded mt-1">
                <option value="rounded">مستدير</option>
                <option value="pill">مستطيل طويل</option>
              </select>
            </label>
            <label className="flex items-center gap-2 mt-2"><input type="checkbox" checked={!!settings.messageSettings.showTimestamps} onChange={e=>setSettings(s=>({...s, messageSettings: {...s.messageSettings, showTimestamps: e.target.checked}}))} /> إظهار الطوابع الزمنية</label>
          </section>

          <section className="card-bg p-6 rounded-2xl mb-4">
            <h3 className="font-bold mb-2">ملفات وCloudinary</h3>
            <label className="flex items-center gap-2"><input type="checkbox" checked={!!settings.cloudinaryCleanup} onChange={e=>setSettings(s=>({...s, cloudinaryCleanup: e.target.checked}))} /> حذف الميديا من Cloudinary عند حذف المجتمع</label>
          </section>

          <div className="flex gap-3">
            <button onClick={save} disabled={saving} className="admin-btn">{saving ? 'جارٍ الحفظ...' : 'حفظ الإعدادات'}</button>
            <button onClick={fetch} className="admin-btn-outline">إعادة تحميل</button>
          </div>
          {savingMessage && (
            <div className="mt-4 save-banner">{savingMessage}</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
