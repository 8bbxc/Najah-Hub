import React from 'react';

const AthkarBar = () => {
  const athkarList = [
    { text: "سبحان الله وبحمده، سبحان الله العظيم", emoji: "🌿" },
    { text: "اللهم صلِّ وسلم على نبينا محمد", emoji: "❤️‍🩹" },
    { text: "لا حول ولا قوة إلا بالله", emoji: "💪" },
    { text: "أستغفر الله العظيم وأتوب إليه", emoji: "📿" },
    { text: "الحمد لله رب العالمين", emoji: "🙌" },
    { text: "لا إله إلا الله وحده لا شريك له", emoji: "☝️" },
    { text: "اللهم إنك عفو تحب العفو فاعفُ عنا", emoji: "🤲" },
    { text: "رضيت بالله رباً، وبالإسلام ديناً، وبمحمد ﷺ نبياً", emoji: "❤️‍🩹" }
  ];

  return (
    <div className="athkar-bar bg-najah-primary text-white h-10 overflow-hidden relative shadow-md border-b border-green-800 flex items-center select-none" dir="ltr">
      
      {/* الحاوية السحرية:
        كررنا القائمة 4 مرات.
        الأنيميشن يحرك الشريط لليسار.
        بمجرد ما "المجموعة الأولى" تختفي، بنرجع الشريط للصفر فوراً.
        بما ان "المجموعة الثانية" صارت مكان الأولى، ما حدا بلاحظ القفزة!
      */}
      <div className="flex animate-infinite-scroll whitespace-nowrap will-change-transform">
        
        {/* نكرر الكود 4 مرات لضمان تغطية الشاشات الكبيرة جداً ومنع الفراغ الأبيض */}
        {[...Array(4)].map((_, groupIndex) => (
          <div key={groupIndex} className="flex gap-12 mx-6 items-center">
            {athkarList.map((item, index) => (
              <span key={`${groupIndex}-${index}`} className="text-sm font-bold inline-flex items-center gap-3 tracking-wide">
                <span className="text-lg filter drop-shadow-sm">{item.emoji}</span>
                {item.text}
              </span>
            ))}
          </div>
        ))}

      </div>

      <style>{`
        .animate-infinite-scroll {
          display: flex;
          /* حركة خطية مستمرة للأبد */
          animation: infinite-scroll 60s linear infinite;
        }
        
        /* يوقف الحركة لما تحط الماوس عليه */
        .animate-infinite-scroll:hover {
          animation-play-state: paused;
        }

        @keyframes infinite-scroll {
          0% { transform: translateX(0); }
          /* السر هنا: نتحرك -25% فقط.
             لأننا كررنا المحتوى 4 مرات، فالـ 25% هي عرض "نسخة واحدة".
             لما نوصل -25%، النسخة رقم 2 بتكون صارت مكان النسخة رقم 1 بالضبط.
             فبنقدر نرجع لـ 0 بدون ما العين تلاحظ!
          */
          100% { transform: translateX(-25%); }
        }

        @media (max-width: 768px) {
          .animate-infinite-scroll {
            animation-duration: 40s; /* أسرع شوية عالموبايل */
          }
        }
      `}</style>
    </div>
  );
};

export default AthkarBar;