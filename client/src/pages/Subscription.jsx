import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

const API = import.meta.env.VITE_API_BASE || 'https://najah-backend-ykto.onrender.com';

export default function Subscription() {
  const [plans, setPlans] = useState([]);
  const [me, setMe] = useState(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axios.get(`${API}/api/subscription/plans`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setPlans(res.data || []);
      } catch (e) {
        console.error(e);
      }
    };
    fetch();
  }, []);

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const r = await axios.get(`${API}/api/subscription/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMe(r.data || null);
      } catch (e) {
        /* ignore if endpoint missing */
      }
    };
    fetchMe();
  }, []);

  const buy = async (planId) => {
    try {
      const res = await axios.post(
        `${API}/api/subscription/purchase`,
        { planId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Purchase simulated: ' + (res.data.message || 'ok'));
    } catch (e) {
      alert('Failed to purchase');
    }
  };

  const isOwner = JSON.parse(localStorage.getItem('user'))?.universityId === '0000';

  // if backend returned no plans, provide sensible defaults
  const defaultPlans = [
    {
      id: 'free',
      name: 'Free',
      priceCents: 0,
      interval: 'month',
      features: ['عرض عام للمجتمعات العامة', 'دعم أساسي'],
    },
    {
      id: 'pro',
      name: 'Pro',
      priceCents: 500,
      interval: 'month',
      features: ['الوصول إلى مجتمعات مدفوعة', 'دعم أولوي', 'مزايا الذكاء الاصطناعي: ملخصات ذكية'],
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      priceCents: 2900,
      interval: 'month',
      features: ['كل مزايا Pro', 'مشاركة ملفات كبيرة', 'دعم مميز'],
    },
  ];

  const displayPlans = plans && plans.length ? plans : defaultPlans;
  const renderPlanCards = () => {
    return displayPlans.map((p, idx) => {
      const cardClass =
        idx === 2
          ? 'rounded-2xl p-6 shadow-md border-2 border-blue-400 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100'
          : 'rounded-2xl p-6 shadow-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100';
      return (
        <div key={p.id} className={cardClass}>
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold">{p.name}</h3>
            <div className="text-right">
              <div className="text-3xl font-extrabold text-gray-900 dark:text-white">{'$' + (p.priceCents / 100).toFixed(0)}</div>
              <div className="text-sm text-gray-500 dark:text-gray-300">/{p.interval}</div>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600 dark:text-gray-300">
            <ul className="space-y-2">
              {(p.features || []).map((f, i) => (
                <li key={i}>• {f}</li>
              ))}
              <li>• مزايا الذكاء الاصطناعي: دردشات ذكية، تلخيص، وأدوات تعليمية</li>
            </ul>
          </div>
          <div className="mt-6">
            {!isOwner ? (
              <button onClick={() => buy(p.id)} className="w-full admin-btn">
                اشترك الآن
              </button>
            ) : (
              <div className="text-center text-sm text-gray-400 p-3 border rounded">أنت المالك — زر الاشتراك مخفي</div>
            )}
          </div>
        </div>
      );
    });
  };

  return (
    <div className="min-h-screen app-bg font-sans">
      <Navbar user={JSON.parse(localStorage.getItem('user'))} />
      <div className="max-w-7xl mx-auto p-4 md:p-6 flex gap-8 lg:pr-[280px]">

        <div className="flex-1">
          <div className="max-w-4xl mx-auto p-6">
            <div className="text-center mb-10">
              <h1 className="text-4xl font-extrabold">خطط الأسعار</h1>
              <p className="text-gray-500 mt-2">اختر الخطة المناسبة لاحتياجاتك كطالب — تبدأ الخطط من 5$ شهريًا مع مزايا الذكاء الاصطناعي.</p>
            </div>

            {me && (
              <div className="mb-4 p-4 rounded border card-bg">
                <div className="font-bold">اشتراكك الحالي</div>
                <div className="text-sm text-gray-600">{me.planName || 'لا توجد اشتراكات'}</div>
                <div className="text-xs text-gray-400">ينتهي في: {me.expiresAt ? new Date(me.expiresAt).toLocaleDateString() : '-'}</div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {renderPlanCards()}
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border text-gray-900 dark:text-gray-100">
              <h3 className="text-2xl font-bold mb-4">قارن الخطط</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-600">
                    <th className="py-2">الميزة</th>
                    {displayPlans.map((p) => (
                      <th key={p.id} className="py-2">
                        {p.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t">
                    <td className="py-3">عام</td>
                    <td className="py-3">✓</td>
                    <td className="py-3">✓</td>
                    <td className="py-3">✓</td>
                  </tr>
                  <tr className="border-t">
                    <td className="py-3">خاص - مجتمعات دفعات</td>
                    <td className="py-3">✗</td>
                    <td className="py-3">✓</td>
                    <td className="py-3">✓</td>
                  </tr>
                  <tr className="border-t">
                    <td className="py-3">مزايا الذكاء الاصطناعي</td>
                    <td className="py-3">محدودة</td>
                    <td className="py-3">✓</td>
                    <td className="py-3">✓</td>
                  </tr>
                  <tr className="border-t">
                    <td className="py-3">دعم أولوي</td>
                    <td className="py-3">✗</td>
                    <td className="py-3">✓</td>
                    <td className="py-3">✓</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
                    
